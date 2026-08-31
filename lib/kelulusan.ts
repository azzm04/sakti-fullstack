import { needsKuotaFiltering } from "@/lib/jalur";

/**
 * Satu-satunya tempat definisi "lolos" untuk fitur Hasil Akhir (summary,
 * export, kirim email). Sebelumnya `LOLOS_VALUES` didefinisikan ulang di
 * beberapa route — konsolidasi di sini supaya definisi "lolos" untuk jalur
 * yang butuh Filtering Kuota (UM/SBUB) konsisten dimana pun dipakai.
 */
export const LOLOS_VALUES = ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"];

/**
 * Kandidat dianggap lolos akhir jika:
 * - `hasil_akhir` dari wawancara termasuk salah satu LOLOS_VALUES, DAN
 * - untuk jalur yang butuh Filtering Kuota (UM/SBUB): `status_final` harus
 *   "Lolos Kuota" juga (kalah kuota walau direkomendasikan pewawancara =
 *   tidak lolos akhir).
 */
export function isLolosAkhir(
  jalurValue: string | null | undefined,
  hasilAkhir: string | null | undefined,
  statusFinal: string | null | undefined,
): boolean {
  if (!LOLOS_VALUES.includes(hasilAkhir ?? "")) return false;
  if (needsKuotaFiltering(jalurValue)) return statusFinal === "Lolos Kuota";
  return true;
}

/**
 * Status resmi pasca SK (hasil "Penetapan SK Massal") — sumber kebenaran
 * PALING FINAL, dipakai khusus di tahap Kirim Email (preview & pengiriman
 * sesungguhnya). Berbeda dari isLolosAkhir() yang menilai rekomendasi
 * internal kita ("Diusulkan"); ini menilai apakah sudah benar-benar
 * ditetapkan dalam SK resmi oleh pimpinan/DIKTI.
 */
export function isDitetapkanSk(statusSk: string | null | undefined): boolean {
  return statusSk === "Ditetapkan";
}
