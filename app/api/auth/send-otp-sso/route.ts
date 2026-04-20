import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase"
import { generateOtp, hashOtp } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/mailer"
import { z } from "zod"

const SendOtpSsoSchema = z.object({
  kandidat_id: z.number().int().positive("ID kandidat tidak valid"),
  email_sso: z.string()
    .email("Format email tidak valid")
    .regex(/@students\.undip\.ac\.id$/, "Email harus menggunakan domain @students.undip.ac.id"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = SendOtpSsoSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { kandidat_id, email_sso } = result.data
    const normalizedEmailSSO = email_sso.toLowerCase().trim()

    // ── Validasi kandidat exists & status LOLOS ─────────────────────────────
    const { data: kandidat, error: kandErr } = await supabaseAdmin
      .from("kandidat")
      .select("id, nama, email, no_pendaftaran_kipk, status_seleksi")
      .eq("id", kandidat_id)
      .eq("status_seleksi", "lolos")
      .maybeSingle()

    if (kandErr) {
      console.error("[send-otp-sso] kandidat query:", kandErr)
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 }
      )
    }

    if (!kandidat) {
      return NextResponse.json(
        { error: "Data kandidat tidak valid atau belum dinyatakan LOLOS" },
        { status: 403 }
      )
    }

    // ── Cek apakah email SSO sudah terdaftar di whitelist ───────────────────
    const existingWhitelist = await prisma.ssoWhitelist.findUnique({
      where: { email: normalizedEmailSSO },
    })

    if (existingWhitelist && existingWhitelist.isActive) {
      return NextResponse.json(
        { error: "Email SSO ini sudah terdaftar. Silakan login langsung." },
        { status: 409 }
      )
    }

    // ── Upsert sso_whitelist (BELUM AKTIF, menunggu OTP verification) ───────
    const whitelist = await prisma.ssoWhitelist.upsert({
      where: { email: normalizedEmailSSO },
      create: {
        email: normalizedEmailSSO,
        nama: kandidat.nama,
        role: "MAHASISWA_KIPK",
        isActive: false, // Belum aktif sampai OTP verified
      },
      update: {
        nama: kandidat.nama,
        isActive: false,
      },
    })

    // ── Upsert user (BELUM AKTIF) ───────────────────────────────────────────
    const user = await prisma.user.upsert({
      where: { email: normalizedEmailSSO },
      create: {
        email: normalizedEmailSSO,
        nama: kandidat.nama,
        role: "MAHASISWA_KIPK",
        whitelistId: whitelist.id,
      },
      update: {
        whitelistId: whitelist.id,
      },
    })

    // ── Hapus OTP lama & generate OTP baru ──────────────────────────────────
    await prisma.otpToken.deleteMany({ where: { userId: user.id } })

    const otp = generateOtp()
    const hashed = await hashOtp(otp)

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        code: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      },
    })

    // ── Kirim OTP ke email SSO Undip ─────────────────────────────────────────
    await sendOtpEmail(normalizedEmailSSO, otp, kandidat.nama)

    return NextResponse.json({
      success: true,
      message: `Kode OTP telah dikirim ke ${normalizedEmailSSO}. Silakan cek inbox Anda.`,
    })

  } catch (err) {
    console.error("[send-otp-sso]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}