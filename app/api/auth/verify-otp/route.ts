import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyOtp } from "@/lib/otp";
import { buatPenerimaKipk } from "@/lib/penerima-kipk";
import { SignJWT } from "jose";
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

    // ── Hapus OTP setelah berhasil diverifikasi ──────────────────────────
    await prisma.otpToken.delete({
      where: {
        id: otpToken.id,
      },
    });

    // ── Generate JWT ──────────────────────────────────────────────────────
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET!
    );

    const jwt = await new SignJWT({
      sub: user.id,
      role: user.role,
      email: user.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set("sakti_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[verify-otp]", err);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}