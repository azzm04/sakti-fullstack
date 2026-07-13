import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { AdminLoginSchema } from "@/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const result = AdminLoginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { username, password } = result.data

    // Cari admin di database
    const admin = await prisma.adminUser.findUnique({
      where: { username },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      )
    }

    // Verifikasi password
    const valid = await bcrypt.compare(password, admin.password)
    if (!valid) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      )
    }

    // Buat JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const jwt = await new SignJWT({
      sub: admin.id,
      role: "ADMIN_DIRMAWA",
      username: admin.username,
      nama: admin.nama,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret)

    const res = NextResponse.json({
      success: true,
      nama: admin.nama,
    })

    res.cookies.set("sakti_token", jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return res
  } catch (err) {
    console.error("[admin-login]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
