"use client"

import { useState } from "react"
import { CheckCircle2, AlertTriangle, Wrench, ChevronRight } from "lucide-react"
import type { Konsistensi, ModelInfo } from "@/types/analitik"

interface Props {
  data: Konsistensi
  modelInfo?: ModelInfo
}

export default function KonsistensiCard({ data, modelInfo }: Props) {
  const [showTeknis, setShowTeknis] = useState(false)

  const jumlahUji = data.jumlah_total_uji
  const konsisten = jumlahUji - data.jumlah_kasus_ambigu
  const tidakKonsisten = data.jumlah_kasus_ambigu
  const pctKonsisten = jumlahUji > 0 ? (konsisten / jumlahUji) * 100 : 0

  const maxDepth = modelInfo?.best_params?.max_depth ?? modelInfo?.best_params?.["max_depth"]

  return (
    <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm p-6 h-full flex flex-col">
      <h3 className="font-admin-heading text-[15px] font-bold text-admin-text">Konsistensi Keputusan</h3>
      <p className="text-xs text-admin-text-3 mt-1 mb-4">
        Dari {jumlahUji} kasus yang diuji terhadap pola umum
      </p>

      <div className="flex h-2 w-full rounded-full overflow-hidden bg-admin-grid mb-5">
        <div className="bg-admin-accent" style={{ width: `${pctKonsisten}%` }} />
        <div className="bg-admin-warn-bar" style={{ width: `${100 - pctKonsisten}%` }} />
      </div>

      <div className="flex flex-col gap-3.5 flex-1">
        <div className="flex items-start gap-3">
          <CheckCircle2 size={18} className="text-admin-accent shrink-0 mt-0.5" />
          <div>
            <p className="text-[13.5px] font-bold text-admin-text">{konsisten} keputusan konsisten</p>
            <p className="text-[11.5px] text-admin-text-3 mt-0.5">
              Sesuai dengan pola umum dari {jumlahUji} kasus yang diuji
            </p>
          </div>
        </div>

        {tidakKonsisten > 0 && (
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-admin-warn-bar shrink-0 mt-0.5" />
            <div>
              <p className="text-[13.5px] font-bold text-admin-text">{tidakKonsisten} keputusan perlu ditinjau</p>
              <p className="text-[11.5px] text-admin-text-3 mt-0.5">
                Berbeda dari pola umum — mungkin ada pertimbangan di luar data
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowTeknis((v) => !v)}
        className="w-full flex items-center gap-3 mt-5 pt-4 border-t border-admin-border text-left group"
      >
        <Wrench size={16} className="text-admin-text-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-admin-text">Detail Teknis Model</p>
          <p className="text-[11px] text-admin-text-3 mt-0.5 truncate">
            Decision Tree · {(data.akurasi_model * 100).toFixed(1)}%
            {modelInfo?.jumlah_fitur ? ` · ${modelInfo.jumlah_fitur} fitur` : ""} · {jumlahUji} kasus
          </p>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold text-admin-accent shrink-0">
          Lihat detail
          <ChevronRight size={13} className={`transition-transform ${showTeknis ? "rotate-90" : ""}`} />
        </span>
      </button>

      {showTeknis && (
        <div className="mt-4 pt-4 border-t border-admin-border">
          <p className="text-[11px] font-bold text-admin-text-3 uppercase tracking-wider mb-3">
            Parameter Model
          </p>
          <div className="space-y-1.5 text-xs">
            {[
              {
                label: "Algoritma",
                value: `${modelInfo?.algoritma ?? "Decision Tree"}${maxDepth ? ` (kedalaman ${maxDepth})` : ""}`,
              },
              {
                label: "Data Latih",
                value: modelInfo?.jumlah_data_train ? `${modelInfo.jumlah_data_train} data` : "—",
              },
              {
                label: "Data Uji",
                value: modelInfo?.jumlah_data_test ? `${modelInfo.jumlah_data_test} data` : "—",
              },
              {
                label: "Akurasi Cross-Validation",
                value: modelInfo?.cv_accuracy
                  ? `${(modelInfo.cv_accuracy * 100).toFixed(2)}%`
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-admin-text-3">{label}</span>
                <span className="font-bold text-admin-text text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
