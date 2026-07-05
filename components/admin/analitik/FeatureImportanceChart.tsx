"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts"
import type { FeatureImportanceItem } from "@/types/analitik"

interface Props {
  data: FeatureImportanceItem[]
}

const ACTIVE_COLORS = ["#001349", "#002080", "#003399", "#1a4db3", "#3366cc", "#6690e0"]

// Custom tooltip — beda pesan untuk aktif vs tidak aktif
function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ payload: FeatureImportanceItem }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const isInactive = item.berkontribusi === false || item.importance === 0

  return (
    <div className="bg-white border border-border rounded-xl shadow-lg px-4 py-3 max-w-[260px]">
      <p className="text-xs font-bold text-foreground mb-1">{item.fitur}</p>
      {isInactive ? (
        <>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            Tidak membedakan pola
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Fitur ini tidak digunakan karena nilainya seragam di seluruh data.
            Contoh: jika semua kandidat memiliki kondisi rumah yang sama, fitur ini
            tidak membantu model membedakan keputusan.
          </p>
        </>
      ) : (
        <>
          <p className="text-[11px] font-semibold text-primary mb-1">
            Kontribusi: {item.pct}%
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Fitur ini digunakan model sebagai salah satu penentu keputusan pewawancara.
            Semakin besar nilainya, semakin sering dipakai sebagai dasar penilaian.
          </p>
        </>
      )}
    </div>
  )
}

export default function FeatureImportanceChart({ data }: Props) {
  const safeData = Array.isArray(data) ? data : []

  const active   = safeData.filter((f) => f.berkontribusi !== false && f.importance > 0)
  const inactive = safeData.filter((f) => f.berkontribusi === false || f.importance === 0)

  // Aktif di atas, tidak aktif di bawah
  const displayed = [...active, ...inactive]

  if (displayed.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
          Faktor Dominan Keputusan
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Kontribusi tiap fitur terhadap hasil prediksi model
        </p>
        <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
          Data tidak tersedia
        </div>
      </div>
    )
  }

  // PENYESUAIAN: Menambah spasi per item agar label interval={0} tidak bertumpuk
  const chartHeight = active.length * 40 + inactive.length * 28 + 40

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Faktor Dominan Keputusan
        </h3>
        {inactive.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0 ml-2">
            {active.length} aktif · {inactive.length} tidak aktif
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Kontribusi tiap fitur terhadap hasil prediksi model
      </p>

      <ResponsiveContainer width="100%" height={Math.max(300, chartHeight)}>
        <BarChart
          layout="vertical"
          data={displayed}
          margin={{ top: 10, right: 50, left: 0, bottom: 0 }} // Right margin ditambah agar teks % tidak terpotong
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="fitur"
            type="category"
            width={180}
            interval={0} // KUNCI PERBAIKAN: Memaksa semua label Y dirender tanpa di-skip
            tick={({ x, y, payload, index }: {
              x: number; y: number
              payload: { value: string }
              index: number
            }) => {
              const item = displayed[index]
              const isInactive = item?.berkontribusi === false || item?.importance === 0
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-8} 
                    y={0} 
                    dy={4}
                    textAnchor="end"
                    fill={isInactive ? "#cbd5e1" : "#475569"}
                    fontSize={isInactive ? 11 : 12}
                    fontWeight={isInactive ? 400 : 500}
                  >
                    {payload.value}
                  </text>
                </g>
              )
            }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16} minPointSize={2}>
            {displayed.map((entry, i) => {
              const isInactive = entry.berkontribusi === false || entry.importance === 0
              return (
                <Cell
                  key={i}
                  fill={isInactive ? "#f1f5f9" : ACTIVE_COLORS[active.indexOf(entry) % ACTIVE_COLORS.length]}
                  opacity={isInactive ? 0.5 : 1}
                />
              )
            })}
            <LabelList
              content={({ x, y, width, height, index }) => {
                const item = displayed[index as number]
                if (!item) return null
                const isInactive = item.berkontribusi === false || item.importance === 0
                if (isInactive) return null 
                
                const xPos = (x as number) + (width as number) + 8
                const yPos = (y as number) + (height as number) / 2 + 4
                return (
                  <text x={xPos} y={yPos} fill="#64748b" fontSize={11} fontWeight={600}>
                    {item.pct}%
                  </text>
                )
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {inactive.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex items-center gap-5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#001349" }} />
            Berkontribusi ({active.length})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" />
            Nilai seragam — tidak aktif ({inactive.length})
          </span>
        </div>
      )}
    </div>
  )
}