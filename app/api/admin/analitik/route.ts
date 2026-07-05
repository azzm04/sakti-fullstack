import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET /api/admin/analitik?tahun=2026&jalur_masuk=SNBT+Eligible&refresh=false
 *
 * Alur:
 * 1. Cek cache hasil_analitik_dt di Supabase
 * 2. Jika ada → kembalikan langsung (tidak perlu FastAPI)
 * 3. Jika tidak ada / refresh=true → forward ke FastAPI
 * 4. Jika FastAPI tidak bisa dijangkau → kembalikan error yang informatif
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tahun      = searchParams.get("tahun")
  const jalurMasuk = searchParams.get("jalur_masuk")
  const refresh    = searchParams.get("refresh") === "true"

  if (!tahun || !jalurMasuk) {
    return NextResponse.json(
      { error: "Parameter tahun dan jalur_masuk wajib diisi" },
      { status: 400 }
    )
  }

  // ── Langkah 1: Cek cache di Supabase (skip jika refresh=true) ────────────
  if (!refresh) {
    const { data: cached } = await supabaseAdmin
      .from("hasil_analitik_dt")
      .select("*")
      .eq("tahun_seleksi", parseInt(tahun))
      .eq("jalur_masuk", jalurMasuk)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cached) {
      // Parse kolom JSON yang tersimpan sebagai string
      const parseJSON = (val: unknown) => {
        if (typeof val === "string") {
          try { return JSON.parse(val) } catch { return val }
        }
        return val
      }

      const response = {
        status:          "success",
        pesan:           "Analisis diambil dari cache database",
        sumber:          "cache",
        waktu_proses_ms: cached.waktu_proses_ms ?? 0,
        ringkasan: {
          total_pendaftar:       cached.total_pendaftar,
          total_diusulkan:       cached.total_diusulkan,
          total_tidak_diusulkan: cached.total_tidak_diusulkan,
          pct_diusulkan:         cached.pct_diusulkan,
          pct_tidak_diusulkan:   cached.pct_tidak_diusulkan,
          tahun_seleksi:         String(cached.tahun_seleksi),
          jalur_masuk:           cached.jalur_masuk,
        },
        feature_importance: parseJSON(cached.fitur_importance) ?? [],
        konsistensi: {
          akurasi_model:          cached.akurasi_model,
          cv_accuracy:            cached.cv_accuracy,
          pct_dapat_dijelaskan:   cached.konsistensi_pct,
          pct_kasus_ambigu:       cached.pct_kasus_ambigu,
          jumlah_kasus_ambigu:    cached.jumlah_kasus_ambigu,
          jumlah_total_uji:       cached.jumlah_data_uji,
          precision_diusulkan:    cached.precision_diusulkan,
          recall_diusulkan:       cached.recall_diusulkan,
          f1_diusulkan:           cached.f1_diusulkan,
          precision_tidak:        cached.precision_tidak,
          recall_tidak:           cached.recall_tidak,
          f1_tidak:               cached.f1_tidak,
          confusion_matrix:       parseJSON(cached.confusion_matrix),
        },
        rule_text:                cached.rule_text,
        rule_nodes:               parseJSON(cached.rule_nodes) ?? [],
        kasus_ambigu:             parseJSON(cached.kasus_ambigu_detail) ?? [],
        distribusi_p3ke:          parseJSON(cached.distribusi_p3ke) ?? [],
        distribusi_kondisi_rumah: parseJSON(cached.distribusi_kondisi_rumah) ?? [],
        distribusi_dtks:          parseJSON(cached.distribusi_dtks) ?? [],
        distribusi_geografis:     parseJSON(cached.distribusi_geografis) ?? [],
        model_info: {
          algoritma:         "Decision Tree",
          best_params:       parseJSON(cached.best_params) ?? {},
          cv_accuracy:       cached.cv_accuracy,
          train_accuracy:    cached.akurasi_latih,
          test_accuracy:     cached.akurasi_model,
          jumlah_fitur:      cached.jumlah_fitur,
          jumlah_data_train: cached.jumlah_data_latih,
          jumlah_data_test:  cached.jumlah_data_uji,
        },
      }

      return NextResponse.json(response)
    }
  }

  // ── Langkah 2: Forward ke FastAPI ────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8001"
  const params  = new URLSearchParams({ tahun, jalur_masuk: jalurMasuk })
  if (refresh) params.set("refresh", "true")

  try {
    const fastapiRes = await fetch(
      `${baseUrl}/api/v1/analitik/dashboard?${params}`,
      { cache: "no-store", signal: AbortSignal.timeout(60_000) }
    )

    const body = await fastapiRes.json()

    if (!fastapiRes.ok) {
      return NextResponse.json(body, { status: fastapiRes.status })
    }

    return NextResponse.json({ ...body, sumber: body.sumber ?? "computed" })
  } catch {
    return NextResponse.json(
      {
        error: "Server analitik tidak dapat dijangkau.",
        detail: "Pastikan FastAPI berjalan di port 8001, atau data belum tersedia untuk kombinasi tahun dan jalur masuk ini.",
      },
      { status: 503 }
    )
  }
}
