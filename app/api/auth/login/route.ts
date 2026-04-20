import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateOtp, hashOtp } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/mailer"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string()
    .email("Format email tidak valid")
    .regex(/@students\.undip\.ac\.id$/, "Email harus menggunakan domain @students.undip.ac.id"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = LoginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data
    const normalizedEmail = email.toLowerCase().trim()

    // ── Cek email ada di whitelist & aktif ──────────────────────────────────
    const whitelist = await prisma.ssoWhitelist.findUnique({
      where: { email: normalizedEmail },
    })

    if (!whitelist) {
      return NextResponse.json(
        { error: "Email SSO tidak terdaftar. Silakan lakukan verifikasi terlebih dahulu." },
        { status: 404 }
      )
    }

    if (!whitelist.isActive) {
      return NextResponse.json(
        { error: "Akun Anda belum diaktivasi. Silakan selesaikan verifikasi OTP terlebih dahulu." },
        { status: 403 }
      )
    }

    // ── Cari/buat user ───────────────────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        nama: whitelist.nama,
        role: whitelist.role,
        whitelistId: whitelist.id,
      },
      update: {},
    })

    // ── Generate & simpan OTP ─────────────────────────────────────────────────
    await prisma.otpToken.deleteMany({ where: { userId: user.id } })

    const otp = generateOtp()
    const hashed = await hashOtp(otp)

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        code: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      },
    })

    // ── Kirim OTP ke email SSO ────────────────────────────────────────────────
    await sendOtpEmail(normalizedEmail, otp, user.nama)

    return NextResponse.json({
      success: true,
      message: `Kode OTP telah dikirim ke ${normalizedEmail}`,
    })

  } catch (err) {
    console.error("[login]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}