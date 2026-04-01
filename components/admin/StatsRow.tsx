"use client";

import { motion } from "motion/react";
import { Users, ListChecks, CheckCircle2, Sparkles } from "lucide-react";

const STATS = [
  { label: "Total Pendaftar",  value: "1.284", icon: Users,        sub: "mahasiswa terdaftar"   },
  { label: "Kriteria Seleksi", value: "5",     icon: ListChecks,   sub: "variabel SMART-TOPSIS" },
  { label: "Terverifikasi",    value: "1.284", icon: CheckCircle2, sub: "data valid & lengkap"  },
  { label: "Akurasi SMART",    value: "98.2%", icon: Sparkles,     sub: "tingkat konsistensi"   },
];

export default function StatsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {STATS.map(({ label, value, icon: Icon, sub }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: i * 0.06 }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="bg-white rounded-2xl border border-border p-4 md:p-5 shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
              <Icon size={15} className="text-primary" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold font-headline text-primary leading-none">{value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
