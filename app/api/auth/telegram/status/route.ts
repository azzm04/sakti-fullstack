import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  // 1. Autentikasi — ambil JWT dari cookie
  const token = req.cookies.get("sakti_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
  }

  let userId: string
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    userId = payload.sub as string
  } catch {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
  }

  try {
    const penerima = await prisma.penerimaKipk.findUnique({
      where: { userId },
      select: { telegramId: true },
    })

    // User belum punya baris di penerima_kipk
    if (!penerima) {
      return NextResponse.json({ connected: false })
    }

    if (penerima.telegramId) {
      return NextResponse.json({
        connected: true,
        // BigInt tidak bisa di-serialize JSON langsung, convert ke string
        telegramId: penerima.telegramId.toString(),
      })
    }

    return NextResponse.json({ connected: false })
  } catch (err) {
    console.error("[GET /api/auth/telegram/status]", err)
    return NextResponse.json(
      { error: "Gagal mengambil status Telegram" },
      { status: 500 }
    )
  }
}
