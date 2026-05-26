"use client";

import { CheckCircle2, X } from "lucide-react";
import type { SesiListItem } from "@/schemas";

interface SesiSelectorProps {
  sesiList: SesiListItem[];
  selectedSesiId: number | null;
  onSelect: (id: number) => void;
}

export function SesiSelector({ sesiList, selectedSesiId, onSelect }: SesiSelectorProps) {
  if (sesiList.length <= 1) return null;

  return (
    <div className="mb-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
        Pilih Sesi Wawancara
      </p>
      <div className="flex gap-2 flex-wrap">
        {sesiList.map((s) => {
          const isSelected = selectedSesiId === s.id;
          const hasClaimed = !!s.kuota_saya;
          const isFull = s.kuota_terisi >= s.kuota_pewawancara;

          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all relative ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : hasClaimed
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400"
                    : "bg-tertiary text-secondary border-border hover:border-primary/50"
              }`}
            >
              <span className="block">
                {new Date(s.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <span className={`text-[10px] font-medium ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {s.kuota_terisi}/{s.kuota_pewawancara} kuota
              </span>

              {hasClaimed && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </span>
              )}
              {!hasClaimed && isFull && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                  <X size={10} className="text-white" />
                </span>
              )}
              {s.war_aktif && !hasClaimed && !isFull && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
