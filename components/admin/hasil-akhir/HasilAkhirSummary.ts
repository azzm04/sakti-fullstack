import type { JalurKey } from "@/lib/jalur";

export interface JalurSummaryItem {
  key: JalurKey;
  label: string;
  /** "Diusulkan" (& Lolos Kuota utk UM/SBUB) — rekomendasi internal kita, BUKAN status resmi pasca SK. */
  lolos: number;
  total: number;
  /** Dari yang "lolos" di atas, berapa yang sudah ditetapkan resmi lewat Penetapan SK Massal. */
  ditetapkanSk: number;
  /** Dari yang "lolos" di atas, berapa yang BELUM diproses sama sekali di Penetapan SK (status_sk masih kosong). */
  belumDiprosesSk: number;
}

export interface HasilAkhirSummary {
  perJalur: JalurSummaryItem[];
  totalLolos: number;
  totalBelumLolos: number;
  totalDitetapkanSk: number;
  totalBelumDiprosesSk: number;
}

export const SUMMARY_ENDPOINT = "/api/admin/hasil-akhir/summary";

export const summaryFetcher = (url: string) =>
  fetch(url).then((res) => res.json()) as Promise<HasilAkhirSummary>;
