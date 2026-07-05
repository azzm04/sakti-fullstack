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
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Diusulkan",
      value: ringkasan.total_diusulkan.toLocaleString("id-ID"),
      sub: `${ringkasan.pct_diusulkan}% dari total pendaftar`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Tidak Diusulkan",
      value: ringkasan.total_tidak_diusulkan.toLocaleString("id-ID"),
      sub: `${ringkasan.pct_tidak_diusulkan}% dari total pendaftar`,
      icon: XCircle,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
    },
    {
      label: "Konsistensi Model",
      value: `${konsistensi.pct_dapat_dijelaskan}%`,
      sub: `Akurasi ${(konsistensi.akurasi_model * 100).toFixed(1)}%`,
      icon: Brain,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kartu.map(({ label, value, sub, icon: Icon, iconColor, iconBg }, i) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, ease: "easeOut", duration: 0.4 }}
          className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 p-6 flex flex-col justify-between"
        >
          {/* Bagian Atas: Label & Ikon */}
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
              {label}
            </p>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon size={20} className={iconColor} strokeWidth={2.5} />
            </div>
          </div>
          
          {/* Bagian Bawah: Angka & Sub-teks */}
          <div>
            <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {value}
            </h4>
            <p className="text-[12px] text-slate-500 mt-1.5 font-medium">
              {sub}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}