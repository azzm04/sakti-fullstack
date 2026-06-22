"use client"

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"
import type { Konsistensi } from "@/types/analitik"

interface Props {
  data: Konsistensi
}

export default function KonsistensiCard({ data }: Props) {
  const akurasi = Math.round(data.akurasi_model * 100)
  const gaugeData = [{ value: akurasi, fill: "#6366f1" }]

  const metrik = [
    { label: "Precision (Diusulkan)", value: (data.precision_diusulkan * 100).toFixed(1) + "%" },
    { label: "Recall (Diusulkan)",    value: (data.recall_diusulkan    * 100).toFixed(1) + "%" },
    { label: "F1-Score (Diusulkan)",  value: (data.f1_diusulkan        * 100).toFixed(1) + "%" },
    { label: "Kasus Ambigu",         value: `${data.jumlah_kasus_ambigu} / ${data.jumlah_total_uji}` },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
        Konsistensi Model
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Tingkat akurasi & metrik evaluasi Decision Tree
      </p>

      <div className="flex flex-col items-center mb-4">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="100%"
              barSize={14}
              startAngle={90}
              endAngle={-270}
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
            <span className="text-3xl font-extrabold text-indigo-600">{akurasi}%</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
              Akurasi
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {metrik.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{label}</span>
            <span className="font-bold text-slate-700">{value}</span>
          </div>
        ))}
      </div>

      {/* Confusion Matrix */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Confusion Matrix
        </p>
        <div className="grid grid-cols-2 gap-1 text-center text-[11px]">
          <div className="bg-slate-50 rounded-lg p-2">
            <p className="text-slate-400">TN</p>
            <p className="font-bold text-slate-700">{data.confusion_matrix[0][0]}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2">
            <p className="text-red-300">FP</p>
            <p className="font-bold text-red-500">{data.confusion_matrix[0][1]}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-2">
            <p className="text-amber-300">FN</p>
            <p className="font-bold text-amber-500">{data.confusion_matrix[1][0]}</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-2">
            <p className="text-emerald-400">TP</p>
            <p className="font-bold text-emerald-600">{data.confusion_matrix[1][1]}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
