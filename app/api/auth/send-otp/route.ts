import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { supabaseAdmin } from "@/lib/supabase"
import { generateOtp, hashOtp } from "@/lib/otp"
import { sendOtpEmail } from "@/lib/mailer"
import { z } from "zod"

const Schema = z.object({
  email: z.string().email("Format email tidak valid"),
  nama:  z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = Schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, nama } = result.data
    const normalizedEmail = email.toLowerCase().trim()

    // Validasi: email harus ada di tabel kandidat
    let kandidatQuery = supabaseAdmin
      .from("kandidat")
      .select("id, nama, email, no_pendaftaran_kipk")
      .eq("email", normalizedEmail)

    if (nama?.trim()) {
      kandidatQuery = kandidatQuery.ilike("nama", nama.trim())
    }

    const { data: kandidat, error: kandErr } = await kandidatQuery.maybeSingle()

    if (kandErr) {
      console.error("[send-otp] kandidat query:", kandErr)
      return NextResponse.json(
        { error: "Terjadi kesalahan server, coba lagi" },
        { status: 500 }
      )
    }

    if (!kandidat) {
      return NextResponse.json(
        { error: nama
            ? "Nama dan email tidak cocok dengan data pendaftaran KIPK"
            : "Email tidak terdaftar dalam data pendaftaran KIPK"
        },
        { status: 403 }
      )
    }

    const whitelist = await prisma.ssoWhitelist.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        nama: kandidat.nama,
        role: "MAHASISWA_KIPK",
        isActive: true,
      },
      update: {
        nama: kandidat.nama,
        isActive: true,
      },
    })

    // Upsert user 
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        nama: kandidat.nama,
        role: "MAHASISWA_KIPK",
        whitelistId: whitelist.id,
      },
      update: {},
    })

    //  Generate & simpan OTP
    await prisma.otpToken.deleteMany({ where: { userId: user.id } })

    const otp    = generateOtp()
    const hashed = await hashOtp(otp)

    await prisma.otpToken.create({
      data: {
        userId:    user.id,
        code:      hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      },
    })

    await sendOtpEmail(normalizedEmail, otp, kandidat.nama)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-otp]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server, coba lagi" },
      { status: 500 }
    )
  }
}
