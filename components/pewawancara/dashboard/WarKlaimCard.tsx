"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  ArrowRight,
  ZapOff,
  Loader2,
  X,
} from "lucide-react";

interface WarKlaimCardProps {
  kuotaKe: number;
  mahasiswaList: number[];
  distribusiDone: boolean;
  onUnwar: () => Promise<void>;
}

export function WarKlaimCard({ kuotaKe, mahasiswaList, distribusiDone, onUnwar }: WarKlaimCardProps) {
  const [confirmUnwar, setConfirmUnwar] = useState(false);
  const [unwarring, setUnwarring] = useState(false);

  async function handleUnwar() {
    setUnwarring(true);
    try {
      await onUnwar();
      setConfirmUnwar(false);
    } finally {
      setUnwarring(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-primary px-6 py-4 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
          <CheckCircle2 size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">
            Kuota Berhasil Diklaim
          </p>
          <p className="text-white/70 text-xs mt-0.5">
            Kamu sudah terdaftar sebagai pewawancara
          </p>
        </div>
        <span className="ml-auto text-3xl font-extrabold text-white/90">
          #{kuotaKe}
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Jatah wawancara kamu ({mahasiswaList.length} mahasiswa)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mahasiswaList.map((n) => (
              <span
                key={n}
                className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20"
              >
                #{n}
              </span>
            ))}
          </div>
          {!distribusiDone && (
            <p className="text-[11px] text-muted-foreground mt-2.5 flex items-center gap-1.5">
              <Clock size={11} /> Menunggu admin melakukan distribusi mahasiswa…
            </p>
          )}
        </div>

        {distribusiDone ? (
          <Link
            href="/pewawancara/mahasiswa"
            className="flex items-center justify-between w-full px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ClipboardList size={15} /> Mulai Wawancara
            </span>
            <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="pt-2 border-t border-border">
            {!confirmUnwar ? (
              <button
                onClick={() => setConfirmUnwar(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-destructive border border-destructive/20 bg-destructive/5 rounded-xl hover:bg-destructive/10 transition-all"
              >
                <ZapOff size={13} /> UN-WAR — Batalkan Kuota
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground mr-1">
                  Yakin batalkan?
                </span>
                <button
                  onClick={handleUnwar}
                  disabled={unwarring}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-destructive rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-all"
                >
                  {unwarring ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  Ya, Batalkan
                </button>
                <button
                  onClick={() => setConfirmUnwar(false)}
                  disabled={unwarring}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-all"
                >
                  <X size={13} /> Batal
                </button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
