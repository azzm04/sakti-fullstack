"use client";

import { Users } from "lucide-react";
import type { HasilAkhirSummary } from "./HasilAkhirSummary";

interface Props {
  summary: HasilAkhirSummary | null;
  loading: boolean;
}

interface Row {
  label: string;
  lolos: number;
}

// Jalur kecil (UM, SBUB) digabung jadi satu baris "Lainnya" — jalur besar tetap
// tampil terpisah apa adanya (termasuk SNBT Non-Eligible) supaya tidak ada
// kategori yang datanya hilang begitu saja dari ringkasan.
function toRows(summary: HasilAkhirSummary): Row[] {
  const byKey = Object.fromEntries(summary.perJalur.map((j) => [j.key, j.lolos]));
  const lainnya = (byKey.UM ?? 0) + (byKey.SBUB ?? 0);
  return [
    { label: "SNBP Eligible", lolos: byKey.SNBP_ELIGIBLE ?? 0 },
    { label: "SNBP Non-Eligible", lolos: byKey.SNBP_NON_ELIGIBLE ?? 0 },
    { label: "SNBT Eligible", lolos: byKey.SNBT_ELIGIBLE ?? 0 },
    { label: "SNBT Non-Eligible", lolos: byKey.SNBT_NON_ELIGIBLE ?? 0 },
    { label: "Lainnya (UM, SBUB)", lolos: lainnya },
  ];
}

export default function PenerimaPerJalurCard({ summary, loading }: Props) {
  const rows = summary ? toRows(summary) : [];
  const max = Math.max(1, ...rows.map((r) => r.lolos));

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <Users size={15} className="text-admin-text-3" />
        <h3 className="font-admin-heading font-bold text-admin-text text-sm">
          Penerima per Jalur
        </h3>
      </div>
      <p className="text-xs text-admin-text-3 mb-5">
        Kandidat lolos yang akan diekspor
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 w-24 bg-admin-surface-soft rounded mb-2" />
              <div className="h-1.5 w-full bg-admin-surface-soft rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[13px] font-medium text-admin-text-2">{row.label}</span>
                <span className="text-[13px] font-bold text-admin-text tabular-nums">
                  {row.lolos.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-admin-grid overflow-hidden">
                <div
                  className="h-full rounded-full bg-admin-accent"
                  style={{ width: `${Math.max(2, (row.lolos / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
