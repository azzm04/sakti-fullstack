import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ─────────────────────────────────────────────────────────────────
// Types — bentuk response yang dikirim oleh FastAPI (sakti-analitik)
// ─────────────────────────────────────────────────────────────────

interface RingkasanAnalitik {
  total_pendaftar: number;
  total_diusulkan: number;
  total_tidak_diusulkan: number;
  pct_diusulkan: number;
  pct_tidak_diusulkan: number;
  tahun_seleksi?: string | null;
  jalur_masuk?: string;
}

interface KonsistensiAnalitik {
  akurasi_model: number;
  cv_accuracy?: number;
  pct_dapat_dijelaskan: number;
  pct_kasus_ambigu: number;
  jumlah_kasus_ambigu: number;
  jumlah_total_uji: number;
  precision_diusulkan?: number | null;
  recall_diusulkan?: number | null;
  f1_diusulkan?: number | null;
  precision_tidak?: number | null;
  recall_tidak?: number | null;
  f1_tidak?: number | null;
  confusion_matrix?: number[][] | null;
}

interface ModelInfoAnalitik {
  algoritma: string;
  best_params?: Record<string, unknown>;
  cv_accuracy: number;
  train_accuracy: number;
  test_accuracy: number;
  jumlah_fitur: number;
  jumlah_data_train: number;
  jumlah_data_test: number;
}

interface FeatureImportanceItem {
  fitur: string;
  importance: number;
  pct: number;
  berkontribusi: boolean;
}

interface RuleNodeItem {
  kondisi: string;
  keputusan: string;
  jumlah_sampel: number;
  confidence: number;
  n_diusulkan: number;
  n_tidak: number;
}

interface KasusAmbiguItem {
  index: number;
  keputusan_aktual: string;
  prediksi_model: string;
  probabilitas: number;
  aktif_dtsen: string;
  desil_dtsen: string;
  nominal_per_kapita: number | null;
  kondisi_rumah: string;
  skor_kejanggalan: number;
  tingkat_kejanggalan: string;
  alasan_kejanggalan: string | null;
}

interface DistribusiItem {
  label: string;
  diusulkan: number;
  tidak_diusulkan: number;
  total: number;
  pct_diusulkan: number;
}

interface DistribusiGeografisItem {
  provinsi: string;
  total: number;
  diusulkan: number;
  tidak_diusulkan: number;
  pct_diusulkan: number;
}

interface DistribusiFakultasItem {
  fakultas: string;
  total_penerima: number;
  laki_laki: number;
  perempuan: number;
}

/** Response utuh dari endpoint FastAPI /api/v1/analitik/dashboard */
interface AnalitikApiResponse {
  status: string;
  pesan: string;
  sumber?: string;
  waktu_proses_ms: number;
  impor_data_id?: string | null;
  ringkasan: RingkasanAnalitik;
  feature_importance: FeatureImportanceItem[];
  konsistensi: KonsistensiAnalitik;
  rule_text: string;
  rule_nodes: RuleNodeItem[];
  kasus_ambigu: KasusAmbiguItem[];
  distribusi_desil_dtsen: DistribusiItem[];
  distribusi_kondisi_rumah: DistribusiItem[];
  distribusi_aktif_dtsen: DistribusiItem[];
  distribusi_geografis: DistribusiGeografisItem[];
  distribusi_jenis_kelamin: DistribusiItem[];
  distribusi_fakultas: DistribusiFakultasItem[];
  model_info: ModelInfoAnalitik;
}

/** Baris tabel hasil_analitik_dt — dibaca via cache lookup */
interface HasilAnalitikDtRow {
  waktu_proses_ms: number | null;
  total_pendaftar: number;
  total_diusulkan: number;
  total_tidak_diusulkan: number;
  pct_diusulkan: number;
  pct_tidak_diusulkan: number;
  tahun_seleksi: number;
  jalur_masuk: string;
  fitur_importance: string | FeatureImportanceItem[] | null;
  akurasi_model: number;
  cv_accuracy: number;
  konsistensi_pct: number;
  pct_kasus_ambigu: number;
  jumlah_kasus_ambigu: number;
  jumlah_data_uji: number;
  precision_diusulkan: number | null;
  recall_diusulkan: number | null;
  f1_diusulkan: number | null;
  precision_tidak: number | null;
  recall_tidak: number | null;
  f1_tidak: number | null;
  confusion_matrix: string | number[][] | null;
  rule_text: string;
  rule_nodes: string | RuleNodeItem[] | null;
  kasus_ambigu_detail: string | KasusAmbiguItem[] | null;
  distribusi_desil_dtsen: string | DistribusiItem[] | null;
  distribusi_kondisi_rumah: string | DistribusiItem[] | null;
  distribusi_aktif_dtsen: string | DistribusiItem[] | null;
  distribusi_geografis: string | DistribusiGeografisItem[] | null;
  distribusi_fakultas: string | DistribusiFakultasItem[] | null;
  distribusi_jenis_kelamin: string | DistribusiItem[] | null;
  best_params: string | Record<string, unknown> | null;
  jumlah_fitur: number;
  jumlah_data_latih: number;
  akurasi_latih: number;
}

