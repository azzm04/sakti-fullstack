"use client"

import { useState } from "react"
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from "lucide-react"
import type { Konsistensi, ModelInfo } from "@/types/analitik"

interface Props {
  data: Konsistensi
  modelInfo?: ModelInfo
}

export default function KonsistensiCard({ data, modelInfo }: Props) {
  const [showTeknis, setShowTeknis] = useState(false)

  const akurasi        = Math.round(data.akurasi_model * 100)
  const jumlahUji      = data.jumlah_total_uji
  const konsisten      = jumlahUji - data.jumlah_kasus_ambigu
  const tidakKonsisten = data.jumlah_kasus_ambigu
  const gaugeData      = [{ value: akurasi, fill: "#001349" }]

  // Ambil max_depth dari best_params jika tersedia
  const maxDepth = modelInfo?.best_params?.max_depth ?? modelInfo?.best_params?.["max_depth"]

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
        Konsistensi Model
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        Seberapa konsisten pola keputusan pewawancara
      </p>

      {/* Gauge */}
      <div className="flex flex-col items-center mb-5">
        <div className="relative w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius="70%" outerRadius="100%"
              barSize={14} startAngle={90} endAngle={-270}
              data={gaugeData}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: "#f1f5f9" }}
                dataKey="value"
                angleAxisId={0}
                cornerRadius={8}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold text-primary">{akurasi}%</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
              Konsisten
            </span>
          </div>
        </div>
      </div>

      {/* Ringkasan plain-language */}
      <div className="space-y-2.5 mb-5">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-800">
              {konsisten} keputusan konsisten
            </p>
            <p className="text-xs text-emerald-600">
              Sesuai dengan pola umum dari {jumlahUji} kasus yang diuji
            </p>
          </div>
        </div>

        {tidakKonsisten > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                {tidakKonsisten} keputusan perlu ditinjau
              </p>
              <p className="text-xs text-amber-600">
                Berbeda dari pola umum — mungkin ada pertimbangan di luar data
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle detail teknis */}
      <button
        onClick={() => setShowTeknis((v) => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl px-4 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <span>Lihat Detail Teknis</span>
        {showTeknis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Detail teknis — parameter model saja, tanpa metrik ML */}
      {showTeknis && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
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
                  : `${(data.cv_accuracy * 100).toFixed(2)}%`,
              },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold text-foreground text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
