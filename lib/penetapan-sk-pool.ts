import { supabaseAdmin } from "@/lib/supabase";
import { resolveJalurAliases, type JalurKey } from "@/lib/jalur";
import { isLolosAkhir } from "@/lib/kelulusan";

export interface PoolKandidat {
  id: string;
  no_pendaftaran_kipk: string | null;
  nama_pendaftar: string | null;
  prodi_pendaftar: string | null;
  jalur_masuk: string | null;
  nim_resmi: string | null;
  status_sk: string | null;
}

interface RawRow {
  id: string;
  no_pendaftaran_kipk: string | null;
  nama_pendaftar: string | null;
  prodi_pendaftar: string | null;
  jalur_masuk: string | null;
  nim_resmi: string | null;
  status_sk: string | null;
  hasil_wawancara: { hasil_akhir: string | null; status_final: string | null }[] | { hasil_akhir: string | null; status_final: string | null } | null;
}

/**
 * Kandidat yang benar-benar "lolos akhir" (Diusulkan, dan untuk UM/SBUB juga
 * sudah Lolos Kuota) untuk satu tahun+jalur — inilah pool yang layak diproses
 * di tahap Penetapan SK. Dipakai bareng oleh GET (tabel bulk-editor) dan
 * endpoint cocokkan (matching Excel), supaya keduanya menilai kandidat yang sama.
 */
export async function getDiusulkanPool(tahun: number, jalurKeys: JalurKey[]): Promise<PoolKandidat[]> {
  const jalurValues = resolveJalurAliases(jalurKeys);

  const { data, error } = await supabaseAdmin
    .from("kandidat")
    .select(
      `
      id, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar, jalur_masuk, nim_resmi, status_sk,
      hasil_wawancara ( hasil_akhir, status_final ),
      impor_data!inner ( tahun_seleksi )
    `,
    )
    .in("jalur_masuk", jalurValues)
    .eq("impor_data.tahun_seleksi", tahun);

  if (error) throw error;

  return ((data ?? []) as unknown as RawRow[])
    .filter((row) => {
      const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
      return isLolosAkhir(row.jalur_masuk, hw?.hasil_akhir, hw?.status_final);
    })
    .map((row) => ({
      id: row.id,
      no_pendaftaran_kipk: row.no_pendaftaran_kipk,
      nama_pendaftar: row.nama_pendaftar,
      prodi_pendaftar: row.prodi_pendaftar,
      jalur_masuk: row.jalur_masuk,
      nim_resmi: row.nim_resmi,
      status_sk: row.status_sk,
    }));
}