/** Payload yang di-upsert ke tabel hasil_analitik_dt */
type CachePayload = {
  impor_data_id: string | null;
  tahun_seleksi: number;
  jalur_masuk: string;
  total_pendaftar: number;
  total_diusulkan: number;
  total_tidak_diusulkan: number;
  pct_diusulkan: number;
  pct_tidak_diusulkan: number;
  akurasi_model: number;
  konsistensi_pct: number;
  pct_kasus_ambigu: number;
  jumlah_kasus_ambigu: number;
  jumlah_data_uji: number;
  precision_diusulkan: number | null;
  recall_diusulkan: number | null;
  f1_diusulkan: number | null;
  precision_tidak: number | null;
  recall_tidak: number | null;
  f1_tidak: number | null;
  confusion_matrix: number[][] | null;
  akurasi_latih: number;
  cv_accuracy: number;
  best_params: Record<string, unknown>;
  jumlah_fitur: number;
  jumlah_data_latih: number;
  waktu_proses_ms: number | null;
  rule_text: string;
  rule_nodes: RuleNodeItem[];
  fitur_importance: FeatureImportanceItem[];
  kasus_ambigu_detail: KasusAmbiguItem[];
  distribusi_desil_dtsen: DistribusiItem[];
  distribusi_kondisi_rumah: DistribusiItem[];
  distribusi_aktif_dtsen: DistribusiItem[];
  distribusi_geografis: DistribusiGeografisItem[];
  distribusi_jenis_kelamin: DistribusiItem[];
  distribusi_fakultas: DistribusiFakultasItem[];
  analyzed_at: string;
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function parseJSON<T>(val: string | T | null | undefined, fallback: T): T {
  if (typeof val === "string") {
    try {
      return JSON.parse(val) as T;
    } catch {
      return fallback;
    }
  }
  return val ?? fallback;
}

function buildCachePayload(
  body: AnalitikApiResponse,
  tahun: string,
  jalurMasuk: string,
): CachePayload {
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
    distribusi_desil_dtsen: body.distribusi_desil_dtsen ?? [],
    distribusi_kondisi_rumah: body.distribusi_kondisi_rumah ?? [],
    distribusi_aktif_dtsen: body.distribusi_aktif_dtsen ?? [],
    distribusi_geografis: body.distribusi_geografis ?? [],
    distribusi_jenis_kelamin: body.distribusi_jenis_kelamin ?? [],
    distribusi_fakultas: body.distribusi_fakultas ?? [],
    analyzed_at: new Date().toISOString(),
  };
}

