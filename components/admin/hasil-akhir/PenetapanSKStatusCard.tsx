"use client";

import { ShieldCheck } from "lucide-react";
import type { PenetapanSKCounts } from "./SectionPenetapanSK";

interface Props {
  counts: PenetapanSKCounts | null;
}

export default function PenetapanSKStatusCard({ counts }: Props) {
  const rows = counts
    ? [
        { label: "Ditetapkan", value: counts.ditetapkan, tone: "text-admin-accent-ink" },
        { label: "Tidak Ditetapkan", value: counts.tidakDitetapkan, tone: "text-admin-danger-text" },
        { label: "Belum Diproses", value: counts.belum, tone: "text-admin-text-4" },
      ]
    : [];

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm p-5">
      <div className="flex items-center gap-2.5 mb-1">
        <ShieldCheck size={15} className="text-admin-text-3" />
        <h3 className="font-admin-heading font-bold text-admin-text text-sm">Status Penetapan SK</h3>
      </div>
      <p className="text-xs text-admin-text-3 mb-5">
        Ringkasan untuk tahun & jalur yang sedang ditampilkan
      </p>

      {!counts ? (
        <p className="text-xs text-admin-text-4 italic">
          Pilih tahun &amp; jalur, lalu klik &quot;Tampilkan Data&quot; di panel kiri.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between pb-3 border-b border-admin-border-soft">
            <span className="text-[13px] font-medium text-admin-text-2">Total Kandidat Diusulkan</span>
            <span className="text-lg font-extrabold text-admin-text tabular-nums">
              {counts.total.toLocaleString("id-ID")}
            </span>
          </div>
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between">
              <span className="text-[13px] font-medium text-admin-text-2">{row.label}</span>
              <span className={`text-[13px] font-bold tabular-nums ${row.tone}`}>
                {row.value.toLocaleString("id-ID")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
