import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { buatPenerimaKipk } from "@/lib/penerima-kipk";
import { signSessionToken, SESSION_COOKIE_OPTIONS } from "@/lib/auth-server";
import { z } from "zod";

const VerifyOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  otp: z.string().length(6, "Kode OTP harus 6 digit"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = VerifyOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // ── Cari User ──────────────────────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      );
    }

    // ── Ambil OTP terbaru ─────────────────────────────────────────────────
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!otpToken) {
      return NextResponse.json(
        { error: "Tidak ada OTP aktif. Silakan kirim ulang OTP." },
        { status: 400 }
      );
    }

    // ── Cek Expired ───────────────────────────────────────────────────────
    if (otpToken.expiresAt < new Date()) {
      await prisma.otpToken.delete({
        where: { id: otpToken.id },
      });

      return NextResponse.json(
        { error: "Kode OTP sudah kadaluarsa. Silakan kirim ulang OTP." },
        { status: 400 }
      );
    }

    // ── Verifikasi OTP ────────────────────────────────────────────────────
    const isValid = await verifyOtp(otp, otpToken.code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Kode OTP salah." },
        { status: 401 }
      );
    }

    // ── Alur registrasi Mahasiswa KIP-K (verify-kandidat → send-otp-sso) —
    //    kandidatId hanya terisi untuk alur ini, bukan login role lain
    //    (Pewawancara/Admin/login SSO biasa). Buat penerima_kipk di sini,
    //    titik terakhir sebelum JWT dikeluarkan.
    if (otpToken.kandidatId) {
      const hasil = await buatPenerimaKipk(otpToken.kandidatId, user.id);
      if (!hasil.ok) {
        await prisma.otpToken.delete({ where: { id: otpToken.id } });
        return NextResponse.json({ error: hasil.error }, { status: 403 });
      }
    }

    // ── Tentukan role sesi dari halaman/URL login yang dipakai ────────────
    // (otpToken.intendedRole diisi saat OTP dikirim — /login ->
    // MAHASISWA_KIPK, /pewawancara-login -> PEWAWANCARA). Ini menggantikan
    // users.role skalar tanpa perlu menanyakan ulang ke user meski akunnya
    // multi-role: role ditentukan oleh URL yang dipakai untuk login, bukan
    // dipilih di layar terpisah.
    let role = otpToken.intendedRole;

    // Fallback untuk baris OTP lama (dibuat sebelum kolom ini ada) atau
    // kasus tak terduga lain — pakai role satu-satunya kalau memang cuma
    // ada 1, supaya tidak mengunci user yang OTP-nya sempat tertunda.
    if (!role) {
      const roles = await prisma.userRole.findMany({ where: { userId: user.id } });
      if (roles.length !== 1) {
        await prisma.otpToken.delete({ where: { id: otpToken.id } });
        return NextResponse.json(
          { error: "Tidak bisa menentukan role login. Silakan kirim ulang OTP." },
          { status: 400 }
        );
      }
      role = roles[0].role;
    }

    // Defense-in-depth: pastikan user BENAR-BENAR masih punya role ini
    // sekarang (bisa saja dicabut admin di antara request OTP & verifikasi).
    const ownedRole = await prisma.userRole.findUnique({
      where: { userId_role: { userId: user.id, role } },
    });
    if (!ownedRole) {
      await prisma.otpToken.delete({ where: { id: otpToken.id } });
      return NextResponse.json(
        { error: "Akun ini tidak lagi memiliki role tersebut. Hubungi admin." },
        { status: 403 }
      );
    }

    // ── Hapus OTP setelah berhasil diverifikasi ──────────────────────────
    await prisma.otpToken.delete({
      where: {
        id: otpToken.id,
      },
    });

    const jwt = await signSessionToken({ id: user.id, email: user.email, role });

    const response = NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil",
      user: { id: user.id, email: user.email, role },
    });

    response.cookies.set("sakti_token", jwt, SESSION_COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error("[verify-otp]", err);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}