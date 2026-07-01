"use client"

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts"
import type { Konsistensi } from "@/types/analitik"

interface Props {
  data: Konsistensi
}

export default function KonsistensiCard({ data }: Props) {
  const akurasi = Math.round(data.akurasi_model * 100)
  // Gunakan warna primary (#001349) untuk gauge
  const gaugeData = [{ value: akurasi, fill: "#001349" }]

  const metrik = [
    { label: "Kekuatan Pola (Diusulkan)", value: (data.precision_diusulkan * 100).toFixed(1) + "%" },
    { label: "Recall (Diusulkan)",         value: (data.recall_diusulkan    * 100).toFixed(1) + "%" },
    { label: "F1-Score (Diusulkan)",        value: (data.f1_diusulkan        * 100).toFixed(1) + "%" },
    { label: "Tidak Konsisten dengan Pola", value: `${data.jumlah_kasus_ambigu} / ${data.jumlah_total_uji}` },
  ]

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
        Konsistensi Model
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
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
            <span className="text-3xl font-extrabold text-primary">{akurasi}%</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
              Akurasi
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {metrik.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      {/* Confusion Matrix */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Confusion Matrix
        </p>
        {data.confusion_matrix ? (
          <>
            {/* Label sumbu */}
            <div className="flex text-[10px] text-muted-foreground mb-1 pl-16">
              <span className="flex-1 text-center">Prediksi: Tidak</span>
              <span className="flex-1 text-center">Prediksi: Iya</span>
            </div>
            <div className="flex gap-2">
              {/* Label aktual vertikal */}
              <div className="flex flex-col justify-around text-[10px] text-muted-foreground w-14 text-right pr-2 shrink-0">
                <span>Aktual: Tidak</span>
                <span>Aktual: Iya</span>
              </div>
              {/* Grid 2x2 */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1">TN</p>
                  <p className="text-2xl font-extrabold text-foreground">{data.confusion_matrix[0][0]}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Benar Tolak</p>
                </div>
                <div className="bg-destructive/8 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-destructive/60 mb-1">FP</p>
                  <p className="text-2xl font-extrabold text-destructive">{data.confusion_matrix[0][1]}</p>
                  <p className="text-[10px] text-destructive/60 mt-1">Salah Lolos</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-amber-500 mb-1">FN</p>
                  <p className="text-2xl font-extrabold text-amber-600">{data.confusion_matrix[1][0]}</p>
                  <p className="text-[10px] text-amber-500 mt-1">Salah Tolak</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-[11px] font-semibold text-emerald-500 mb-1">TP</p>
                  <p className="text-2xl font-extrabold text-emerald-600">{data.confusion_matrix[1][1]}</p>
                  <p className="text-[10px] text-emerald-500 mt-1">Benar Lolos</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Data tidak tersedia</p>
        )}
      </div>
    </div>
  )
}
