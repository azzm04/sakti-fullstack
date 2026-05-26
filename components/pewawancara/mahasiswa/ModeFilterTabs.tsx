"use client";

import { User, CalendarDays, Users, Lock } from "lucide-react";

export type Mode = "saya" | "hari_ini" | "semua";

export const MODE_CONFIG: { key: Mode; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "saya",     label: "Jatah Saya",  icon: User,         desc: "Mahasiswa yang harus kamu wawancarai hari ini" },
  { key: "hari_ini", label: "Hari Ini",    icon: CalendarDays, desc: "Semua mahasiswa yang dijadwalkan wawancara hari ini" },
  { key: "semua",    label: "Semua",       icon: Users,        desc: "Seluruh pendaftar KIP-K" },
];

interface ModeFilterTabsProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  jatahSudahSelesai: boolean;
  total: number;
}

/**
 * Tab filter mode: Jatah Saya / Hari Ini / Semua.
 */
export function ModeFilterTabs({ mode, onModeChange, jatahSudahSelesai, total }: ModeFilterTabsProps) {
  return (
    <>
      <div className="flex gap-1 p-1 bg-tertiary border border-border rounded-xl w-fit mb-5 shadow-sm">
        {MODE_CONFIG.map(({ key, label, icon: Icon }) => {
          const isLocked = key === "hari_ini" && !jatahSudahSelesai;
          return (
            <button
              key={key}
              onClick={() => !isLocked && onModeChange(key)}
              title={isLocked ? "Selesaikan jatahmu terlebih dahulu" : label}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isLocked
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {isLocked ? <Lock size={12} /> : <Icon size={13} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Deskripsi mode aktif */}
      <p className="text-xs text-muted-foreground mb-4">
        {MODE_CONFIG.find((m) => m.key === mode)?.desc}
        {mode !== "saya" && (
          <span className="ml-1 text-muted-foreground/60">· {total} mahasiswa</span>
        )}
      </p>
    </>
  );
}
