import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import type { Kandidat } from "@/schemas";
import { computeEvaluasiInsight, countPolaSerupa } from "@/lib/evaluasi-insight";
import EvaluasiDetailClient from "@/components/admin/evaluasi/EvaluasiDetailClient";

async function getKandidatDetail(id: string) {
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

    const { data: riwayat } = await supabaseAdmin
      .from("kandidat_riwayat")
      .select("id, tipe, deskripsi, aktor, created_at")
      .eq("kandidat_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    const kandidat = {
      ...row,
      nama: (row as Record<string, unknown>).nama_pendaftar,
      hasil_wawancara: undefined,
      hasil_wawancara_id: hw?.id,
      sosial_media: hw?.sosial_media,
      validasi_kks: hw?.validasi_kks,
      validasi_kip: hw?.validasi_kip,
      validasi_sktm: hw?.validasi_sktm,
      ket_pekerjaan_ayah: hw?.ket_pekerjaan_ayah,
      ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
      ket_pekerjaan_ibu: hw?.ket_pekerjaan_ibu,
      ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
      penghasilan_lain: hw?.penghasilan_lain ?? dew?.penghasilan_lain,
      jumlah_orang_rumah: hw?.jumlah_orang_rumah,
      validasi_orang_rumah: hw?.validasi_orang_rumah,
      kepemilikan_rumah: hw?.kepemilikan_rumah,
      kepemilikan_kendaraan: hw?.kepemilikan_kendaraan,
      kepemilikan_elektronik: hw?.kepemilikan_elektronik,
      kelayakan_rumah: hw?.kelayakan_rumah,
      aset: hw?.aset,
      kondisi_rumah: hw?.kondisi_rumah,
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
      // pewawancara
      pewawancara: pewawancaraData?.nama || null,
      pewawancara_data: pewawancaraData || null,
      riwayat: riwayat ?? [],
    } as unknown as Kandidat;

    const insight = computeEvaluasiInsight({
      desilDtsen: row.desil_dtsen,
      jarakPusatKota: row.jarak_pusat_kota,
      penghasilanAyah: hw?.ket_penghasilan_ayah ?? row.penghasilan_ayah,
      penghasilanIbu: hw?.ket_penghasilan_ibu ?? row.penghasilan_ibu,
      penghasilanLain: hw?.penghasilan_lain ?? dew?.penghasilan_lain,
      jumlahTanggungan: row.jumlah_tanggungan,
      jmlTanggunganSebenarnya: dew?.jml_tanggungan_sebenarnya,
    });

    const polaSerupaCount = await countPolaSerupa(supabaseAdmin, {
      kandidatId: id,
      jalurMasuk: row.jalur_masuk,
      desilDtsen: row.desil_dtsen,
      kepemilikanRumah: hw?.kepemilikan_rumah,
    });

    return { kandidat, insight, polaSerupaCount };
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
  const result = await getKandidatDetail(id);

  if (!result) {
    notFound();
  }

  const { kandidat, insight, polaSerupaCount } = result;

  return (
    <EvaluasiDetailClient
      kandidat={kandidat}
      id={id}
      insight={insight}
      polaSerupaCount={polaSerupaCount}
    />
  );
}
