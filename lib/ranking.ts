/**
 * Perankingan kandidat untuk tahap Filtering Kuota (jalur UM/SBUB).
 *
 * Urutan prioritas (dari breakdown Dirmawa):
 *   1. Golongan UKT terendah (Golongan 1 = prioritas tertinggi)
 *   2. Kondisi Orang Tua: Yatim Piatu > Yatim > Piatu > lainnya
 *   3. Pendapatan per kapita keluarga terendah (tiebreaker terakhir)
 *
 * Kategori "Aman"/"Cerai Menafkahi"/"Cerai Tidak Menafkahi" diperlakukan
 * setara (di bawah Piatu) karena breakdown hanya memberi urutan eksplisit
 * untuk Yatim Piatu/Yatim/Piatu — dibedakan lewat pendapatan per kapita.
 */
export const KONDISI_ORANG_TUA_PRIORITY: Record<string, number> = {
  "Yatim Piatu": 0,
  Yatim: 1,
  Piatu: 2,
  "Cerai Tidak Menafkahi": 3,
  "Cerai Menafkahi": 3,
  Aman: 3,
};

const DEFAULT_KONDISI_PRIORITY = 3;

export interface KandidatUntukRanking {
  id: string;
  golongan_ukt: number | null;
  kondisi_orang_tua: string | null;
  /** Total penghasilan keluarga/bulan (riil hasil wawancara, fallback data import). */
  penghasilan_total: number;
  /** Jumlah tanggungan keluarga (riil hasil wawancara, fallback data import), minimal 1. */
  jumlah_tanggungan: number;
}

export function pendapatanPerKapita(k: Pick<KandidatUntukRanking, "penghasilan_total" | "jumlah_tanggungan">): number {
  const tanggungan = k.jumlah_tanggungan > 0 ? k.jumlah_tanggungan : 1;
  return k.penghasilan_total / tanggungan;
}

/** Urutkan kandidat sesuai prioritas kuota. Tidak mengubah array asal. */
export function rankKandidat<T extends KandidatUntukRanking>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const uktA = a.golongan_ukt ?? Infinity;
    const uktB = b.golongan_ukt ?? Infinity;
    if (uktA !== uktB) return uktA - uktB;

    const kotA = KONDISI_ORANG_TUA_PRIORITY[a.kondisi_orang_tua ?? ""] ?? DEFAULT_KONDISI_PRIORITY;
    const kotB = KONDISI_ORANG_TUA_PRIORITY[b.kondisi_orang_tua ?? ""] ?? DEFAULT_KONDISI_PRIORITY;
    if (kotA !== kotB) return kotA - kotB;

    return pendapatanPerKapita(a) - pendapatanPerKapita(b);
  });
}

export type StatusFinal = "Lolos Kuota" | "Tidak Lolos Kuota";

export interface RankedKandidat<T> {
  rank: number;
  statusFinal: StatusFinal;
  kandidat: T;
}

/** Rank + tandai lolos/tidak berdasar kuota. */
export function rankDenganKuota<T extends KandidatUntukRanking>(
  list: T[],
  kuota: number,
): RankedKandidat<T>[] {
  return rankKandidat(list).map((kandidat, index) => ({
    rank: index + 1,
    statusFinal: index < kuota ? "Lolos Kuota" : "Tidak Lolos Kuota",
    kandidat,
  }));
}
