import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Kandidat } from "@/schemas";
import EvaluasiDetailClient from "@/components/admin/evaluasi/EvaluasiDetailClient";

async function getKandidatDetail(id: string): Promise<Kandidat | null> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from("kandidat")
      .select(`
        *,
        hasil_wawancara (
          *,
          detail_ekonomi_wawancara ( * ),
          pewawancara:pewawancara_id ( id, nama )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    const hw = Array.isArray(row.hasil_wawancara)
      ? row.hasil_wawancara[0]
      : row.hasil_wawancara;
    const pewawancaraData = Array.isArray(hw?.pewawancara)
      ? hw?.pewawancara[0]
      : hw?.pewawancara;
    const dew = Array.isArray(hw?.detail_ekonomi_wawancara)
      ? hw?.detail_ekonomi_wawancara[0]
      : hw?.detail_ekonomi_wawancara;

    return {
      ...row,
      nama: (row as Record<string, unknown>).nama_pendaftar,
      hasil_wawancara: undefined,
      hasil_wawancara_id: hw?.id,
      sosial_media: hw?.sosial_media,
      det_pekerjaan_ayah: hw?.det_pekerjaan_ayah,
      ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
      det_pekerjaan_ibu: hw?.det_pekerjaan_ibu,
      ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
      penghasilan_lain: hw?.penghasilan_lain,
      jumlah_orang_rumah: hw?.jumlah_orang_rumah,
      validasi_orang_rumah: hw?.validasi_orang_rumah,
      kepemilikan_rumah: hw?.kepemilikan_rumah,
      kepemilikan_kendaraan: hw?.kepemilikan_kendaraan,
      kepemilikan_elektronik: hw?.kepemilikan_elektronik,
      kelayakan_rumah: hw?.kelayakan_rumah,
      rekomendasi: hw?.rekomendasi,
      alasan: hw?.alasan,
      status_wawancara: hw?.status_wawancara,
      pewawancara_id: hw?.pewawancara_id,
      is_draft: hw?.is_draft,
      interviewed_at: hw?.interviewed_at,
      hasil_akhir: hw?.hasil_akhir ?? null,
      catatan_admin: hw?.catatan_admin ?? null,
      // dari detail_ekonomi_wawancara
      luas_tanah: dew?.luas_tanah,
      luas_bangunan: dew?.luas_bangunan,
      daya_listrik: dew?.daya_listrik,
      sumber_air: dew?.sumber_air,
      mck: dew?.mck,
      jml_tanggungan_sebenarnya: dew?.jml_tanggungan_sebenarnya,
      tahun_perolehan: dew?.tahun_perolehan,
      penghasilan_lain_dew: dew?.penghasilan_lain,
      // pewawancara
      pewawancara: pewawancaraData?.nama || null,
      pewawancara_data: pewawancaraData || null,
    } as unknown as Kandidat;
  } catch (err) {
    console.error("[Server] getKandidatDetail error:", err);
    return null;
  }
}

export default async function EvaluasiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kandidat = await getKandidatDetail(id);

  if (!kandidat) {
    notFound();
  }

  return <EvaluasiDetailClient kandidat={kandidat} id={id} />;
}
