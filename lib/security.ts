/**
 * lib/security.ts
 * Helper keamanan kecil yang dipakai bersama oleh API route.
 */
import { createHash, timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

/**
 * Bandingkan dua string secara constant-time.
 * Panjang dicek dulu karena timingSafeEqual melempar error jika berbeda;
 * kebocoran panjang secret bukan masalah (panjangnya tetap dan diketahui).
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

/**
 * Proteksi CSRF untuk endpoint yang mengubah state dengan cookie sesi.
 * Request harus membawa header Origin yang host-nya sama dengan host
 * tujuan (Host / X-Forwarded-Host) atau dengan NEXT_PUBLIC_APP_URL.
 * Browser selalu mengirim Origin pada fetch POST, jadi Origin kosong ditolak.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return false

  let originHost: string
  try {
    originHost = new URL(origin).host
  } catch {
    return false
  }

  const allowedHosts = new Set<string>()
  const host = req.headers.get("host")
  const forwardedHost = req.headers.get("x-forwarded-host")
  if (host) allowedHosts.add(host)
  if (forwardedHost) allowedHosts.add(forwardedHost.split(",")[0].trim())
  try {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      allowedHosts.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host)
    }
  } catch {
    // APP_URL tidak valid — abaikan, cukup pakai Host
  }

  return allowedHosts.has(originHost)
}

/** Header standar untuk respons yang memuat data sensitif per user. */
export const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const
