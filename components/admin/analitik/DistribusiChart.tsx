"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { DistribusiKelas } from "@/types/analitik"

interface Props {
  data: DistribusiKelas[]
  title: string
  subtitle?: string
}

export default function DistribusiChart({ data, title, subtitle }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs text-slate-400 mb-5">{subtitle}</p>
      )}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            formatter={(value) =>
              value === "diusulkan" ? "Diusulkan" : "Tidak Diusulkan"
            }
          />
          <Bar dataKey="diusulkan" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="tidak_diusulkan" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
