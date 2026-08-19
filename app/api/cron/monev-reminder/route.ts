import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

// Hari-hari trigger pengingat (hari tersisa sebelum deadline)
const TRIGGER_DAYS = [30, 7, 3, 2, 1]

// Helper: kirim pesan ke satu user via Telegram Bot API
async function sendMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// Helper: build pesan sesuai urgency
function buildMessage(label: string, deadline: Date, daysLeft: number): string {
  const formattedDate = deadline.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
  const monevUrl = `${APP_URL}/mahasiswa/monev`

  // H-3, H-2, H-1 — pesan urgensi
  if (daysLeft <= 3) {
    return (
      `⚠️ <b>SEGERA ISI MONEV!</b>\n\n` +
      `Halo! Waktu pengisian <b>${label}</b> hampir habis!\n\n` +
      `📅 Deadline: <b>${formattedDate}</b>\n` +
      `🚨 Sisa waktu: <b>HANYA ${daysLeft} hari lagi!</b>\n\n` +
      `Segera isi sekarang sebelum terlambat:\n` +
      `👉 <a href="${monevUrl}">Isi Monev Sekarang</a>\n\n` +
      `Status beasiswa KIPK Anda bergantung pada pengisian ini.`
    )
  }

  // H-30, H-7 — pesan pengingat normal
  return (
    `🔔 <b>Pengingat Monev KIPK</b>\n\n` +
    `Halo! Jangan lupa mengisi <b>${label}</b>.\n\n` +
    `📅 Deadline: <b>${formattedDate}</b>\n` +
    `⏳ Sisa waktu: <b>${daysLeft} hari lagi</b>\n\n` +
    `Isi melalui aplikasi SAKTI:\n` +
    `👉 <a href="${monevUrl}">Isi Monev Sekarang</a>`
  )
}

export async function POST(req: NextRequest) {
  // 1. Validasi CRON_SECRET dari Authorization header
  const authHeader = req.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Awal hari ini (untuk cek duplikasi log)
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  try {
    // 2. Ambil semua jadwal Monev yang aktif dan belum melewati deadline
    const activeSchedules = await prisma.periode_monev.findMany({
      where: {
        isActive: true,
        deadline: { gt: now },
      },
    })

    if (activeSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Tidak ada jadwal Monev aktif",
        processedAt: now.toISOString(),
        processed: 0,
        results: [],
      })
    }

    const results = []

    for (const schedule of activeSchedules) {
      // 3. Hitung sisa hari hingga deadline
      const daysLeft = Math.ceil(
        (schedule.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      // 4. Skip jika bukan hari trigger
      if (!TRIGGER_DAYS.includes(daysLeft)) {
        results.push({
          scheduleId: schedule.id,
          label: schedule.label,
          daysLeft,
          skipped: true,
          reason: `Bukan hari trigger (H-${daysLeft})`,
        })
        continue
      }

      // 5. Cek apakah sudah pernah kirim hari ini untuk kombinasi ini
      const existingLog = await prisma.log_notifikasi.findFirst({
        where: {
          periode_monev_id: schedule.id,
          triggerDay: daysLeft,
          sentAt: { gte: todayStart },
        },
      })

      if (existingLog) {
        results.push({
          scheduleId: schedule.id,
          label: schedule.label,
          triggerDay: daysLeft,
          skipped: true,
          reason: "Sudah terkirim hari ini",
        })
        continue
      }

      // 6. Ambil user_id yang sudah submit untuk jadwal ini
      const submissions = await prisma.pengisian_monev.findMany({
        where: { periode_monev_id: schedule.id },
        select: { user_id: true },
      })
      const submittedUserIds = new Set(submissions.map((s) => s.user_id))

      // 7. Ambil semua penerima KIPK yang punya telegram_id
      //    dan belum submit untuk jadwal ini
      const allPenerima = await prisma.penerimaKipk.findMany({
        where: {
          telegramId: { not: null },
          userId: { not: null },
        },
        select: { telegramId: true, nama: true, userId: true },
      })

      const targets = allPenerima.filter(
        (p) => p.userId && !submittedUserIds.has(p.userId)
      )

      // 8. Kirim notifikasi ke setiap penerima
      let totalSent = 0
      let totalFailed = 0
      const message = buildMessage(schedule.label, schedule.deadline, daysLeft)

      for (const target of targets) {
        if (!target.telegramId) continue
        const ok = await sendMessage(target.telegramId.toString(), message)
        if (ok) totalSent++
        else totalFailed++
      }

      // 9. Simpan log pengiriman
      await prisma.log_notifikasi.create({
        data: {
          periode_monev_id: schedule.id,
          triggerDay: daysLeft,
          totalSent,
          totalFailed,
          sentAt: now,
        },
      })

      results.push({
        scheduleId: schedule.id,
        label: schedule.label,
        triggerDay: daysLeft,
        totalTargets: targets.length,
        totalSent,
        totalFailed,
        skipped: false,
      })
    }

    const processedCount = results.filter((r) => !r.skipped).length

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      processed: processedCount,
      results,
    })
  } catch (err) {
    console.error("[POST /api/cron/monev-reminder]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}


