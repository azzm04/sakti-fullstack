import type { JalurKey } from "@/lib/jalur";

export interface JalurSummaryItem {
  key: JalurKey;
  label: string;
  lolos: number;
  total: number;
}

export interface HasilAkhirSummary {
  perJalur: JalurSummaryItem[];
  totalLolos: number;
  totalBelumLolos: number;
}

export const SUMMARY_ENDPOINT = "/api/admin/hasil-akhir/summary";

export const summaryFetcher = (url: string) =>
  fetch(url).then((res) => res.json()) as Promise<HasilAkhirSummary>;
