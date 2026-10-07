import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getApiUser } from "@/lib/auth-server"
import { createRateLimiter } from "@/lib/rate-limit"
import { isSameOriginRequest, NO_STORE_HEADERS } from "@/lib/security"
import {
  ACTIVATION_CODE_TTL_MS,
  buildActivationLinks,
  generateActivationCode,
  getTelegramEnv,
  hashActivationCode,
} from "@/lib/telegram"

// Maks 5 kode per user per 15 menit (PRD v2.1 F1.2)
const activateLimiter = createRateLimiter(5, 15 * 60 * 1000)

export async function POST(req: NextRequest) {
  // 1. Proteksi CSRF — hanya dari halaman SAKTI sendiri
  if (!isSameOriginRequest(req)) {
    return NextResponse.json({ error: "Origin tidak diizinkan" }, { status: 403 })
  }

  // 2. Autentikasi + otorisasi: hanya mahasiswa KIPK
  const auth = await getApiUser(req, "MAHASISWA_KIPK")
  if (!auth.user) {
    return NextResponse.json(
      { error: auth.reason === 401 ? "Tidak terautentikasi" : "Fitur ini hanya untuk mahasiswa KIPK" },
      { status: auth.reason },
    )
  }
  const userId = auth.user.id

  const env = getTelegramEnv()
  if (!env) {
    return NextResponse.json({ error: "Layanan Telegram belum dikonfigurasi" }, { status: 503 })
  }

  // 3. Rate limit pembuatan kode
  if (!activateLimiter.hit(userId)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan kode. Coba lagi dalam beberapa menit." },
      { status: 429, headers: NO_STORE_HEADERS },
    )
  }

  try {
    const penerima = await prisma.penerimaKipk.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (!penerima) {
      return NextResponse.json(
        { error: "Data penerima KIPK tidak ditemukan. Hubungi admin SAKTI." },
        { status: 403 },
      )
    }

    // 4. Buat kode baru (token lama dihapus) — yang disimpan hanya hash-nya
    const code = generateActivationCode()
    const expiresAt = new Date(Date.now() + ACTIVATION_CODE_TTL_MS)

    await prisma.$transaction([
      prisma.tokenAktivasiTelegram.deleteMany({ where: { userId } }),
      prisma.tokenAktivasiTelegram.create({
        data: { userId, token: hashActivationCode(code), expiresAt },
      }),
    ])

    const botUsername = env.TELEGRAM_BOT_USERNAME
    const { appLink, webLink } = buildActivationLinks(code, botUsername)
    return NextResponse.json(
      {
        deepLink: appLink,
        webLink,
        botUsername,
        expiresAt: expiresAt.toISOString(),
      },
      { headers: NO_STORE_HEADERS },
    )
  } catch (err) {
    console.error("[POST /api/auth/telegram/activate]", err instanceof Error ? err.message : err)
    return NextResponse.json({ error: "Gagal membuat kode aktivasi" }, { status: 500 })
  }
}
