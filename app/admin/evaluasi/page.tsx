import { supabaseAdmin } from "@/lib/supabase";
import type { MahasiswaEvaluasi, EvaluasiApiResponse } from "@/schemas";
import EvaluasiClient from "@/components/admin/evaluasi/EvaluasiClient";

async function getInitialEvaluasiData(): Promise<EvaluasiApiResponse> {
  try {
    const limit = 100;

    const { data: rawData, count, error } = await supabaseAdmin
      .from("kandidat")
      .select(`
        *,
        hasil_wawancara (
          *,
          pewawancara:pewawancara_id (nama)
        )
      `, { count: "exact" })
      .order("no", { ascending: true })
      .range(0, limit - 1);

    if (error) throw error;

    const data: MahasiswaEvaluasi[] = (rawData ?? []).map((row: Record<string, unknown>) => {
      const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;

      let mappedHasil = null;
      const rekDb = (hw as Record<string, unknown>)?.rekomendasi?.toString().toLowerCase() || "";
      if (rekDb.includes("tidak")) mappedHasil = 3;
      else if (rekDb.includes("pertimbang")) mappedHasil = 2;
      else if (rekDb.includes("layak")) mappedHasil = 1;

      const pewawancaraData = Array.isArray((hw as Record<string, unknown>)?.pewawancara)
        ? ((hw as Record<string, unknown>)?.pewawancara as Array<Record<string, unknown>>)[0]
        : (hw as Record<string, unknown>)?.pewawancara;

      return {
        ...row,
        hasil_wawancara: undefined,
        hasil_wawancara_id: (hw as Record<string, unknown>)?.id,
        validasi_kks: (hw as Record<string, unknown>)?.validasi_kks,
        validasi_kip: (hw as Record<string, unknown>)?.validasi_kip,
        validasi_sktm: (hw as Record<string, unknown>)?.validasi_sktm,
        sosial_media: (hw as Record<string, unknown>)?.sosial_media,
        ket_pekerjaan_ayah: (hw as Record<string, unknown>)?.ket_pekerjaan_ayah,
        ket_penghasilan_ayah: (hw as Record<string, unknown>)?.ket_penghasilan_ayah,
        ket_pekerjaan_ibu: (hw as Record<string, unknown>)?.ket_pekerjaan_ibu,
        ket_penghasilan_ibu: (hw as Record<string, unknown>)?.ket_penghasilan_ibu,
        penghasilan_lain: (hw as Record<string, unknown>)?.penghasilan_lain,
        jml_tanggungan_sebenarnya: (hw as Record<string, unknown>)?.jml_tanggungan_sebenarnya,
        validasi_orang_rumah: (hw as Record<string, unknown>)?.validasi_orang_rumah,
        kepemilikan_rumah: (hw as Record<string, unknown>)?.kepemilikan_rumah,
        tahun_perolehan: (hw as Record<string, unknown>)?.tahun_perolehan,
        luas_tanah: (hw as Record<string, unknown>)?.luas_tanah,
        luas_bangunan: (hw as Record<string, unknown>)?.luas_bangunan,
        sumber_air: (hw as Record<string, unknown>)?.sumber_air,
        mck: (hw as Record<string, unknown>)?.mck,
        aset: (hw as Record<string, unknown>)?.aset,
        kondisi_rumah: (hw as Record<string, unknown>)?.kondisi_rumah,
        jarak_pusat_kota: (hw as Record<string, unknown>)?.jarak_pusat_kota,
        rekomendasi: (hw as Record<string, unknown>)?.rekomendasi,
        alasan: (hw as Record<string, unknown>)?.alasan,
        pewawancara_id: (hw as Record<string, unknown>)?.pewawancara_id,
        is_draft: (hw as Record<string, unknown>)?.is_draft,
        interviewed_at: (hw as Record<string, unknown>)?.interviewed_at,
        hasil_akhir: mappedHasil,
        pewawancara: (pewawancaraData as Record<string, unknown>)?.nama || null,
      } as unknown as MahasiswaEvaluasi;
    });

    // Stats
    const { count: totalKandidat } = await supabaseAdmin
      .from("kandidat")
      .select("id", { count: "exact", head: true });
    const { count: totalWawancara } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true });

    const realTotal = totalKandidat ?? 0;
    const realTotalSelesai = totalWawancara ?? 0;
    const realTotalBelum = realTotal - realTotalSelesai;

    return {
      data,
      total: count ?? 0,
      page: 1,
      totalPages: Math.ceil((count ?? 0) / limit),
      totalSelesai: realTotalSelesai,
      totalBelum: realTotalBelum,
    };
  } catch (err) {
    console.error("[Server] getInitialEvaluasiData error:", err);
    return {
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
      totalSelesai: 0,
      totalBelum: 0,
    };
  }
}

export default async function EvaluasiPage() {
  const initialData = await getInitialEvaluasiData();

  return <EvaluasiClient initialData={initialData} />;
}
