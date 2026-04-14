import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { generateOtp, hashOtp } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/mailer"
import { SendOtpSchema } from "@/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validasi format email SSO
    const result = SendOtpSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email } = result.data

    // Cek apakah email ada di whitelist dan aktif
    const whitelist = await prisma.ssoWhitelist.findUnique({
      where: { email: email.toLowerCase(), isActive: true },
    })

    if (!whitelist) {
      return NextResponse.json(
        { error: "Email tidak terdaftar dalam sistem SAKTI" },
        { status: 403 }
      )
    }

    // Upsert user — buat jika belum pernah login
    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      create: {
        email: email.toLowerCase(),
        nama: whitelist.nama,
        role: whitelist.role,
        whitelistId: whitelist.id,
      },
      update: {},
    })

    // Hapus OTP lama, buat OTP baru
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

    // Kirim OTP ke email
    await sendOtpEmail(email, otp, whitelist.nama)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-otp]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server, coba lagi" },
      { status: 500 }
    )
  }
}
