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
      iconColor: "text-admin-text-5",
    },
    {
      label: "Diusulkan",
      value: ringkasan.total_diusulkan.toLocaleString("id-ID"),
      sub: `${ringkasan.pct_diusulkan}% dari total pendaftar`,
      icon: CheckCircle2,
      iconColor: "text-admin-accent",
    },
    {
      label: "Tidak Diusulkan",
      value: ringkasan.total_tidak_diusulkan.toLocaleString("id-ID"),
      sub: `${ringkasan.pct_tidak_diusulkan}% dari total pendaftar`,
      icon: XCircle,
      iconColor: "text-admin-danger-bar",
    },
    {
      label: "Konsistensi Model",
      value: `${konsistensi.pct_dapat_dijelaskan}%`,
      sub: `Akurasi ${(konsistensi.akurasi_model * 100).toFixed(1)}%`,
      icon: Brain,
      iconColor: "text-admin-text-5",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: "easeOut", duration: 0.4 }}
      className="grid grid-cols-1 sm:grid-cols-4 divide-y divide-admin-border-soft sm:divide-y-0 sm:divide-x rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden"
    >
      {kartu.map(({ label, value, sub, icon: Icon, iconColor }) => (
        <div key={label} className="p-6 flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Icon size={14} className={iconColor} strokeWidth={2.5} />
            <p className="text-xs font-semibold uppercase tracking-wide text-admin-text-4">
              {label}
            </p>
          </div>
          <h4 className="font-admin-heading text-3xl font-extrabold text-admin-text tracking-tight tabular-nums">
            {value}
          </h4>
          <p className="text-[12px] text-admin-text-4 font-medium">{sub}</p>
        </div>
      ))}
    </motion.div>
  )
}