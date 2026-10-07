import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { daysLeftWIB, getOperationalStatus } from "@/lib/monev-schedule"
import { safeEqual } from "@/lib/security"
import {
  escapeHtml,
  getAppUrl,
  getCronSecret,
  getTelegramEnv,
  isUnreachableChat,
  sendMessage,
  sleep,
} from "@/lib/telegram"

// Hari-hari trigger pengingat (hari tersisa sebelum deadline)
const TRIGGER_DAYS = [30, 7, 3, 2, 1]

// Jeda antar pesan: ~25 pesan/detik, di bawah batas Telegram (~30/detik)
const SEND_DELAY_MS = 40

// Helper: build pesan sesuai urgency. Semua nilai dinamis di-escape.
function buildMessage(label: string, deadline: Date, daysLeft: number): string {
  const formattedDate = deadline.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  })
  const safeLabel = escapeHtml(label)
  const monevUrl = escapeHtml(`${getAppUrl()}/mahasiswa/monev`)

  // H-3, H-2, H-1 — pesan urgensi
  if (daysLeft <= 3) {
    return (
      `⚠️ <b>SEGERA ISI MONEV!</b>\n\n` +
      `Halo! Waktu pengisian <b>${safeLabel}</b> hampir habis!\n\n` +
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
    `Halo! Jangan lupa mengisi <b>${safeLabel}</b>.\n\n` +
    `📅 Deadline: <b>${formattedDate}</b>\n` +
    `⏳ Sisa waktu: <b>${daysLeft} hari lagi</b>\n\n` +
    `Isi melalui aplikasi SAKTI:\n` +
    `👉 <a href="${monevUrl}">Isi Monev Sekarang</a>`
  )
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
}

export async function POST(req: NextRequest) {
  // 1. Validasi CRON_SECRET (constant-time, fail closed)
  const cronSecret = getCronSecret()
  if (!cronSecret) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }
  if (!safeEqual(req.headers.get("authorization"), `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!getTelegramEnv()) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  const appUrl = getAppUrl()
  if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1/.test(appUrl)) {
    console.warn(`[cron] NEXT_PUBLIC_APP_URL (${appUrl}) bukan URL publik https — link di pesan tidak akan bisa dibuka`)
  }

  const now = new Date()

  try {
    // 2. Bersihkan token aktivasi kedaluwarsa (retensi data, PRD v2.1 F4.8)
    const { count: expiredTokensDeleted } = await prisma.tokenAktivasiTelegram.deleteMany({
      where: { expiresAt: { lt: now } },
    })

    // 3. Ambil periode yang sedang berlangsung (form sudah dibuka, deadline belum lewat)
    const candidates = await prisma.periode_monev.findMany({
      where: { is_active: true, deadline: { gt: now } },
    })
    const activeSchedules = candidates.filter((p) => getOperationalStatus(p, now) === "BERLANGSUNG")

    const results = []

    for (const schedule of activeSchedules) {
      // 4. Hitung sisa hari hingga deadline (berbasis tengah malam WIB)
      const daysLeft = daysLeftWIB(schedule.deadline, now)

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

      // 5. Klaim slot H-n untuk deadline versi ini. Constraint unik
      //    (periode, triggerDay, deadline_snapshot) menjamin hanya satu
      //    pemanggilan cron yang mengirim, walau dipanggil bersamaan.
      let logId: string
      try {
        const log = await prisma.log_notifikasi.create({
          data: {
            periode_monev_id: schedule.id,
            triggerDay: daysLeft,
            sentAt: now,
            deadline_snapshot: schedule.deadline,
          },
          select: { id: true },
        })
        logId = log.id
      } catch (err) {
        if (!isUniqueViolation(err)) throw err
        results.push({
          scheduleId: schedule.id,
          label: schedule.label,
          triggerDay: daysLeft,
          skipped: true,
          reason: `H-${daysLeft} sudah terkirim untuk deadline ini`,
        })
        continue
      }

      let totalSent = 0
      let totalFailed = 0
      let totalDisconnected = 0
      let targets: { id: string; telegramId: bigint | null; userId: string | null }[] = []
      let allFailed = false

      try {
        // 6. Target: penerima dengan telegram_id yang belum submit periode ini
        const submissions = await prisma.pengisian_monev.findMany({
          where: { periode_monev_id: schedule.id },
          select: { user_id: true },
        })
        const submittedUserIds = new Set(submissions.map((s) => s.user_id))

        const allPenerima = await prisma.penerimaKipk.findMany({
          where: { telegramId: { not: null }, userId: { not: null } },
          select: { id: true, telegramId: true, userId: true },
        })
        targets = allPenerima.filter((p) => p.userId && !submittedUserIds.has(p.userId))

        // 7. Kirim
        const message = buildMessage(schedule.label, schedule.deadline, daysLeft)

        for (const target of targets) {
          if (!target.telegramId) continue
          const res = await sendMessage(target.telegramId, message)
          if (res.ok) {
            totalSent++
          } else {
            totalFailed++
            // Bot diblokir / chat hilang → hapus telegram_id (PRD v2.1 F4.4)
            if (isUnreachableChat(res)) {
              await prisma.penerimaKipk.updateMany({
                where: { id: target.id, telegramId: target.telegramId },
                data: { telegramId: null },
              })
              totalDisconnected++
            }
          }
          await sleep(SEND_DELAY_MS)
        }

        // 8. Gagal total → lepas slot supaya pemanggilan berikutnya mencoba lagi
        allFailed = targets.length > 0 && totalSent === 0
        if (allFailed) {
          await prisma.log_notifikasi.delete({ where: { id: logId } })
        } else {
          await prisma.log_notifikasi.update({
            where: { id: logId },
            data: { totalSent, totalFailed },
          })
        }
      } catch (err) {
        // Error di tengah jalan: kalau belum ada yang terkirim, lepas slot
        // agar pemanggilan berikutnya bisa mencoba lagi.
        // Kalau sebagian sudah terkirim, slot dipertahankan (hindari pesan
        // ganda) dan hitungan disimpan apa adanya.
        if (totalSent === 0) {
          await prisma.log_notifikasi.delete({ where: { id: logId } }).catch(() => {})
        } else {
          await prisma.log_notifikasi
            .update({ where: { id: logId }, data: { totalSent, totalFailed } })
            .catch(() => {})
        }
        throw err
      }

      results.push({
        scheduleId: schedule.id,
        label: schedule.label,
        triggerDay: daysLeft,
        totalTargets: targets.length,
        totalSent,
        totalFailed,
        totalDisconnected,
        willRetry: allFailed,
        skipped: false,
      })
    }

    const processedCount = results.filter((r) => !r.skipped).length

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      processed: processedCount,
      expiredTokensDeleted,
      results,
    })
  } catch (err) {
    // Detail error hanya di log server (PRD v2.1 F4.5)
    console.error("[POST /api/cron/monev-reminder]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
