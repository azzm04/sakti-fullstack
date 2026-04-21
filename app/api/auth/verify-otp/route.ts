import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyOtp } from "@/lib/otp"
import { SignJWT } from "jose"
import { z } from "zod"

const VerifyOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  otp: z.string().length(6, "Kode OTP harus 6 digit"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = VerifyOtpSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, otp } = result.data
    const normalizedEmail = email.toLowerCase().trim()

    // ── Cari user beserta 1 OTP yang paling BARU ────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { 
        otpTokens: {
          orderBy: { createdAt: "desc" }, // Selalu ambil OTP terakhir yang di-generate
          take: 1
        },
        whitelist: true 
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      )
    }

    const otpToken = user.otpTokens[0]
    if (!otpToken) {
      return NextResponse.json(
        { error: "Tidak ada OTP yang aktif. Silakan kirim ulang OTP." },
        { status: 400 }
      )
    }

    // ── Cek OTP expired ──────────────────────────────────────────────────────
    if (otpToken.expiresAt < new Date()) {
      await prisma.otpToken.delete({ where: { id: otpToken.id } })
      return NextResponse.json(
        { error: "Kode OTP sudah kadaluarsa. Silakan kirim ulang OTP." },
        { status: 400 }
      )
    }

    // ── Verifikasi OTP ───────────────────────────────────────────────────────
    const isValid = await verifyOtp(otp, otpToken.code)
    if (!isValid) {
      return NextResponse.json(
        { error: "Kode OTP salah. Silakan coba lagi." },
        { status: 401 }
      )
    }

    // ── OTP Valid: Hapus OTP & Aktivasi akun ─────────────────────────────────
    await prisma.otpToken.delete({ where: { id: otpToken.id } })

    // Aktivasi whitelist (INI YANG PALING PENTING DARI FLOW BARU)
    await prisma.ssoWhitelist.update({
      where: { email: normalizedEmail },
      data: { isActive: true },
    })

    // ── Generate JWT Token ───────────────────────────────────────────────────
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const jwt = await new SignJWT({
      sub: user.id,
      role: user.whitelist.role,
      email: user.email,
      nama: user.nama,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    const res = NextResponse.json({
      success: true,
      message: "Verifikasi berhasil! Anda akan diarahkan ke dashboard.",
      user: {
        email: user.email,
        nama: user.nama,
        role: user.whitelist.role,
      },
    })

    // Set cookie
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
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}