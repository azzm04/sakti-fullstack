"use client";

import { motion } from "motion/react";

export default function DashboardHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Sistem Seleksi Beasiswa KIP-Kuliah
        </p>
        <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-primary mt-0.5 leading-tight">
          Dirmawa Selection Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl">
          Perangkingan otomatis calon penerima beasiswa menggunakan metodologi SMART-TOPSIS.
        </p>
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold ring-1 ring-emerald-200 self-start sm:self-auto shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Sistem Aktif
      </motion.span>
    </motion.header>
  );
}
