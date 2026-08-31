import { createClient } from "@supabase/supabase-js";
import { resolveJalurAliases, type JalurKey } from "@/lib/jalur";
import { LOLOS_VALUES } from "@/lib/kelulusan";
import type { KandidatUntukRanking } from "@/lib/ranking";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export interface KandidatRankingRow extends KandidatUntukRanking {
  nama_pendaftar: string | null;
  no_pendaftaran_kipk: string | null;
  prodi_pendaftar: string | null;
  hasil_wawancara_id: string;
  status_final_saat_ini: string | null;
  ranking_kuota_saat_ini: number | null;
}

interface RawHasilWawancara {
  id: string;
  kondisi_orang_tua: string | null;
  status_final: string | null;
  ranking_kuota: number | null;
  ket_penghasilan_ayah: number | null;
  ket_penghasilan_ibu: number | null;
  penghasilan_lain: number | null;
  detail_ekonomi_wawancara:
    | { jml_tanggungan_sebenarnya: number | null }
    | { jml_tanggungan_sebenarnya: number | null }[]
    | null;
}

interface RawKandidatRow {
  id: string;
  nama_pendaftar: string | null;
  no_pendaftaran_kipk: string | null;
  prodi_pendaftar: string | null;
  golongan_ukt: number | null;
  penghasilan_ayah: number | null;
  penghasilan_ibu: number | null;
  jumlah_tanggungan: number | null;
  hasil_wawancara: RawHasilWawancara | RawHasilWawancara[] | null;
}

// Ambil kandidat "Diusulkan" (is_draft=false) untuk satu tahun+jalur — dipakai
// bareng oleh GET /api/admin/filtering (preview) dan POST .../run (eksekusi)
// supaya urutan & data yang dinilai konsisten di kedua tempat.
export async function ambilKandidatUntukRanking(
  tahun: number,
  jalur: JalurKey,
): Promise<KandidatRankingRow[]> {
  const jalurValues = resolveJalurAliases([jalur]);

  const { data, error } = await supabase
    .from("kandidat")
    .select(
      `
      id, nama_pendaftar, no_pendaftaran_kipk, prodi_pendaftar,
      golongan_ukt, penghasilan_ayah, penghasilan_ibu, jumlah_tanggungan,
      impor_data!inner ( tahun_seleksi ),
      hasil_wawancara!inner (
        id, hasil_akhir, is_draft, kondisi_orang_tua, status_final, ranking_kuota,
        ket_penghasilan_ayah, ket_penghasilan_ibu, penghasilan_lain,
        detail_ekonomi_wawancara ( jml_tanggungan_sebenarnya )
      )
    `,
    )
    .in("jalur_masuk", jalurValues)
    .eq("impor_data.tahun_seleksi", tahun)
    .eq("hasil_wawancara.is_draft", false)
    .in("hasil_wawancara.hasil_akhir", LOLOS_VALUES);

  if (error) throw error;

  return ((data ?? []) as unknown as RawKandidatRow[]).map((row): KandidatRankingRow => {
    const hw = Array.isArray(row.hasil_wawancara)
      ? row.hasil_wawancara[0]
      : row.hasil_wawancara;
    const dew = Array.isArray(hw?.detail_ekonomi_wawancara)
      ? hw?.detail_ekonomi_wawancara[0]
      : hw?.detail_ekonomi_wawancara;

    const penghasilanTotal =
      Number(hw?.ket_penghasilan_ayah ?? row.penghasilan_ayah ?? 0) +
      Number(hw?.ket_penghasilan_ibu ?? row.penghasilan_ibu ?? 0) +
      Number(hw?.penghasilan_lain ?? 0);
    const jumlahTanggungan = Number(
      dew?.jml_tanggungan_sebenarnya ?? row.jumlah_tanggungan ?? 1,
    );

    return {
      id: row.id,
      nama_pendaftar: row.nama_pendaftar,
      no_pendaftaran_kipk: row.no_pendaftaran_kipk,
      prodi_pendaftar: row.prodi_pendaftar,
      golongan_ukt: row.golongan_ukt,
      kondisi_orang_tua: hw?.kondisi_orang_tua ?? null,
      penghasilan_total: penghasilanTotal,
      jumlah_tanggungan: jumlahTanggungan > 0 ? jumlahTanggungan : 1,
      // hasil_wawancara!inner di query di atas menjamin hw selalu ada.
      hasil_wawancara_id: hw!.id,
      status_final_saat_ini: hw?.status_final ?? null,
      ranking_kuota_saat_ini: hw?.ranking_kuota ?? null,
    };
  });
}
