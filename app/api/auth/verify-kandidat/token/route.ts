import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveProdiId } from "@/lib/penerima-kipk"
import { z } from "zod"

const BodySchema = z.object({
  token: z.string().min(1, "Token wajib diisi"),
})

const GENERIC_ERROR = "Link tidak valid atau sudah kedaluwarsa. Silakan verifikasi manual di bawah."

// POST — jalur cepat dari link personal di email "Lolos": kalau token valid,
// pemanggil (halaman verify-kandidat) bisa skip form 3-data manual dan
// langsung lanjut ke step OTP SSO. Sengaja pakai pesan error generik yang
// SAMA untuk semua kegagalan (token salah/sudah dipakai/status berubah/prodi
// gagal) — supaya tidak membocorkan informasi ke penebak token.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = BodySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { token } = result.data

    const { data: kandidat, error: dbError } = await supabaseAdmin
      .from("kandidat")
      .select("id, no_pendaftaran_kipk, nama_pendaftar, email, prodi_pendaftar, jalur_masuk, status_sk")
      .eq("verifikasi_token", token)
      .is("verifikasi_token_used_at", null)
      .maybeSingle()

    if (dbError) {
      console.error("[verify-kandidat/token] DB error:", dbError)
      return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
    }

    if (!kandidat || kandidat.status_sk !== "Ditetapkan") {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 })
    }

    // Fail-fast prodi check — sama seperti jalur manual, jaga-jaga kalau
    // data prodi berubah setelah token digenerate.
    const prodiId = await resolveProdiId(kandidat.prodi_pendaftar)
    if (!prodiId) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      kandidat: {
        id: kandidat.id,
        no_pendaftaran_kipk: kandidat.no_pendaftaran_kipk,
        nama: kandidat.nama_pendaftar,
        email: kandidat.email,
        prodi: kandidat.prodi_pendaftar,
        jalur_masuk: kandidat.jalur_masuk,
      },
    })
  } catch (err) {
    console.error("[verify-kandidat/token]", err)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
