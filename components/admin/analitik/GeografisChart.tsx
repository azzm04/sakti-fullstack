"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts"
import type { DistribusiGeografis } from "@/types/analitik"

interface Props {
  data: DistribusiGeografis[]
}

export default function GeografisChart({ data }: Props) {
  const safeData = Array.isArray(data) ? data : []
  const sorted = [...safeData].sort((a, b) => b.pct_diusulkan - a.pct_diusulkan)

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
          Distribusi Geografis
        </h3>
        <p className="text-xs text-muted-foreground mb-5">% diusulkan per provinsi</p>
        <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          Data geografis tidak tersedia
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">
        Distribusi Geografis
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        % diusulkan per provinsi
      </p>
      <ResponsiveContainer width="100%" height={Math.max(280, sorted.length * 36)}>
        <BarChart
          layout="vertical"
          data={sorted}
          margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
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
            width={160}
            tick={{ fontSize: 12, fill: "#475569" }}
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
          <Bar dataKey="pct_diusulkan" radius={[0, 6, 6, 0]} barSize={20}>
            {sorted.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.pct_diusulkan >= 90
                    ? "#001349"
                    : entry.pct_diusulkan >= 75
                    ? "#003399"
                    : "#6690e0"
                }
              />
            ))}
            <LabelList
              dataKey="pct_diusulkan"
              position="right"
              formatter={(v: number) => `${v.toFixed(0)}%`}
              style={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
