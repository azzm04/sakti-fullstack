"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type { FeatureImportanceItem } from "@/types/analitik"

interface Props {
  data: FeatureImportanceItem[]
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"]

export default function FeatureImportanceChart({ data }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
        Faktor Dominan Keputusan
      </h3>
      <p className="text-xs text-slate-400 mb-5">
        Kontribusi tiap fitur terhadap hasil prediksi model
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
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
            width={160}
            tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, "Kontribusi"]}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="pct" radius={[0, 6, 6, 0]} barSize={22}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
