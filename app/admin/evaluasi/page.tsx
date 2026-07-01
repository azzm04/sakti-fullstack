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

      const pewawancaraData = Array.isArray((hw as Record<string, unknown>)?.pewawancara)
        ? ((hw as Record<string, unknown>)?.pewawancara as Array<Record<string, unknown>>)[0]
        : (hw as Record<string, unknown>)?.pewawancara;

      return {
        ...row,
        nama: (row as Record<string, unknown>).nama_pendaftar,
        hasil_wawancara: undefined,
        hasil_wawancara_id: (hw as Record<string, unknown>)?.id,
        sosial_media: (hw as Record<string, unknown>)?.sosial_media,
        ket_pekerjaan_ayah: (hw as Record<string, unknown>)?.ket_pekerjaan_ayah,
        ket_penghasilan_ayah: (hw as Record<string, unknown>)?.ket_penghasilan_ayah,
        ket_pekerjaan_ibu: (hw as Record<string, unknown>)?.ket_pekerjaan_ibu,
        ket_penghasilan_ibu: (hw as Record<string, unknown>)?.ket_penghasilan_ibu,
        penghasilan_lain: (hw as Record<string, unknown>)?.penghasilan_lain,
        jml_tanggungan_sebenarnya: (hw as Record<string, unknown>)?.jml_tanggungan_sebenarnya,
        validasi_orang_rumah: (hw as Record<string, unknown>)?.validasi_orang_rumah,
        kepemilikan_rumah: (hw as Record<string, unknown>)?.kepemilikan_rumah,
        rekomendasi: (hw as Record<string, unknown>)?.rekomendasi,
        alasan: (hw as Record<string, unknown>)?.alasan,
        pewawancara_id: (hw as Record<string, unknown>)?.pewawancara_id,
        is_draft: (hw as Record<string, unknown>)?.is_draft,
        interviewed_at: (hw as Record<string, unknown>)?.interviewed_at,
        hasil_akhir: (hw as Record<string, unknown>)?.hasil_akhir ?? null,
        catatan_admin: (hw as Record<string, unknown>)?.catatan_admin ?? null,
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
