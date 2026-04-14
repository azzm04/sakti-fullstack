import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOtp } from "@/lib/otp"
import { SignJWT } from "jose"
import { VerifyOtpSchema } from "@/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validasi input
    const result = VerifyOtpSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, otp } = result.data

    // Cari user beserta OTP yang belum dipakai
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        otpTokens: {
          where: { used: false },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    })

    if (!user || user.otpTokens.length === 0) {
      return NextResponse.json(
        { error: "OTP tidak valid, minta kode baru" },
        { status: 400 }
      )
    }

    const token = user.otpTokens[0]

    // Cek apakah OTP sudah kadaluarsa
    if (new Date() > token.expiresAt) {
      return NextResponse.json(
        { error: "OTP sudah kadaluarsa, minta kode baru" },
        { status: 400 }
      )
    }

    // Verifikasi kode OTP
    const valid = await verifyOtp(otp, token.code)
    if (!valid) {
      return NextResponse.json(
        { error: "Kode OTP salah" },
        { status: 400 }
      )
    }

    // Tandai OTP sebagai sudah dipakai
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { used: true },
    })

    // Buat JWT session
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const jwt = await new SignJWT({
      sub: user.id,
      role: user.role,
      email: user.email,
      nama: user.nama,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    // Set JWT sebagai httpOnly cookie
    const res = NextResponse.json({
      success: true,
      role: user.role,
      nama: user.nama,
    })

    res.cookies.set("sakti_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    })

    return res
  } catch (err) {
    console.error("[verify-otp]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server, coba lagi" },
      { status: 500 }
    )
  }
}
