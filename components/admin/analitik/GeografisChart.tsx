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
import type { DistribusiGeografis } from "@/types/analitik"

interface Props {
  data: DistribusiGeografis[]
}

export default function GeografisChart({ data }: Props) {
  // Urutkan dari pct_diusulkan tertinggi
  const sorted = [...data].sort((a, b) => b.pct_diusulkan - a.pct_diusulkan)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">
        Distribusi Geografis
      </h3>
      <p className="text-xs text-slate-400 mb-5">
        % diusulkan per provinsi
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="provinsi"
            type="category"
            width={130}
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) =>
              name === "pct_diusulkan"
                ? [`${value.toFixed(1)}%`, "% Diusulkan"]
                : [value, name]
            }
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          />
          <Bar dataKey="pct_diusulkan" radius={[0, 6, 6, 0]} barSize={18}>
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.pct_diusulkan >= 90 ? "#6366f1" : entry.pct_diusulkan >= 75 ? "#8b5cf6" : "#e2e8f0"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
