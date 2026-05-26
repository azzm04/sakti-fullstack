"use client";

import { motion } from "framer-motion";
import { Clock, Loader2, ClipboardList } from "lucide-react";

interface WarWaitingCardProps {
  tanggal: string;
  kuotaPewawancara: number;
  kuotaMahasiswa: number;
}

/**
 * Card yang ditampilkan saat sesi sudah ada tapi WAR belum dibuka admin.
 */
export function WarWaitingCard({ tanggal, kuotaPewawancara, kuotaMahasiswa }: WarWaitingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Menunggu WAR Dibuka
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 size={12} className="animate-spin" />
          <span>Memperbarui otomatis…</span>
        </div>
      </div>

      <div className="p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
          <Clock size={26} className="text-amber-500" />
        </div>
        <div>
          <p className="font-bold text-foreground text-base">
            Sesi wawancara sudah dijadwalkan
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Admin belum membuka Pemilihan Urutan Wawancara untuk sesi ini.
            Halaman akan otomatis memperbarui setiap 5 detik.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm font-semibold text-primary">
          <ClipboardList size={14} />
          {new Date(tanggal + "T00:00:00").toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Kuota: <span className="font-semibold text-foreground">{kuotaPewawancara} pewawancara</span>
          {" · "}
          <span className="font-semibold text-foreground">{kuotaMahasiswa} mahasiswa</span>
        </p>
      </div>
    </motion.div>
  );
}
