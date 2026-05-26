"use client";

import { Clock } from "lucide-react";

interface SesiFilterProps {
  sesiList: { id: number; tanggal: string }[];
  selectedSesiId: number | null;
  onSelect: (id: number | null) => void;
  canEdit: boolean;
}

/**
 * Filter sesi wawancara (tampil jika > 1 sesi).
 */
export function SesiFilter({ sesiList, selectedSesiId, onSelect, canEdit }: SesiFilterProps) {
  if (sesiList.length <= 1) return null;

  const tanggalHariIni = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Pilih Sesi</p>
      <div className="flex gap-2 flex-wrap">
        {sesiList.map((s) => {
          const isSelected = selectedSesiId === s.id;
          const isFuture = s.tanggal > tanggalHariIni;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-tertiary text-secondary border-border hover:border-primary/50"
              }`}
            >
              {new Date(s.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
              {isFuture && <span className="ml-1 text-[9px] opacity-70">(preview)</span>}
            </button>
          );
        })}
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
            !selectedSesiId
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-tertiary text-secondary border-border hover:border-primary/50"
          }`}
        >
          Hari Ini
        </button>
      </div>
      {!canEdit && (
        <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
          <Clock size={11} /> Sesi ini belum bisa diisi — wawancara belum dimulai
        </p>
      )}
    </div>
  );
}
