/**
 * lib/telegram.ts
 * Helper bersama untuk Telegram Bot API: konfigurasi env, pengiriman pesan,
 * escape HTML, dan kode aktivasi.
 *
 * Aturan keamanan (PRD v2.1 F2.6, F5.3):
 * - Token bot ada di path URL Telegram, jadi URL itu TIDAK PERNAH dicatat.
 *   Error dicatat sebatas nama method + error_code/description.
 * - Semua nilai dinamis di pesan parse_mode HTML wajib lewat escapeHtml().
 */
import { randomInt } from "node:crypto"
import { z } from "zod"
import { sha256Hex } from "@/lib/security"

// ─── Konfigurasi ──────────────────────────────────────────────────────────

// Karakter yang diizinkan Telegram untuk secret_token: A-Z a-z 0-9 _ -
const secretSchema = z
  .string()
  .min(32, "minimal 32 karakter")
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/, "hanya boleh A-Z a-z 0-9 _ -")

const telegramEnvSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().regex(/^\d+:[A-Za-z0-9_-]{30,}$/, "format token bot tidak valid"),
  TELEGRAM_BOT_USERNAME: z.string().min(5).default("MonevSakaBot"),
  TELEGRAM_WEBHOOK_SECRET: secretSchema,
})

export type TelegramEnv = z.infer<typeof telegramEnvSchema>

let cachedEnv: TelegramEnv | null = null

/**
 * Ambil konfigurasi Telegram yang sudah tervalidasi, atau null jika tidak
 * lengkap/tidak valid (fail closed — pemanggil harus menolak request).
 * Detail kesalahan dicatat tanpa menampilkan nilai secret.
 */
export function getTelegramEnv(): TelegramEnv | null {
  if (cachedEnv) return cachedEnv
  const parsed = telegramEnvSchema.safeParse({
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || undefined,
    TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
  })
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    console.error("[telegram] konfigurasi env tidak valid:", fields.join("; "))
    return null
  }
  cachedEnv = parsed.data
  return cachedEnv
}

/** Validasi CRON_SECRET dengan aturan panjang yang sama (fail closed). */
export function getCronSecret(): string | null {
  const parsed = z.string().min(32).safeParse(process.env.CRON_SECRET)
  if (!parsed.success) {
    console.error("[cron] CRON_SECRET kosong atau kurang dari 32 karakter")
    return null
  }
  return parsed.data
}

/** Base URL aplikasi untuk link di dalam pesan. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  return url.replace(/\/+$/, "")
}

// ─── HTML ─────────────────────────────────────────────────────────────────

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ─── Bot API ──────────────────────────────────────────────────────────────

export interface TelegramResult<T = unknown> {
  ok: boolean
  result?: T
  /** HTTP-like error code dari Telegram (403, 400, 429, ...). 0 = gagal jaringan. */
  errorCode?: number
  description?: string
  retryAfter?: number
}

async function callTelegram<T>(
  method: string,
  payload: Record<string, unknown>,
  timeoutMs = 10_000,
): Promise<TelegramResult<T>> {
  const env = getTelegramEnv()
  if (!env) return { ok: false, errorCode: 0, description: "konfigurasi tidak valid" }

  try {
    const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean
      result?: T
      error_code?: number
      description?: string
      parameters?: { retry_after?: number }
    } | null

    if (data?.ok) return { ok: true, result: data.result }
    return {
      ok: false,
      errorCode: data?.error_code ?? res.status,
      description: data?.description,
      retryAfter: data?.parameters?.retry_after,
    }
  } catch (err) {
    // Jangan cetak `err` mentah: pesan undici bisa memuat URL bertoken.
    const name = err instanceof Error ? err.name : "UnknownError"
    console.error(`[telegram] ${method} gagal: ${name}`)
    return { ok: false, errorCode: 0, description: name }
  }
}

/**
 * Kirim pesan HTML. Nilai dinamis di `html` harus sudah di-escape.
 * Satu kali retry otomatis jika kena 429.
 */
