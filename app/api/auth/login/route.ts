import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { z } from "zod";

const LoginSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .regex(
      /@students\.undip\.ac\.id$/,
      "Email harus menggunakan domain @students.undip.ac.id",
    ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = LoginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // ── 1. Cari atau Buat User Baru ──────────────────────────────────────────
    // Menggunakan upsert agar email yang sama tidak membuat data duplikat
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        statusAkun: "AKTIF",
      },
      update: {},
      include: {
        pewawancara: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_role: { userId: user.id, role: "MAHASISWA_KIPK" } },
      create: { userId: user.id, role: "MAHASISWA_KIPK" },
      update: {},
    });

    // ── 2. Bersihkan OTP lama sebelum buat yang baru ──────────────────────────
    await prisma.otpToken.deleteMany({
      where: { userId: user.id },
    });

    // ── 3. Generate & Simpan OTP Baru ────────────────────────────────────────
    const otp = generateOtp();
    const hashed = await hashOtp(otp);

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        code: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // OTP berlaku 5 menit
        // Login lewat halaman ini selalu dimaksudkan sebagai Mahasiswa
        // KIP-K — dipakai verify-otp untuk langsung menerbitkan sesi
        // dengan role itu, walau akunnya multi-role.
        intendedRole: "MAHASISWA_KIPK",
      },
    });

    // ── 4. Kirim OTP ke Email SSO ─────────────────────────────────────────────
    // Catatan: Pastikan sendOtpEmail bisa menangani user.nama yang mungkin null
    await sendOtpEmail(
      normalizedEmail,
      otp,
      user.pewawancara?.nama || "Mahasiswa",
    );

    return NextResponse.json({
      success: true,
      message: `Kode OTP telah dikirim ke ${normalizedEmail}`,
    });
  } catch (err) {
    console.error("[login error]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses login" },
      { status: 500 },
    );
  }
}
