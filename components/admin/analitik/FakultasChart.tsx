"use client"

import { useState, useMemo, useId } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps
} from "recharts"
import { motion, AnimatePresence, type Variants } from "framer-motion"
import type { DistribusiFakultas } from "@/types/analitik"

interface FakultasChartProps {
  data: DistribusiFakultas[]
  totalDiusulkan: number
}

type ViewMode = "total" | "gender"

interface ViewOption {
  id: ViewMode
  label: string
}

interface ChartMouseMoveState {
  isTooltipActive?: boolean
  activeTooltipIndex?: number
}

const VIEW_OPTIONS: ReadonlyArray<ViewOption> = [
  { id: "total", label: "Total" },
  { id: "gender", label: "L / P" }
]

// Palet warna untuk grafik total
const TOTAL_COLORS = [
  '#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', 
  '#f59e0b', '#14b8a6', '#64748b', '#06b6d4', '#d946ef', 
  '#84cc16', '#6366f1', '#f43f5e', '#22c55e'
]

const GENDER_COLORS = {
  lakiLaki: "#60a5fa",
  perempuan: "#fb7185"
} as const

const springTransition = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...springTransition, staggerChildren: 0.04 }
  }
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={springTransition}
      className="rounded-xl border border-border/60 bg-tertiary/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
    >
      <p className="mb-1.5 text-[11px] font-semibold text-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function FakultasChart({ data, totalDiusulkan }: FakultasChartProps) {
  const [view, setView] = useState<ViewMode>("total")
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const layoutId = useId()

  const chartMargin = useMemo(
    () => ({ top: 12, right: 10, left: -20, bottom: 0 }),
    []
  )

  if (!data || data.length === 0) return null

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5 rounded-3xl border border-border bg-tertiary p-6 shadow-sm"
    >
      {/* Header & Toggle */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">
            Jumlah Penerima per Fakultas
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">
              {totalDiusulkan}
            </span>{" "}
            total penerima (diusulkan KIP Kuliah)
          </p>
        </div>

        {/* Segmented control */}
        <div className="relative flex shrink-0 gap-1 rounded-full bg-background p-1 border border-border">
          {VIEW_OPTIONS.map((option) => {
            const isActive = view === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setView(option.id)}
                className="relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-pressed={isActive}
              >
                {isActive && (
                  <motion.span
                    layoutId={`${layoutId}-pill`}
                    className="absolute inset-0 rounded-full bg-tertiary shadow-sm"
                    transition={springTransition}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-80 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {view === "total" ? (
            <BarChart
              data={data}
              margin={chartMargin}
              onMouseLeave={() => setActiveIndex(null)}
              // Menangkap event pergerakan mouse dari seluruh area chart
              onMouseMove={(state: ChartMouseMoveState) => {
                if (state?.isTooltipActive && state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex)
                } else {
                  setActiveIndex(null)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="fakultas"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              <Bar
                dataKey="total_penerima"
                name="Total Penerima"
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`total-${index}`}
                    fill={TOTAL_COLORS[index % TOTAL_COLORS.length]}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    style={{ transition: "opacity 200ms ease-out" }}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={chartMargin}
              onMouseLeave={() => setActiveIndex(null)}
              // Menangkap event pergerakan mouse dari seluruh area chart
              onMouseMove={(state: ChartMouseMoveState) => {
                if (state?.isTooltipActive && state?.activeTooltipIndex !== undefined) {
                  setActiveIndex(state.activeTooltipIndex)
                } else {
                  setActiveIndex(null)
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis
                dataKey="fakultas"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.05)" }}
              />
              
              <Bar
                dataKey="laki_laki"
                name="Laki-laki (L)"
                fill={GENDER_COLORS.lakiLaki}
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`laki-${index}`}
                    fill={GENDER_COLORS.lakiLaki}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    style={{ transition: "opacity 200ms ease-out" }}
                  />
                ))}
              </Bar>

              <Bar
                dataKey="perempuan"
                name="Perempuan (P)"
                fill={GENDER_COLORS.perempuan}
                radius={[4, 4, 0, 0]}
                animationDuration={500}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`perempuan-${index}`}
                    fill={GENDER_COLORS.perempuan}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    style={{ transition: "opacity 200ms ease-out" }}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend Custom */}
      <AnimatePresence>
        {view === "gender" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={springTransition}
            className="flex items-center justify-center gap-5 overflow-hidden pt-1"
          >
            <LegendDot color={GENDER_COLORS.lakiLaki} label="Laki-laki (L)" />
            <LegendDot color={GENDER_COLORS.perempuan} label="Perempuan (P)" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface LegendDotProps {
  color: string
  label: string
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={springTransition}
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </motion.div>
  )
}