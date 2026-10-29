"use client";

import { Calendar, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { JALUR_VALUE_OPTIONS as JALUR_OPTIONS } from "@/lib/jalur";
import type { JalurMasuk } from "@/app/admin/import/page";
import { cn } from "@/lib/utils";

interface Props {
  tahunSeleksi: string;
  onChangeTahun: (v: string) => void;
  currentYear: number;
  jalurMasuk: JalurMasuk | "";
  onChangeJalur: (v: JalurMasuk) => void;
  disabled?: boolean;
  showJalurWarning?: boolean;
}

/**
 * Pengaturan import — Tahun Seleksi + Pilih Jalur Masuk digabung jadi satu
 * card (sebelumnya 2 card terpisah). Keduanya memang isinya saling terkait
 * sebagai konfigurasi sebelum unggah, jadi 1 card horizontal lebih ringkas
 * dibanding 2 card sejajar yang nilainya kosong di bawahnya.
 */
export default function ImportSettingsCard({
  tahunSeleksi,
  onChangeTahun,
  currentYear,
  jalurMasuk,
  onChangeJalur,
  disabled,
  showJalurWarning,
}: Props) {
  const tahunValid =
    /^\d{4}$/.test(tahunSeleksi) &&
    parseInt(tahunSeleksi) >= 2020 &&
    parseInt(tahunSeleksi) <= 2099;
  const showTahunError = !tahunValid && tahunSeleksi !== "";

  return (
    <div className="bg-admin-surface rounded-[8px] border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] p-5">
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
        {/* Tahun Seleksi */}
        <div className="lg:w-56 shrink-0">
          <p className="text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-3">
            Tahun Seleksi
          </p>
          <div className="relative">
            <Calendar
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-3 pointer-events-none"
            />
            <input
              type="number"
              min={2020}
              max={2099}
              placeholder={String(currentYear)}
              value={tahunSeleksi}
              onChange={(e) => onChangeTahun(e.target.value)}
              disabled={disabled}
              className={cn(
                "w-full pl-9 pr-4 py-3 text-sm font-bold rounded-xl bg-admin-surface-soft text-admin-text",
                "border focus:outline-none focus:ring-2 focus:ring-admin-accent/40 focus:border-admin-accent transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none",
                showTahunError ? "border-admin-danger-text bg-admin-danger-bg/40" : "border-admin-border",
              )}
            />
          </div>
          {showTahunError && (
            <p className="mt-1.5 text-[11px] text-admin-danger-text font-medium">
              Masukkan tahun antara 2020–2099
            </p>
          )}
        </div>

        {/* Pembatas — hanya tampil saat berdampingan (lg ke atas) */}
        <div className="hidden lg:block w-px self-stretch bg-admin-border-soft" />

        {/* Pilih Jalur Masuk — pill yang bisa wrap, bukan daftar vertikal penuh */}
        <div className="flex-1 min-w-0">
          <p className="text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-3">
            Pilih Jalur Masuk
          </p>
          <div className="flex flex-wrap gap-2">
            {JALUR_OPTIONS.map((opt) => {
              const selected = jalurMasuk === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChangeJalur(opt.value)}
                  aria-pressed={selected}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12.5px] font-semibold transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    selected
                      ? "border-admin-accent bg-admin-accent/[0.08] text-admin-accent-active"
                      : "border-admin-border bg-admin-surface-soft text-admin-text-2 hover:border-admin-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "w-[13px] h-[13px] rounded-full shrink-0 bg-white block",
                      selected ? "border-[4px] border-admin-accent" : "border-[1.5px] border-admin-text-5",
                    )}
                  />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {showJalurWarning && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-xs text-admin-warn-text bg-admin-warn-bg-2 border border-admin-warn-border rounded-lg px-3 py-2"
            >
              <AlertTriangle size={13} className="shrink-0" />
              Wajib pilih jalur sebelum menyimpan
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
