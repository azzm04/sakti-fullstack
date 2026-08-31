import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveProdiId } from "@/lib/penerima-kipk"
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

    // ── Cari kandidat di database (skema kandidat baru) ─────────────────────
    // Pakai order+limit(1) bukan maybeSingle() supaya tidak error kalau ada
    // duplikat data lama yang cocok di ketiga kolom sekaligus.
    const { data: kandidatRows, error: dbError } = await supabaseAdmin
      .from("kandidat")
      .select("id, no_pendaftaran_kipk, nama_pendaftar, email, prodi_pendaftar, jalur_masuk, status_sk")
      .eq("no_pendaftaran_kipk", no_pendaftaran_kipk.trim())
      .ilike("nama_pendaftar", nama.trim())
      .eq("email", email.toLowerCase().trim())
      .order("created_at", { ascending: false })
      .limit(1)

    if (dbError) {
      console.error("[verify-kandidat] DB error:", dbError)
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 }
      )
    }

    const kandidat = kandidatRows?.[0]

    // ── Validasi: Data tidak cocok ─────────────────────────────────────────
    if (!kandidat) {
      return NextResponse.json(
        { error: "Data tidak cocok. Pastikan Nomor Pendaftaran, Nama, dan Email sesuai dengan data pendaftaran KIPK Anda." },
        { status: 404 }
      )
    }

    // ── Validasi: belum ditetapkan resmi lewat SK ───────────────────────────
    if (kandidat.status_sk !== "Ditetapkan") {
      return NextResponse.json(
        {
          error: "Mohon maaf, Anda belum dinyatakan LOLOS/DITETAPKAN dalam SK resmi penerima KIP-K.",
          status_sk: kandidat.status_sk,
        },
        { status: 403 }
      )
    }

    // ── Fail-fast: pastikan prodi bisa dipetakan sebelum lanjut ke step OTP ──
    const prodiId = await resolveProdiId(kandidat.prodi_pendaftar)
    if (!prodiId) {
      return NextResponse.json(
        {
          error: `Program studi "${kandidat.prodi_pendaftar ?? "-"}" belum terdaftar di sistem. Silakan hubungi admin sebelum melanjutkan registrasi.`,
        },
        { status: 409 }
      )
    }

    // ── Berhasil: Data valid & status Ditetapkan ────────────────────────────
    return NextResponse.json({
      success: true,
      message: "Data terverifikasi! Silakan lanjut ke verifikasi email SSO Undip.",
      kandidat: {
        id: kandidat.id,
        no_pendaftaran_kipk: kandidat.no_pendaftaran_kipk,
        nama: kandidat.nama_pendaftar,
        email: kandidat.email,
        prodi: kandidat.prodi_pendaftar,
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
