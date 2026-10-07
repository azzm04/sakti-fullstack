import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getOperationalStatus } from "@/lib/monev-schedule"
import { createRateLimiter, createTtlSet } from "@/lib/rate-limit"
import { safeEqual } from "@/lib/security"
import {
  escapeHtml,
  getAppUrl,
  getTelegramEnv,
  hashActivationCode,
  normalizeActivationCode,
  sendMessage,
} from "@/lib/telegram"

/**
 * Webhook @MonevSakaBot (PRD v2.1 F2).
 *
 * Aktivasi bisa lewat dua jalur:
 *  - deep link  → Telegram mengirim "/start <kode>"
 *  - kode manual → mahasiswa mengirim "ABCD-2345" (untuk Telegram Web,
 *    yang sering menghilangkan parameter start)
 */

const MAX_BODY_BYTES = 64 * 1024
const MAX_TEXT_LENGTH = 64

// Batas percobaan kode salah: per chat dan global (PRD v2.1 F2.5)
const failedPerChat = createRateLimiter(5, 10 * 60 * 1000)
const failedGlobal = createRateLimiter(30, 60 * 1000)
// Telegram mengirim ulang update yang belum di-ACK; abaikan duplikat
const seenUpdates = createTtlSet(24 * 60 * 60 * 1000)

const updateSchema = z.object({
  update_id: z.number().int(),
  message: z
    .object({
      chat: z.object({ id: z.number().int(), type: z.string() }),
      from: z.object({ id: z.number().int(), is_bot: z.boolean() }).optional(),
      text: z.string().optional(),
    })
    .optional(),
})

// ─── Teks balasan ─────────────────────────────────────────────────────────

const monevUrl = () => `${getAppUrl()}/mahasiswa/monev`

const MSG_HELP =
  "🤖 <b>Bot Pengingat Monev SAKTI</b>\n\n" +
  "Perintah yang tersedia:\n" +
  "/start — mulai &amp; petunjuk aktivasi\n" +
  "/status — cek koneksi dan jadwal Monev\n" +
  "/stop — berhenti menerima pengingat\n" +
  "/help — tampilkan bantuan ini\n\n" +
  "Untuk menghubungkan akun, buka halaman Monev di aplikasi SAKTI lalu tekan tombol aktivasi di sana."

const msgHowToActivate = () =>
  "👋 <b>Selamat datang di Bot Pengingat Monev SAKTI!</b>\n\n" +
  "Untuk menghubungkan akun Anda:\n" +
  "1. Buka SAKTI → <b>Monev</b> → <b>Pengingat Telegram</b>\n" +
  "2. Tekan <b>Buka Bot Telegram</b>, <b>Pakai Telegram Web</b>, atau pindai <b>QR</b>\n" +
  "3. Tekan tombol <b>Start</b> yang muncul di chat ini\n\n" +
  `👉 <a href="${escapeHtml(monevUrl())}">Buka halaman Monev</a>`

const MSG_INVALID_CODE =
  "⚠️ Tautan aktivasi tidak valid atau sudah kedaluwarsa.\n\nBuka halaman Monev di SAKTI lalu ulangi aktivasi."

const MSG_TOO_MANY = "⏳ Terlalu banyak percobaan. Silakan coba lagi beberapa menit lagi."

const MSG_NOT_LINKED = "ℹ️ Akun Telegram ini belum terhubung ke SAKTI. Kirim /start untuk petunjuk aktivasi."

// Nama depan saja — prinsip minimisasi data di pesan (PRD v2.1 §6)
const firstName = (nama: string | null | undefined) => (nama ?? "").trim().split(/\s+/)[0] || "Mahasiswa"

const formatDateWIB = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" })

// ─── Handler ──────────────────────────────────────────────────────────────

