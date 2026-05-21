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
          pewawancara:pewawancara_id ( id, nama, email, sso_id )
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

    return {
      ...row,
      hasil_wawancara: undefined,
      hasil_wawancara_id: hw?.id,
      validasi_kks: hw?.validasi_kks,
      validasi_kip: hw?.validasi_kip,
      validasi_sktm: hw?.validasi_sktm,
      sosial_media: hw?.sosial_media,
      ket_pekerjaan_ayah: hw?.ket_pekerjaan_ayah,
      ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
      ket_pekerjaan_ibu: hw?.ket_pekerjaan_ibu,
      ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
      penghasilan_lain: hw?.penghasilan_lain,
      jml_tanggungan_sebenarnya: hw?.jml_tanggungan_sebenarnya,
      validasi_orang_rumah: hw?.validasi_orang_rumah,
      kepemilikan_rumah: hw?.kepemilikan_rumah,
      tahun_perolehan: hw?.tahun_perolehan,
      luas_tanah: hw?.luas_tanah,
      luas_bangunan: hw?.luas_bangunan,
      sumber_air: hw?.sumber_air,
      mck: hw?.mck,
      aset: hw?.aset,
      kondisi_rumah: hw?.kondisi_rumah,
      jarak_pusat_kota: hw?.jarak_pusat_kota,
      rekomendasi: hw?.rekomendasi,
      alasan: hw?.alasan,
      pewawancara_id: hw?.pewawancara_id,
      is_draft: hw?.is_draft,
      interviewed_at: hw?.interviewed_at,
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
