import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

// Helper: kirim pesan ke Telegram — selalu silent fail agar tidak block response
async function sendMessage(chatId: number, text: string): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    })
  } catch (err) {
    console.error("[sendMessage] failed:", err)
  }
}

export async function POST(req: NextRequest) {
  // 1. Validasi webhook secret dari Telegram
  const incomingSecret = req.headers.get("X-Telegram-Bot-Api-Secret-Token")
  if (incomingSecret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 2. Parse body — selalu return 200 agar Telegram tidak retry
  let body: TelegramUpdate
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const message = body?.message
  const chatId = message?.chat?.id
  const text = message?.text ?? ""

  // Abaikan jika bukan message atau bukan perintah /start
  if (!chatId || !text.startsWith("/start")) {
    return NextResponse.json({ ok: true })
  }

  // 3. Ekstrak token dari "/start <token>"
  const parts = text.split(" ")
  const aktivasiToken = parts[1]?.trim()

  if (!aktivasiToken) {
    await sendMessage(
      chatId,
      "⚠️ Perintah tidak valid. Silakan gunakan link aktivasi dari aplikasi SAKTI."
    )
    return NextResponse.json({ ok: true })
  }

  try {
    // 4. Cari token di database, include relasi ke user → penerimaKipk
    const tokenRecord = await prisma.tokenAktivasiTelegram.findUnique({
      where: { token: aktivasiToken },
      include: {
        user: {
          include: { penerimaKipk: true },
        },
      },
    })

    // 5. Validasi: token tidak ditemukan atau sudah expired
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      await sendMessage(
        chatId,
        "⚠️ Link aktivasi tidak valid atau sudah kedaluwarsa.\n\nSilakan ulangi aktivasi melalui aplikasi SAKTI."
      )
      return NextResponse.json({ ok: true })
    }

    // 6. Cek data penerima KIPK
    const penerimaKipk = tokenRecord.user?.penerimaKipk
    if (!penerimaKipk) {
      await sendMessage(
        chatId,
        "❌ Data mahasiswa KIPK tidak ditemukan. Hubungi admin SAKTI."
      )
      return NextResponse.json({ ok: true })
    }

    // 7. Simpan telegram_id ke penerima_kipk
    //    userId pada PenerimaKipk nullable — gunakan tokenRecord.userId yang pasti ada
    await prisma.penerimaKipk.update({
      where: { userId: tokenRecord.userId },
      data: { telegramId: BigInt(chatId) },
    })

    // 8. Hapus token (sekali pakai — tidak bisa digunakan lagi)
    await prisma.tokenAktivasiTelegram.delete({
      where: { id: tokenRecord.id },
    })

    // 9. Kirim pesan konfirmasi ke mahasiswa
    const nama = penerimaKipk.nama ?? "Mahasiswa"
    await sendMessage(
      chatId,
      `✅ <b>Akun Berhasil Terhubung!</b>\n\n` +
        `Halo, <b>${nama}</b>! Akun Telegram Anda kini terhubung ke <b>SAKTI</b>.\n\n` +
        `Anda akan menerima pengingat otomatis sebelum deadline Monev:\n` +
        `• H-30 dari deadline\n` +
        `• H-7 dari deadline\n` +
        `• H-3 dari deadline\n` +
        `• H-2 dari deadline\n` +
        `• H-1 dari deadline\n\n` +
        `Pastikan mengisi Monev tepat waktu agar status beasiswa KIPK tetap aktif. 📚`
    )
  } catch (err) {
    console.error("[POST /api/telegram] error:", err)
    // Tetap return 200 — Telegram tidak perlu retry
  }

  return NextResponse.json({ ok: true })
}

// TypeScript types untuk Telegram Update object
interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: {
      id: number
      first_name?: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    text?: string
  }
}
