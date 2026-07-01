"use client"

import { useState } from "react"
import { Cpu, ChevronDown, ChevronUp } from "lucide-react"
import type { ModelInfo } from "@/types/analitik"

interface Props {
  data: ModelInfo
}

export default function ModelInfoCard({ data }: Props) {
  // Collapsed by default — info teknis, bukan untuk pengguna umum
  const [expanded, setExpanded] = useState(false)

  const params = Object.entries(data.best_params).map(([k, v]) => ({
    key: k.replace(/_/g, " "),
    value: String(v),
  }))

  const stats = [
    { label: "Data Train",    value: String(data.jumlah_data_train) },
    { label: "Data Test",     value: String(data.jumlah_data_test) },
    { label: "Akurasi Train", value: `${(data.train_accuracy * 100).toFixed(1)}%` },
    { label: "Akurasi CV",    value: `${(data.cv_accuracy * 100).toFixed(2)}%` },
    { label: "Akurasi Test",  value: `${(data.test_accuracy * 100).toFixed(1)}%`, highlight: true },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header — klik untuk expand */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
            <Cpu size={15} className="text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Detail Teknis Model</p>
            <p className="text-[11px] text-muted-foreground">
              {data.algoritma} · Akurasi {(data.test_accuracy * 100).toFixed(1)}%
              {!expanded && (
                <span className="ml-2 text-primary/60">— klik untuk detail</span>
              )}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
          : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
      </button>

      {/* Content — hanya muncul saat expanded */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-border">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-xs">
            {/* Statistik dataset & akurasi */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Dataset & Akurasi
              </p>
              {stats.map(({ label, value, highlight }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-semibold ${highlight ? "text-primary" : "text-foreground"}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Best params */}
            {params.length > 0 && (
              <div className="space-y-1.5 mt-4 sm:mt-0">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Parameter Terbaik
                </p>
                {params.map(({ key, value }) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <span className="font-mono font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
