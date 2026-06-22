"use client"

import { motion } from "motion/react"
import { Users, CheckCircle2, XCircle, Brain } from "lucide-react"
import type { Ringkasan, Konsistensi } from "@/types/analitik"

interface Props {
  ringkasan: Ringkasan
  konsistensi: Konsistensi
}

export default function KartuRingkasan({ ringkasan, konsistensi }: Props) {
  const kartu = [
    {
      label: "Total Pendaftar",
      value: ringkasan.total_pendaftar.toLocaleString("id-ID"),
      sub: ringkasan.tahun_seleksi ? `Seleksi ${ringkasan.tahun_seleksi}` : "Semua tahun",
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Diusulkan",
      value: `${ringkasan.total_diusulkan.toLocaleString("id-ID")}`,
      sub: `${ringkasan.pct_diusulkan}% dari total`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Tidak Diusulkan",
      value: `${ringkasan.total_tidak_diusulkan.toLocaleString("id-ID")}`,
      sub: `${ringkasan.pct_tidak_diusulkan}% dari total`,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Konsistensi Model",
      value: `${konsistensi.pct_dapat_dijelaskan}%`,
      sub: `Akurasi ${(konsistensi.akurasi_model * 100).toFixed(1)}%`,
      icon: Brain,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kartu.map(({ label, value, sub, icon: Icon, color, bg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={15} className={color} />
            </div>
          </div>
          <p className={`text-2xl font-extrabold leading-none ${color}`}>{value}</p>
          <p className="text-[11px] text-slate-400 mt-1.5">{sub}</p>
        </motion.div>
      ))}
    </div>
  )
}
