import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
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
    // 2. Hapus token lama milik user ini jika ada (upsert by userId)
    await prisma.tokenAktivasiTelegram.deleteMany({
      where: { userId },
    })

    // 3. Buat token aktivasi baru — sekali pakai, expire 24 jam
    const aktivasiToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.tokenAktivasiTelegram.create({
      data: {
        userId,
        token: aktivasiToken,
        expiresAt,
      },
    })

    // 4. Buat deep link Telegram
    const botUsername = process.env.TELEGRAM_BOT_USERNAME ?? "MonevSakaBot"
    const deepLink = `https://t.me/${botUsername}?start=${aktivasiToken}`

    return NextResponse.json({ deepLink })
  } catch (err) {
    console.error("[POST /api/auth/telegram/activate]", err)
    return NextResponse.json(
      { error: "Gagal membuat token aktivasi" },
      { status: 500 }
    )
  }
}