/** Health check publik — sengaja tanpa detail apa pun (PRD v2.1 F5.1). */
export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  // 1. Fail closed jika konfigurasi tidak lengkap
  const env = getTelegramEnv()
  if (!env) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  // 2. Autentikasi request dari Telegram (constant-time)
  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token")
  if (!safeEqual(incomingSecret, env.TELEGRAM_WEBHOOK_SECRET)) {
    console.warn("[telegram] webhook ditolak: secret token tidak cocok")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 3. Batasi ukuran body
  const declaredLength = Number(req.headers.get("content-length") ?? 0)
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  // Mulai titik ini selalu balas 200 agar Telegram tidak mengirim ulang
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return ok()

    const parsed = updateSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return ok()
    const update = parsed.data

    if (!seenUpdates.add(String(update.update_id))) return ok()

    const message = update.message
    if (!message || message.chat.type !== "private" || message.from?.is_bot !== false) return ok()
    if (!message.text) return ok()

    const chatId = BigInt(message.chat.id)
    const text = message.text.trim().slice(0, MAX_TEXT_LENGTH)
    await handleText(chatId, text)
  } catch (err) {
    console.error("[POST /api/telegram]", err instanceof Error ? err.message : "unknown error")
  }

  return ok()
}

function ok() {
  return NextResponse.json({ ok: true })
}

async function handleText(chatId: bigint, text: string) {
  // "/start@MonevSakaBot ABCD2345" → command "start", arg "ABCD2345"
  const commandMatch = text.match(/^\/([a-z]+)(?:@\w+)?(?:\s+(.*))?$/i)

  // Aktivasi hanya lewat payload /start dari tautan atau QR. Teks biasa
  // tidak lagi diperlakukan sebagai kode aktivasi.
  if (!commandMatch) {
    return sendMessage(chatId, MSG_HELP)
  }

  const command = commandMatch[1].toLowerCase()
  const arg = commandMatch[2]?.trim() ?? ""

  switch (command) {
    case "start": {
      if (arg) {
        const code = normalizeActivationCode(arg)
        // Payload deep link yang bentuknya bukan kode (mis. link lama) = kode tidak valid
        if (!code) return registerFailureAndReply(chatId)
        return handleActivationCode(chatId, code)
      }
      const linked = await prisma.penerimaKipk.findFirst({
        where: { telegramId: chatId },
        select: { nama: true },
      })
      if (linked) {
        return sendMessage(
          chatId,
          `✅ Akun Anda sudah terhubung sebagai <b>${escapeHtml(firstName(linked.nama))}</b>.\n\nKirim /status untuk melihat jadwal Monev.`,
        )
      }
      return sendMessage(chatId, msgHowToActivate())
    }
    case "status":
      return handleStatus(chatId)
    case "stop":
      return handleStop(chatId)
    default:
      return sendMessage(chatId, MSG_HELP)
  }
}

async function registerFailureAndReply(chatId: bigint) {
  failedPerChat.hit(chatId.toString())
  failedGlobal.hit("global")
  return sendMessage(chatId, MSG_INVALID_CODE)
}

type LinkResult =
  | { status: "invalid" }
  | { status: "no_kipk" }
  | { status: "taken" }
  | { status: "ok"; nama: string; userId: string; previousChatId: bigint | null }

