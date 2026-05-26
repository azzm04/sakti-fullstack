"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2, Hash, MousePointerClick } from "lucide-react";

interface WarActiveCardProps {
  kuota: number;
  kuotaTerisi: number;
  takenKuota: Set<number>;
  selectedKuota: number | null;
  onSelectKuota: (kuotaKe: number | null) => void;
  onKlaim: () => void;
  claiming: boolean;
  getMahasiswaForKuota: (kuotaKe: number) => number[];
}

/**
 * Card WAR aktif — grid kuota + tombol klaim.
 */
export function WarActiveCard({
  kuota,
  kuotaTerisi,
  takenKuota,
  selectedKuota,
  onSelectKuota,
  onKlaim,
  claiming,
  getMahasiswaForKuota,
}: WarActiveCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="h-2 w-2 rounded-full bg-primary inline-block"
          />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">
            WAR Sedang Berlangsung
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {kuota - kuotaTerisi} kuota tersisa
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <div>
          <p className="font-bold text-foreground mb-0.5">
            Pilih kuota yang kamu inginkan
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MousePointerClick size={13} />
            Klik kuota yang tersedia, lalu konfirmasi klaimmu
          </p>
        </div>

        {/* Grid Kuota */}
        <div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: kuota }, (_, i) => {
              const kuotaKe = i + 1;
              const isTaken = takenKuota.has(kuotaKe);
              const isSelected = selectedKuota === kuotaKe;

              return (
                <motion.button
                  key={kuotaKe}
                  whileHover={!isTaken ? { scale: 1.08 } : {}}
                  whileTap={!isTaken ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (isTaken) return;
                    onSelectKuota(isSelected ? null : kuotaKe);
                  }}
                  disabled={isTaken}
                  className={`
                    aspect-square rounded-xl flex items-center justify-center text-sm font-bold
                    transition-all duration-150 border-2 relative
                    ${
                      isTaken
                        ? "bg-muted border-transparent text-muted-foreground/40 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/30 ring-offset-1"
                          : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    }
                  `}
                >
                  {kuotaKe}
                  {isTaken && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-4 h-px bg-muted-foreground/30 rotate-45 block" />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-3 w-3 rounded bg-primary inline-block" /> Dipilih
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-3 w-3 rounded bg-muted border border-border inline-block" /> Terisi
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-3 w-3 rounded bg-card border-2 border-border inline-block" /> Tersedia
            </span>
          </div>
        </div>

        {/* Preview mahasiswa */}
        <AnimatePresence>
          {selectedKuota && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                  <Hash size={12} />
                  Kuota {selectedKuota} — Mahasiswa yang akan kamu tangani:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {getMahasiswaForKuota(selectedKuota).map((n) => (
                    <span
                      key={n}
                      className="text-xs font-semibold px-2 py-0.5 bg-primary/15 text-primary rounded-lg"
                    >
                      #{n}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tombol Klaim */}
        <motion.button
          whileTap={selectedKuota ? { scale: 0.98 } : {}}
          onClick={onKlaim}
          disabled={!selectedKuota || claiming}
          className={`
            w-full py-3.5 font-bold text-sm rounded-xl transition-all duration-200
            flex items-center justify-center gap-2
            ${
              selectedKuota && !claiming
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }
          `}
        >
          {claiming ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Mengklaim Kuota {selectedKuota}…
            </>
          ) : selectedKuota ? (
            <>
              <Zap size={16} /> Klaim Kuota #{selectedKuota}
            </>
          ) : (
            <>Pilih kuota di atas terlebih dahulu</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
