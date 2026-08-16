"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from "recharts"
import { motion, type Variants } from "framer-motion"
import type { DistribusiKelas } from "@/types/analitik"

interface Props {
  data: DistribusiKelas[]
  title: string
  subtitle?: string
}

// Warna diperbarui agar lebih padu dengan grafik pastel di atasnya
const COLORS = {
  diusulkan: "#3b82f6", // Biru medium yang lebih ramah di mata
  tidakDiusulkan: "#f43f5e", // Merah rose/coral yang lebih lembut dari merah standar
} as const

const springTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springTransition, staggerChildren: 0.04 },
  },
}

// Custom Tooltip yang seragam dengan chart lainnya
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springTransition}
      className="rounded-xl border border-admin-border/60 bg-white px-3.5 py-2.5 shadow-lg"
    >
      <p className="mb-1.5 text-[11px] font-semibold text-admin-text">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-admin-text-4">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-admin-text">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function DistribusiChart({ data, title, subtitle }: Props) {
  const safeData = Array.isArray(data) ? data : []
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="bg-white rounded-2xl border border-admin-border shadow-sm p-6"
    >
      <div className="mb-5">
        <h3 className="text-sm font-bold text-admin-text uppercase tracking-wider mb-1">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-admin-text-4">{subtitle}</p>
        )}
      </div>

      {safeData.length === 0 ? (
        <div className="flex items-center justify-center h-[220px] text-admin-text-5 text-sm">
          Data tidak tersedia
        </div>
      ) : (
        <>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={safeData}
                margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
                barCategoryGap="30%"
                barGap={4}
                onMouseLeave={() => setActiveIndex(null)}
                // Menangkap event hover untuk highlight yang sinkron
                onMouseMove={(state: { isTooltipActive?: boolean; activeTooltipIndex?: number }) => {
                  if (state?.isTooltipActive && state?.activeTooltipIndex !== undefined) {
                    setActiveIndex(state.activeTooltipIndex)
                  } else {
                    setActiveIndex(null)
                  }
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />

                {/* Bar Diusulkan */}
                <Bar
                  dataKey="diusulkan"
                  name="Diusulkan"
                  fill={COLORS.diusulkan}
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`diusulkan-${index}`}
                      fill={COLORS.diusulkan}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      style={{ transition: "opacity 200ms ease-out" }}
                    />
                  ))}
                </Bar>

                {/* Bar Tidak Diusulkan */}
                <Bar
                  dataKey="tidak_diusulkan"
                  name="Tidak Diusulkan"
                  fill={COLORS.tidakDiusulkan}
                  radius={[4, 4, 0, 0]}
                  animationDuration={500}
                  animationEasing="ease-out"
                >
                  {safeData.map((entry, index) => (
                    <Cell
                      key={`tidak-diusulkan-${index}`}
                      fill={COLORS.tidakDiusulkan}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                      style={{ transition: "opacity 200ms ease-out" }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="flex items-center justify-center gap-5 pt-3">
            <LegendDot color={COLORS.diusulkan} label="Diusulkan" />
            <LegendDot color={COLORS.tidakDiusulkan} label="Tidak Diusulkan" />
          </div>
        </>
      )}
    </motion.div>
  )
}

// Komponen helper untuk Legend
interface LegendDotProps {
  color: string
  label: string
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={springTransition}
      className="flex items-center gap-1.5 text-xs text-admin-text-4"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </motion.div>
  )
}