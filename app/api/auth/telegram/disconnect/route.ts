import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getApiUser } from "@/lib/auth-server"
import { createRateLimiter } from "@/lib/rate-limit"
import { isSameOriginRequest, NO_STORE_HEADERS } from "@/lib/security"
import { sendMessage } from "@/lib/telegram"

const disconnectLimiter = createRateLimiter(5, 60 * 1000)

/** Putuskan koneksi Telegram milik user yang login (PRD v2.1 F3.2). */
export async function POST(req: NextRequest) {
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Origin tidak diizinkan" }, { status: 403 })
  }

  const auth = await getApiUser(req, "MAHASISWA_KIPK")
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.reason === 401 ? "Tidak terautentikasi" : "Fitur ini hanya untuk mahasiswa KIPK" },
      { status: auth.reason },
    )
  }
  const userId = auth.user.id

  if (!disconnectLimiter.hit(userId)) {
    return NextResponse.json({ error: "Terlalu banyak permintaan." }, { status: 429 })
  }

  try {
    const penerima = await prisma.penerimaKipk.findUnique({
      where: { userId },
      select: { telegramId: true },
    })

    if (!penerima?.telegramId) {
      return NextResponse.json({ connected: false }, { headers: NO_STORE_HEADERS })
    }

    await prisma.penerimaKipk.update({
      where: { userId },
      data: { telegramId: null },
    })
    console.info(`[telegram] disconnect via web user=${userId}`)

    // Pesan perpisahan — gagal kirim tidak membatalkan pemutusan
    await sendMessage(
      penerima.telegramId,
      "🔕 Akun Telegram ini sudah <b>diputus</b> dari SAKTI. Anda tidak akan menerima pengingat Monev lagi.\n\n" +
        "Untuk menghubungkan kembali, buat kode aktivasi baru di aplikasi SAKTI.",
    )

    return NextResponse.json({ connected: false }, { headers: NO_STORE_HEADERS })
  } catch (err) {
    console.error("[POST /api/auth/telegram/disconnect]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Gagal memutus koneksi Telegram" }, { status: 500 })
  }
}
