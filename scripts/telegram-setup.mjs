#!/usr/bin/env node
/**
 * scripts/telegram-setup.mjs — PRD v2.1 N3
 *
 * Mendaftarkan webhook + menu perintah @MonevSakaBot, lalu mencetak status
 * webhook. Jalankan setiap kali domain atau secret berubah:
 *
 *   pnpm telegram:setup            # daftarkan webhook
 *   pnpm telegram:setup --info     # hanya tampilkan status webhook
 *
 * Env dibaca dari proses, lalu .env.local dan .env (yang sudah ada tidak ditimpa).
 * Skrip ini tidak pernah mencetak token bot atau secret.
 */
import { existsSync } from "node:fs"

for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file)
}

const token = process.env.TELEGRAM_BOT_TOKEN
const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "")
const infoOnly = process.argv.includes("--info")

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

if (!token || !/^\d+:[A-Za-z0-9_-]{30,}$/.test(token)) fail("TELEGRAM_BOT_TOKEN kosong atau formatnya tidak valid")

async function call(method, payload = {}) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch((err) => fail(`${method}: gagal terhubung ke Telegram (${err.name})`))
  const data = await res.json()
  if (!data.ok) fail(`${method}: ${data.error_code} ${data.description}`)
  return data.result
}

if (!infoOnly) {
  if (!secret || secret.length < 32 || !/^[A-Za-z0-9_-]+$/.test(secret)) {
    fail("TELEGRAM_WEBHOOK_SECRET harus ≥ 32 karakter dan hanya berisi A-Z a-z 0-9 _ -")
  }
  if (!appUrl.startsWith("https://") || /localhost|127\.0\.0\.1|trycloudflare\.com/.test(appUrl)) {
    fail(`NEXT_PUBLIC_APP_URL harus URL https publik yang tetap (sekarang: "${appUrl || "-"}")`)
  }

  await call("setWebhook", {
    url: `${appUrl}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
    max_connections: 10,
  })
  console.log(`✔ Webhook terdaftar ke ${appUrl}/api/telegram`)

  await call("setMyCommands", {
    commands: [
      { command: "start", description: "Mulai & petunjuk aktivasi" },
      { command: "status", description: "Cek koneksi dan jadwal Monev" },
      { command: "stop", description: "Berhenti menerima pengingat" },
      { command: "help", description: "Bantuan" },
    ],
  })
  console.log("✔ Menu perintah bot diperbarui")
}

const info = await call("getWebhookInfo")
const me = await call("getMe")
console.log("\nStatus webhook @" + me.username)
console.log("  url                 :", info.url || "(belum di-set)")
console.log("  pending_update_count:", info.pending_update_count)
console.log("  allowed_updates     :", (info.allowed_updates ?? []).join(", ") || "(default)")
console.log(
  "  last_error          :",
  info.last_error_date
    ? `${new Date(info.last_error_date * 1000).toISOString()} — ${info.last_error_message}`
    : "-",
)

if (info.url && appUrl) {
  const health = await fetch(`${appUrl}/api/telegram`).catch(() => null)
  console.log("  health check        :", health?.ok ? "OK" : `GAGAL (${health?.status ?? "tidak terjangkau"})`)
}
