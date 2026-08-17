"use client"

import { motion } from "motion/react"
import { Users, CheckCircle2, XCircle, Brain } from "lucide-react"
import type { Ringkasan, Konsistensi } from "@/types/analitik"

interface Props {
  ringkasan: Ringkasan
  konsistensi: Konsistensi
  jalur: string
  tahun: string
}

function fmtId(n: number): string {
  return n.toLocaleString("id-ID")
}

function DonutRing({ pct, size = 52 }: { pct: number; size?: number }) {
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(100, Math.max(0, pct)) / 100)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="white"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[12.5px] font-bold text-white">
        {Math.round(pct)}%
      </div>
    </div>
  )
}

export default function AnalisisHeroBanner({ ringkasan, konsistensi, jalur, tahun }: Props) {
  const akurasi = Math.round(konsistensi.akurasi_model * 100)
  const konsisten = konsistensi.jumlah_total_uji - konsistensi.jumlah_kasus_ambigu
  const tidakKonsisten = konsistensi.jumlah_kasus_ambigu

  const metrics = [
    {
      icon: Users,
      label: "Total Pendaftar",
      value: fmtId(ringkasan.total_pendaftar),
      pct: 100,
      barColor: "bg-white",
      caption: ringkasan.tahun_seleksi ? `Seleksi ${ringkasan.tahun_seleksi}` : "Semua tahun",
    },
    {
      icon: CheckCircle2,
      label: "Diusulkan",
      value: fmtId(ringkasan.total_diusulkan),
      pct: ringkasan.pct_diusulkan,
      barColor: "bg-white",
      caption: `${ringkasan.pct_diusulkan}% dari total pendaftar`,
    },
    {
      icon: XCircle,
      label: "Tidak Diusulkan",
      value: fmtId(ringkasan.total_tidak_diusulkan),
      pct: ringkasan.pct_tidak_diusulkan,
      barColor: "bg-admin-warn-bar",
      caption: `${ringkasan.pct_tidak_diusulkan}% dari total pendaftar`,
    },
    {
      icon: Brain,
      label: "Konsistensi Model",
      value: `${(konsistensi.akurasi_model * 100).toFixed(1)}%`,
      pct: konsistensi.akurasi_model * 100,
      barColor: "bg-white",
      caption: "Akurasi Decision Tree",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: "easeOut", duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-admin-hero text-white p-6 sm:p-7 shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="max-w-xl">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Decision Tree · {jalur} · {tahun}
          </p>
          <h2 className="font-admin-heading text-[22px] sm:text-[26px] font-bold mt-2 tracking-[-0.01em]">
            Analisis Pola Keputusan Pewawancara
          </h2>
          <p className="text-[13px] text-white/55 mt-2.5 leading-relaxed">
            Model membaca {fmtId(ringkasan.total_pendaftar)} pendaftar untuk menemukan kriteria apa yang
            sebenarnya dipakai pewawancara saat memutuskan. Pilih tahun dan jalur masuk untuk memulai.
          </p>
        </div>

        <div className="flex flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide bg-white/10 border border-white/15 rounded-full px-3 py-1 text-white/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Analisis Aktif
          </span>
          <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-4 py-3">
            <DonutRing pct={akurasi} />
            <div>
              <p className="text-[13px] font-bold text-white leading-tight whitespace-nowrap">Konsistensi Model</p>
              <p className="text-[11px] text-white/50 mt-0.5 whitespace-nowrap">
                {konsisten} konsisten · {tidakKonsisten} ditinjau
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 mt-7 pt-6 border-t border-white/10">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/45">
              <m.icon size={12} strokeWidth={2.5} />
              {m.label}
            </div>
            <div className="font-admin-heading text-[24px] sm:text-[27px] font-bold mt-1.5 tabular-nums">
              {m.value}
            </div>
            <div className="h-[3px] rounded-full bg-white/15 overflow-hidden mt-2.5">
              <div
                className={`h-full rounded-full ${m.barColor}`}
                style={{ width: `${Math.min(100, m.pct)}%` }}
              />
            </div>
            <p className="text-[11px] text-white/40 mt-2">{m.caption}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