async function simpanCacheAnalitik(
  body: AnalitikApiResponse,
  tahun: string,
  jalurMasuk: string,
): Promise<void> {
  const payload = buildCachePayload(body, tahun, jalurMasuk);

  const { error } = await supabaseAdmin
    .from("hasil_analitik_dt")
    .upsert(payload, { onConflict: "tahun_seleksi,jalur_masuk" });

  if (!error) return;

  // Fallback untuk skema DB lama yang belum punya kolom distribusi_jenis_kelamin / distribusi_fakultas
  const { distribusi_jenis_kelamin, distribusi_fakultas, ...legacyPayload } =
    payload;

  const legacyResult = await supabaseAdmin
    .from("hasil_analitik_dt")
    .upsert(legacyPayload, { onConflict: "tahun_seleksi,jalur_masuk" });

  if (legacyResult.error) {
    console.error("[GET /api/admin/analitik] simpan cache gagal:", error);
    console.error(
      "[GET /api/admin/analitik] fallback cache gagal:",
      legacyResult.error,
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GET /api/admin/analitik?tahun=2026&jalur_masuk=SNBT+Eligible&refresh=false
// ─────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tahun = searchParams.get("tahun");
  const jalurMasuk = searchParams.get("jalur_masuk");
  const refresh = searchParams.get("refresh") === "true";

  if (!tahun || !jalurMasuk) {
    return NextResponse.json(
      { error: "Parameter tahun dan jalur_masuk wajib diisi" },
      { status: 400 },
    );
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
      .maybeSingle<HasilAnalitikDtRow>();

    if (cached) {
      const hasEnrichedDistributions =
        cached.distribusi_fakultas != null &&
        cached.distribusi_jenis_kelamin != null;

      if (hasEnrichedDistributions) {
        const response: AnalitikApiResponse = {
          status: "success",
          pesan: "Analisis diambil dari cache database",
          sumber: "cache",
          waktu_proses_ms: cached.waktu_proses_ms ?? 0,
          ringkasan: {
            total_pendaftar: cached.total_pendaftar,
            total_diusulkan: cached.total_diusulkan,
            total_tidak_diusulkan: cached.total_tidak_diusulkan,
            pct_diusulkan: cached.pct_diusulkan,
            pct_tidak_diusulkan: cached.pct_tidak_diusulkan,
            tahun_seleksi: String(cached.tahun_seleksi),
            jalur_masuk: cached.jalur_masuk,
          },
          feature_importance: parseJSON(cached.fitur_importance, []),
          konsistensi: {
            akurasi_model: cached.akurasi_model,
            cv_accuracy: cached.cv_accuracy,
            pct_dapat_dijelaskan: cached.konsistensi_pct,
            pct_kasus_ambigu: cached.pct_kasus_ambigu,
            jumlah_kasus_ambigu: cached.jumlah_kasus_ambigu,
            jumlah_total_uji: cached.jumlah_data_uji,
            precision_diusulkan: cached.precision_diusulkan,
            recall_diusulkan: cached.recall_diusulkan,
            f1_diusulkan: cached.f1_diusulkan,
            precision_tidak: cached.precision_tidak,
            recall_tidak: cached.recall_tidak,
            f1_tidak: cached.f1_tidak,
            confusion_matrix: parseJSON<number[][] | null>(
              cached.confusion_matrix,
              null,
            ),
          },
          rule_text: cached.rule_text,
          rule_nodes: parseJSON(cached.rule_nodes, []),
          kasus_ambigu: parseJSON(cached.kasus_ambigu_detail, []),
          distribusi_desil_dtsen: parseJSON(cached.distribusi_desil_dtsen, []),
          distribusi_kondisi_rumah: parseJSON(
            cached.distribusi_kondisi_rumah,
            [],
          ),
          distribusi_aktif_dtsen: parseJSON(cached.distribusi_aktif_dtsen, []),
          distribusi_geografis: parseJSON(cached.distribusi_geografis, []),
          distribusi_fakultas: parseJSON(cached.distribusi_fakultas, []),
          distribusi_jenis_kelamin: parseJSON(
            cached.distribusi_jenis_kelamin,
            [],
          ),
          model_info: {
            algoritma: "Decision Tree",
            best_params: parseJSON(cached.best_params, {}),
            cv_accuracy: cached.cv_accuracy,
            train_accuracy: cached.akurasi_latih,
            test_accuracy: cached.akurasi_model,
            jumlah_fitur: cached.jumlah_fitur,
            jumlah_data_train: cached.jumlah_data_latih,
            jumlah_data_test: cached.jumlah_data_uji,
          },
        };

        return NextResponse.json(response);
      }
    }
  }

  // ── Langkah 2: Forward ke FastAPI ────────────────────────────────────────
  const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL;
  const params = new URLSearchParams({ tahun, jalur_masuk: jalurMasuk });
  if (refresh) params.set("refresh", "true");

  try {
    const fastapiRes = await fetch(
      `${baseUrl}/api/v1/analitik/dashboard?${params}`,
      { cache: "no-store", signal: AbortSignal.timeout(60_000) },
    );

    const body: AnalitikApiResponse = await fastapiRes.json();

    if (!fastapiRes.ok) {
      return NextResponse.json(body, { status: fastapiRes.status });
    }

    await simpanCacheAnalitik(body, tahun, jalurMasuk);

    return NextResponse.json({ ...body, sumber: body.sumber ?? "computed" });
  } catch {
    return NextResponse.json(
      {
        error: "Server analitik tidak dapat dijangkau.",
        detail:
          "Pastikan FastAPI berjalan di port 8001, atau data belum tersedia untuk kombinasi tahun dan jalur masuk ini.",
      },
      { status: 503 },
    );
  }
}
