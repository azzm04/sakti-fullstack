import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { z } from "zod"

const VerifyKandidatSchema = z.object({
  no_pendaftaran_kipk: z.string().min(1, "Nomor pendaftaran wajib diisi"),
  nama: z.string().min(1, "Nama lengkap wajib diisi"),
  email: z.string().email("Format email tidak valid"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = VerifyKandidatSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      )
    }

    const { no_pendaftaran_kipk, nama, email } = result.data

    // ── Cari kandidat di database Supabase ────────────────────────────────
    const { data: kandidat, error: dbError } = await supabaseAdmin
      .from("kandidat")
      .select("id, no_pendaftaran_kipk, nama, email, prodi, status_seleksi, jalur_masuk")
      .eq("no_pendaftaran_kipk", no_pendaftaran_kipk.trim())
      .ilike("nama", nama.trim()) // Case-insensitive match
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (dbError) {
      console.error("[verify-kandidat] DB error:", dbError)
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 }
      )
    }

    // ── Validasi: Data tidak cocok ─────────────────────────────────────────
    if (!kandidat) {
      return NextResponse.json(
        { error: "Data tidak cocok. Pastikan Nomor Pendaftaran, Nama, dan Email sesuai dengan data pendaftaran KIPK Anda." },
        { status: 404 }
      )
    }

    // ── Validasi: Status seleksi bukan "lolos" ─────────────────────────────
    if (kandidat.status_seleksi !== "lolos") {
      return NextResponse.json(
        { 
          error: "Mohon maaf, Anda belum dinyatakan LOLOS dalam seleksi KIPK.", 
          status_seleksi: kandidat.status_seleksi 
        },
        { status: 403 }
      )
    }

    // ── Berhasil: Data valid & status LOLOS ────────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Data terverifikasi! Silakan lanjut ke verifikasi email SSO Undip.",
      kandidat: {
        id: kandidat.id,
        no_pendaftaran_kipk: kandidat.no_pendaftaran_kipk,
        nama: kandidat.nama,
        email: kandidat.email,
        prodi: kandidat.prodi,
        jalur_masuk: kandidat.jalur_masuk,
      }
    })

  } catch (err) {
    console.error("[verify-kandidat]", err)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}