async function handleActivationCode(chatId: bigint, code: string) {
  if (failedPerChat.isLimited(chatId.toString()) || failedGlobal.isLimited("global")) {
    console.warn(`[telegram] rate limit kode aktivasi chat=${chatId}`)
    return sendMessage(chatId, MSG_TOO_MANY)
  }

  const tokenHash = hashActivationCode(code)

  // Semua langkah dalam satu transaksi; token dihapus dengan deleteMany +
  // cek count supaya kode yang sama tidak bisa dipakai dua kali bersamaan.
  const result: LinkResult = await prisma.$transaction(async (tx) => {
    const record = await tx.tokenAktivasiTelegram.findUnique({
      where: { token: tokenHash },
      include: { user: { include: { penerimaKipk: true } } },
    })
    if (!record || record.expiresAt < new Date()) return { status: "invalid" }

    const penerima = record.user?.penerimaKipk
    if (!penerima) return { status: "no_kipk" }

    const takenByOther = await tx.penerimaKipk.findFirst({
      where: { telegramId: chatId, NOT: { id: penerima.id } },
      select: { id: true },
    })
    if (takenByOther) return { status: "taken" }

    const deleted = await tx.tokenAktivasiTelegram.deleteMany({
      where: { id: record.id, token: tokenHash },
    })
    if (deleted.count !== 1) return { status: "invalid" }

    await tx.penerimaKipk.update({
      where: { id: penerima.id },
      data: { telegramId: chatId },
    })

    return {
      status: "ok",
      nama: penerima.nama,
      userId: record.userId,
      previousChatId: penerima.telegramId,
    }
  })

  switch (result.status) {
    case "invalid":
      return registerFailureAndReply(chatId)
    case "no_kipk":
      return sendMessage(chatId, "❌ Data mahasiswa KIPK tidak ditemukan. Hubungi admin SAKTI.")
    case "taken":
      // Jangan sebut identitas mahasiswa lain (PRD v2.1 F2.4)
      return sendMessage(
        chatId,
        "⚠️ Akun Telegram ini sudah terhubung ke akun SAKTI lain.\n\nKirim /stop terlebih dahulu jika ingin memindahkannya.",
      )
    case "ok": {
      console.info(`[telegram] akun terhubung user=${result.userId} chat=${chatId}`)

      // Beri tahu Telegram lama jika akun SAKTI ini pindah ke Telegram lain
      if (result.previousChatId && result.previousChatId !== chatId) {
        console.info(`[telegram] akun berpindah Telegram user=${result.userId}`)
        await sendMessage(
          result.previousChatId,
          "🔔 Akun SAKTI Anda kini dihubungkan ke akun Telegram lain, sehingga pengingat tidak lagi dikirim ke sini.\n\n" +
            "Jika ini bukan Anda, segera hubungi admin SAKTI.",
        )
      }

      return sendMessage(
        chatId,
        `✅ <b>Akun Berhasil Terhubung!</b>\n\n` +
          `Halo, <b>${escapeHtml(firstName(result.nama))}</b>! Akun Telegram Anda kini terhubung ke <b>SAKTI</b>.\n\n` +
          `Anda akan menerima pengingat otomatis sebelum deadline Monev:\n` +
          `• H-30, H-7, H-3, H-2, dan H-1 dari deadline\n\n` +
          `Pastikan mengisi Monev tepat waktu agar status beasiswa KIPK tetap aktif. 📚\n\n` +
          `Kirim /stop kapan saja untuk berhenti menerima pengingat.`,
      )
    }
  }
}

async function handleStatus(chatId: bigint) {
  const penerima = await prisma.penerimaKipk.findFirst({
    where: { telegramId: chatId },
    select: { nama: true, userId: true },
  })
  // Chat yang tidak terhubung tidak mendapat informasi apa pun
  if (!penerima?.userId) return sendMessage(chatId, MSG_NOT_LINKED)

  const now = new Date()
  const periods = await prisma.periode_monev.findMany({
    where: { is_active: true, deadline: { gt: now } },
    orderBy: { deadline: "asc" },
    select: { id: true, label: true, deadline: true, waktu_mulai: true, is_active: true },
  })
  const running = periods.filter((p) => getOperationalStatus(p, now) === "BERLANGSUNG")

  let body: string
  if (running.length === 0) {
    body = "Tidak ada periode Monev yang sedang berlangsung."
  } else {
    const submitted = await prisma.pengisian_monev.findMany({
      where: { user_id: penerima.userId, periode_monev_id: { in: running.map((p) => p.id) } },
      select: { periode_monev_id: true },
    })
    const submittedIds = new Set(submitted.map((s) => s.periode_monev_id))
    body = running
      .map(
        (p) =>
          `• <b>${escapeHtml(p.label)}</b>\n  Deadline: ${formatDateWIB(p.deadline)}\n  Status: ${
            submittedIds.has(p.id) ? "✅ sudah diisi" : "⏳ belum diisi"
          }`,
      )
      .join("\n\n")
  }

  return sendMessage(
    chatId,
    `✅ Terhubung sebagai <b>${escapeHtml(firstName(penerima.nama))}</b>.\n\n${body}\n\n` +
      `👉 <a href="${escapeHtml(monevUrl())}">Buka halaman Monev</a>`,
  )
}

async function handleStop(chatId: bigint) {
  const { count } = await prisma.penerimaKipk.updateMany({
    where: { telegramId: chatId },
    data: { telegramId: null },
  })
  if (count === 0) return sendMessage(chatId, MSG_NOT_LINKED)

  console.info(`[telegram] disconnect via /stop chat=${chatId}`)
  return sendMessage(
    chatId,
    "🔕 Koneksi diputus. Anda tidak akan menerima pengingat Monev lagi.\n\n" +
      "Untuk menghubungkan kembali, buat kode aktivasi baru di aplikasi SAKTI.",
  )
}