export async function sendMessage(chatId: bigint | number | string, html: string): Promise<TelegramResult> {
  const payload = {
    chat_id: chatId.toString(),
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  }
  let res = await callTelegram("sendMessage", payload)
  if (!res.ok && res.errorCode === 429 && res.retryAfter && res.retryAfter <= 30) {
    await sleep(res.retryAfter * 1000)
    res = await callTelegram("sendMessage", payload)
  }
  if (!res.ok) {
    console.warn(`[telegram] sendMessage error ${res.errorCode}: ${res.description ?? "-"}`)
  }
  return res
}

/**
 * true jika error menandakan chat tidak bisa dikirimi lagi secara permanen
 * (bot diblokir, akun dihapus, chat tidak ditemukan).
 */
export function isUnreachableChat(res: TelegramResult): boolean {
  if (res.ok) return false
  if (res.errorCode === 403) return true
  return res.errorCode === 400 && /chat not found|user is deactivated/i.test(res.description ?? "")
}

interface TelegramChat {
  id: number
  first_name?: string
  last_name?: string
  username?: string
}

// Cache getChat 10 menit (PRD F3.1) — nama/username tidak disimpan di DB.
const chatCache = new Map<string, { value: TelegramChat | null; exp: number }>()

export async function getChatCached(chatId: bigint): Promise<TelegramChat | null> {
  const key = chatId.toString()
  const hit = chatCache.get(key)
  if (hit && hit.exp > Date.now()) return hit.value

  const res = await callTelegram<TelegramChat>("getChat", { chat_id: key }, 5_000)
  const value = res.ok && res.result ? res.result : null
  if (chatCache.size > 2000) chatCache.clear()
  chatCache.set(key, { value, exp: Date.now() + 10 * 60 * 1000 })
  return value
}

/** "Budi Santoso" → "Budi S." */
export function shortDisplayName(chat: TelegramChat | null): string | null {
  if (!chat?.first_name) return null
  const last = chat.last_name?.trim()
  return last ? `${chat.first_name} ${last[0]}.` : chat.first_name
}

/** "budisantoso" → "@bud***" */
export function maskUsername(username: string | undefined): string | null {
  if (!username) return null
  return `@${username.slice(0, 3)}***`
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Kode aktivasi (PRD F1.1) ─────────────────────────────────────────────

// 32 karakter tanpa 0/O dan 1/I agar tidak tertukar saat diketik manual
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 8
export const ACTIVATION_CODE_TTL_MS = 15 * 60 * 1000

/** Kode baru dari CSPRNG, tanpa tanda hubung (mis. "ABCD2345"). */
export function generateActivationCode(): string {
  let code = ""
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return code
}

/**
 * Normalisasi input pengguna: huruf besar, buang spasi/tanda hubung.
 * Mengembalikan null jika bentuknya bukan kode aktivasi.
 */
export function normalizeActivationCode(input: string): string | null {
  const cleaned = input.toUpperCase().replace(/[\s-]/g, "")
  if (cleaned.length !== CODE_LENGTH) return null
  for (const ch of cleaned) {
    if (!CODE_ALPHABET.includes(ch)) return null
  }
  return cleaned
}

/** Yang disimpan di DB hanyalah hash kode (PRD F1.1). */
export function hashActivationCode(normalizedCode: string): string {
  return sha256Hex(normalizedCode)
}

/**
 * Tautan aktivasi untuk tiap jalur (PRD v2.1 F1.3).
 *
 * `appLink` (t.me) hanya berguna kalau aplikasi Telegram terpasang: halaman
 * t.me cuma menawarkan skema `tg://` dan tidak pernah mengoper ke
 * web.telegram.org. Untuk pengguna Telegram Web kita susun sendiri URL
 * `#?tgaddr=`, yang ditangani kedua klien web Telegram (A dan K).
 * Varian /k dipilih karena mempertahankan tgaddr melewati proses login.
 */
export function buildActivationLinks(code: string, botUsername: string) {
  const tgLink = `tg://resolve?domain=${botUsername}&start=${code}`
  return {
    appLink: `https://t.me/${botUsername}?start=${code}`,
    webLink: `https://web.telegram.org/k/#?tgaddr=${encodeURIComponent(tgLink)}`,
  }
}
