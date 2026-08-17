import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ringkasan angka kunci untuk kartu "Ringkasan Keputusan" di halaman evaluasi
 * detail — murni rangkuman dari data kandidat & hasil wawancara yang sudah
 * ada (per-kapita, desil DTSEN, jarak pusat kota). Tidak ada skor, prediksi,
 * atau model di sini: keputusan kelayakan tetap sepenuhnya di tangan
 * pewawancara & admin.
 */

export interface EvaluasiInsightInput {
  desilDtsen?: string | null;
  jarakPusatKota?: number | null;
  penghasilanAyah?: number | null;
  penghasilanIbu?: number | null;
  penghasilanLain?: number | null;
  jumlahTanggungan?: number | null;
  jmlTanggunganSebenarnya?: number | null;
}

export interface EvaluasiInsight {
  perKapita: number | null;
  perKapitaLabel: string;
  /** Rincian rumus per-kapita, mis. "Rp 2,25 jt ÷ 4 orang" — untuk caption kartu. */
  perKapitaFormula: string;
  desilAngka: number | null;
  desilLabel: string;
  /** Kualifier singkat untuk caption kartu, mis. "di bawah ambang batas". */
  desilCaption: string;
  jarakKm: number | null;
  jarakLabel: string;
  /** Kualifier singkat untuk caption kartu, mis. "wilayah pinggiran". */
  jarakCaption: string;
}

/** Ambil angka desil dari teks bebas seperti "Desil 3", "3", "DESIL 3 (Miskin)". */
function parseDesil(val?: string | null): number | null {
  if (!val) return null;
  const m = String(val).match(/\d+/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n >= 1 && n <= 10 ? n : null;
}

function desilLabelFromAngka(desil: number | null): string {
  if (desil === null) return "Tidak diketahui";
  if (desil <= 2) return `Desil ${desil} — Sangat Miskin`;
  if (desil <= 4) return `Desil ${desil} — Miskin`;
  if (desil <= 6) return `Desil ${desil} — Rentan Miskin`;
  return `Desil ${desil} — Menengah ke atas`;
}

function jarakLabelFromKm(km: number | null): string {
  if (km === null) return "Tidak diketahui";
  if (km <= 10) return `${km} km — Dekat pusat kota`;
  if (km <= 30) return `${km} km — Sedang`;
  return `${km} km — Jauh dari pusat kota`;
}

export function computeEvaluasiInsight(input: EvaluasiInsightInput): EvaluasiInsight {
  const jumlahOrang =
    input.jmlTanggunganSebenarnya ?? input.jumlahTanggungan ?? null;
  const totalPenghasilan =
    (input.penghasilanAyah ?? 0) +
    (input.penghasilanIbu ?? 0) +
    (input.penghasilanLain ?? 0);
  const hasPenghasilanData =
    (input.penghasilanAyah !== null && input.penghasilanAyah !== undefined) ||
    (input.penghasilanIbu !== null && input.penghasilanIbu !== undefined);

  const perKapita =
    hasPenghasilanData && jumlahOrang && jumlahOrang > 0
      ? Math.round(totalPenghasilan / (jumlahOrang))
      : null;

  const desilAngka = parseDesil(input.desilDtsen);
  const jarakKm = input.jarakPusatKota ?? null;

  return {
    perKapita,
    perKapitaLabel:
      perKapita === null ? "Data penghasilan belum lengkap" : formatRupiah(perKapita) + " / bulan",
    perKapitaFormula:
      hasPenghasilanData && jumlahOrang
        ? `${formatRupiahSingkat(totalPenghasilan)} ÷ ${jumlahOrang} orang`
        : "Data belum lengkap",
    desilAngka,
    desilLabel: desilLabelFromAngka(desilAngka),
    desilCaption:
      desilAngka === null ? "Data desil belum tersedia" : desilAngka <= 4 ? "di bawah ambang batas" : "di atas ambang batas",
    jarakKm,
    jarakLabel: jarakLabelFromKm(jarakKm),
    jarakCaption:
      jarakKm === null ? "Data jarak belum tersedia" : jarakKm <= 10 ? "pusat kota" : jarakKm <= 30 ? "wilayah pinggiran" : "wilayah terpencil",
  };
}

function formatRupiah(n: number): string {
  return "Rp " + n.toLocaleString("id-ID");
}

/** Format ringkas untuk caption, mis. 2250000 -> "Rp 2,25 jt". Di bawah 1 juta tampil apa adanya. */
function formatRupiahSingkat(n: number): string {
  if (n >= 1_000_000) {
    return "Rp " + (n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 }) + " jt";
  }
  return formatRupiah(n);
}

/**
 * Hitung berapa kandidat lain (jalur masuk + desil + kode kepemilikan rumah
 * yang sama, sudah selesai dievaluasi) berbagi karakteristik yang sama dengan
 * kandidat ini — dipakai untuk caption "ditemukan N kandidat lain dengan
 * karakteristik serupa". Query nyata ke data yang sudah diwawancarai, bukan
 * angka fiktif atau prediksi.
 */
export async function countPolaSerupa(
  supabaseAdmin: SupabaseClient,
  params: {
    kandidatId: string;
    jalurMasuk?: string | null;
    desilDtsen?: string | null;
    kepemilikanRumah?: number | null;
  },
): Promise<number> {
  if (!params.jalurMasuk || !params.desilDtsen || params.kepemilikanRumah === null || params.kepemilikanRumah === undefined) {
    return 0;
  }

  const { count, error } = await supabaseAdmin
    .from("kandidat")
    .select("id, hasil_wawancara!inner(hasil_akhir, kepemilikan_rumah)", {
      count: "exact",
      head: true,
    })
    .eq("jalur_masuk", params.jalurMasuk)
    .eq("desil_dtsen", params.desilDtsen)
    .eq("hasil_wawancara.kepemilikan_rumah", params.kepemilikanRumah)
    .neq("id", params.kandidatId)
    .not("hasil_wawancara.hasil_akhir", "is", null);

  if (error) return 0;
  return count ?? 0;
}
