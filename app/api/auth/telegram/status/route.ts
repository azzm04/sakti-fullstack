import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getApiUser } from "@/lib/auth-server"
import { NO_STORE_HEADERS } from "@/lib/security"
import { getChatCached, maskUsername, shortDisplayName } from "@/lib/telegram"

export async function GET(req: NextRequest) {
  const auth = await getApiUser(req, "MAHASISWA_KIPK")
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.reason === 401 ? "Tidak terautentikasi" : "Fitur ini hanya untuk mahasiswa KIPK" },
      { status: auth.reason },
    )
  }

  try {
    const penerima = await prisma.penerimaKipk.findUnique({
      where: { userId: auth.user.id },
      select: { telegramId: true },
    })

    if (!penerima?.telegramId) {
      return NextResponse.json({ connected: false }, { headers: NO_STORE_HEADERS })
    }

    // ID numerik tidak dikirim ke browser (PRD v2.1 F3.1). Nama/username
    // ditampilkan supaya mahasiswa bisa memastikan akun yang terhubung.
    const chat = await getChatCached(penerima.telegramId)
    return NextResponse.json(
      {
        connected: true,
        telegramName: shortDisplayName(chat),
        telegramUsername: maskUsername(chat?.username),
      },
      { headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    console.error("[GET /api/auth/telegram/status]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Gagal mengambil status Telegram" }, { status: 500 })
  }
}
