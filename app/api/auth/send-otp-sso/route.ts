import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase"
import { generateOtp, hashOtp } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/mailer"
import { z } from "zod"

const SendOtpSsoSchema = z.object({
  kandidat_id: z.string().uuid("ID kandidat tidak valid"),
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

    // ── Validasi kandidat exists & sudah Ditetapkan SK ──────────────────────
    const { data: kandidat, error: kandErr } = await supabaseAdmin
      .from("kandidat")
      .select("id, nama_pendaftar, no_pendaftaran_kipk, status_sk")
      .eq("id", kandidat_id)
      .eq("status_sk", "Ditetapkan")
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
        { error: "Data kandidat tidak valid atau belum Ditetapkan SK" },
        { status: 403 }
      )
    }

    // ── Cek apakah email SSO sudah dipakai user lain ────────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmailSSO },
      include: { penerimaKipk: true },
    })

    if (existingUser?.penerimaKipk) {
      return NextResponse.json(
        { error: "Email SSO ini sudah terdaftar. Silakan login langsung." },
        { status: 409 }
      )
    }

    // ── Upsert user (belum aktif sampai OTP diverifikasi) ───────────────────
    const user = await prisma.user.upsert({
      where: { email: normalizedEmailSSO },
      create: {
        email: normalizedEmailSSO,
        role: "MAHASISWA_KIPK",
      },
      update: {},
    })

    // ── Hapus OTP lama & generate OTP baru, sertakan link ke kandidat ───────
    await prisma.otpToken.deleteMany({ where: { userId: user.id } })

    const otp = generateOtp()
    const hashed = await hashOtp(otp)

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        kandidatId: kandidat.id,
        code: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      },
    })

    // ── Kirim OTP ke email SSO Undip ─────────────────────────────────────────
    await sendOtpEmail(normalizedEmailSSO, otp, kandidat.nama_pendaftar ?? "Mahasiswa")

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
