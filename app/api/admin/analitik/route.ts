import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function parseJSON(val: unknown) {
  if (typeof val === "string") {
    try {
      return JSON.parse(val)
    } catch {
      return val
    }
  }

  return val
}

function buildCachePayload(body: any, tahun: string, jalurMasuk: string) {
  return {
    impor_data_id: body.impor_data_id ?? null,
    tahun_seleksi: parseInt(tahun),
    jalur_masuk: jalurMasuk,
    total_pendaftar: body.ringkasan.total_pendaftar,
    total_diusulkan: body.ringkasan.total_diusulkan,
    total_tidak_diusulkan: body.ringkasan.total_tidak_diusulkan,
    pct_diusulkan: body.ringkasan.pct_diusulkan,
    pct_tidak_diusulkan: body.ringkasan.pct_tidak_diusulkan,
    akurasi_model: body.konsistensi.akurasi_model,
    konsistensi_pct: body.konsistensi.pct_dapat_dijelaskan,
    pct_kasus_ambigu: body.konsistensi.pct_kasus_ambigu,
    jumlah_kasus_ambigu: body.konsistensi.jumlah_kasus_ambigu,
    jumlah_data_uji: body.konsistensi.jumlah_total_uji,
    precision_diusulkan: body.konsistensi.precision_diusulkan ?? null,
    recall_diusulkan: body.konsistensi.recall_diusulkan ?? null,
    f1_diusulkan: body.konsistensi.f1_diusulkan ?? null,
    precision_tidak: body.konsistensi.precision_tidak ?? null,
    recall_tidak: body.konsistensi.recall_tidak ?? null,
    f1_tidak: body.konsistensi.f1_tidak ?? null,
    confusion_matrix: body.konsistensi.confusion_matrix ?? null,
    akurasi_latih: body.model_info.train_accuracy,
    cv_accuracy: body.model_info.cv_accuracy,
    best_params: body.model_info.best_params ?? {},
    jumlah_fitur: body.model_info.jumlah_fitur,
    jumlah_data_latih: body.model_info.jumlah_data_train,
    waktu_proses_ms: body.waktu_proses_ms ?? null,
    rule_text: body.rule_text ?? "",
    rule_nodes: body.rule_nodes ?? [],
    fitur_importance: body.feature_importance ?? [],
    kasus_ambigu_detail: body.kasus_ambigu ?? [],
    distribusi_p3ke: body.distribusi_p3ke ?? [],
    distribusi_kondisi_rumah: body.distribusi_kondisi_rumah ?? [],
    distribusi_dtks: body.distribusi_dtks ?? [],
    distribusi_geografis: body.distribusi_geografis ?? [],
    distribusi_jenis_kelamin: body.distribusi_jenis_kelamin ?? [],
    distribusi_fakultas: body.distribusi_fakultas ?? [],
    analyzed_at: new Date().toISOString(),
  }
}

async function simpanCacheAnalitik(body: any, tahun: string, jalurMasuk: string) {
  const payload = buildCachePayload(body, tahun, jalurMasuk)

  const { error } = await supabaseAdmin
    .from("hasil_analitik_dt")
    .upsert(payload, { onConflict: "tahun_seleksi,jalur_masuk" })

  if (!error) return

  const legacyPayload = { ...payload }
  delete legacyPayload.distribusi_jenis_kelamin
  delete legacyPayload.distribusi_fakultas

  const legacyResult = await supabaseAdmin
    .from("hasil_analitik_dt")
    .upsert(legacyPayload, { onConflict: "tahun_seleksi,jalur_masuk" })

  if (legacyResult.error) {
    console.error("[GET /api/admin/analitik] simpan cache gagal:", error)
    console.error("[GET /api/admin/analitik] fallback cache gagal:", legacyResult.error)
  }
}

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
      const hasEnrichedDistributions =
        cached.distribusi_fakultas != null &&
        cached.distribusi_jenis_kelamin != null

      if (hasEnrichedDistributions) {
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
          distribusi_fakultas:      parseJSON(cached.distribusi_fakultas) ?? [],
          distribusi_jenis_kelamin: parseJSON(cached.distribusi_jenis_kelamin) ?? [],
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
  }

  // ── Langkah 2: Forward ke FastAPI ────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL
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

    await simpanCacheAnalitik(body, tahun, jalurMasuk)

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
