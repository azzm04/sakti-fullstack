"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Upload,
  Calculator,
  ClipboardList,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Database,
} from "lucide-react";

interface Stats {
  total: number;
  valid: number;
  incomplete: number;
  saved: boolean;
}

const STEPS = [
  {
    step: 1,
    label: "Import Data",
    desc: "Unggah file Excel pendaftar KIPK",
    href: "/admin/import",
    icon: Upload,
  },
  {
    step: 2,
    label: "Kalkulasi TOPSIS",
    desc: "Hitung perankingan otomatis",
    href: "/admin/kalkulasi",
    icon: Calculator,
  },
  {
    step: 3,
    label: "Hasil Seleksi",
    desc: "Lihat & ekspor hasil ranking",
    href: "/admin/seleksi",
    icon: ClipboardList,
  },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/kandidat")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10 max-w-screen-lg mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Sistem Seleksi Beasiswa KIP-Kuliah
        </p>
        <h1 className="text-3xl font-extrabold font-headline text-primary leading-tight">
          Dashboard Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selamat datang. Kelola proses seleksi beasiswa KIPK dari sini.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10"
      >
        {[
          {
            label: "Total Pendaftar",
            value: stats?.total ?? "—",
            icon: Users,
            color: "text-primary",
            bg: "bg-primary/8",
          },
          {
            label: "Data Valid",
            value: stats?.valid ?? "—",
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Perlu Perbaikan",
            value: stats?.incomplete ?? "—",
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="bg-white rounded-2xl border border-border p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={15} className={color} />
              </div>
            </div>
            <p className={`text-2xl font-extrabold font-headline ${color} leading-none`}>
              {value}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Alur Kerja */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-4"
      >
        <h2 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">
          Alur Kerja Seleksi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map(({ step, label, desc, href, icon: Icon }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07 }}
            >
              <Link
                href={href}
                className="group flex flex-col gap-4 bg-white border border-border rounded-2xl p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Langkah {step}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka <ArrowRight size={13} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Status database */}
      {stats !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`mt-6 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
            stats.total > 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-slate-50 border-slate-200 text-slate-500"
          }`}
        >
          <Database size={15} />
          {stats.total > 0
            ? `${stats.total} data pendaftar tersimpan di database. Lanjutkan ke tahap Kalkulasi.`
            : "Belum ada data. Mulai dengan mengimpor file Excel pendaftar."}
          {stats.total > 0 && (
            <Link
              href="/admin/kalkulasi"
              className="ml-auto text-xs font-semibold underline underline-offset-2"
            >
              Kalkulasi →
            </Link>
          )}
        </motion.div>
      )}
    </div>
  );
}
