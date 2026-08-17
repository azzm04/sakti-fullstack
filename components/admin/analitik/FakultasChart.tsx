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
  LabelList,
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

// Satu series (magnitude per fakultas) → satu hue konsisten, bukan rainbow per-bar.
const TOTAL_BAR_COLOR = "var(--color-primary)"

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
      className="rounded-xl border border-admin-border/60 bg-admin-surface/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
    >
      <p className="mb-1.5 text-[11px] font-semibold text-admin-text">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-admin-text-3">{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-admin-text">
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
      className="space-y-5 rounded-2xl border border-admin-border bg-admin-surface p-6 shadow-sm"
    >
      {/* Header & Toggle */}
      <div className="flex flex-col gap-4 border-b border-admin-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-admin-heading text-base font-bold text-admin-text">
            Jumlah Penerima per Fakultas
          </h3>
          <p className="mt-0.5 text-xs text-admin-text-3">
            <span className="font-semibold text-admin-text tabular-nums">
              {totalDiusulkan}
            </span>{" "}
            total penerima (diusulkan KIP Kuliah)
          </p>
        </div>

        {/* Segmented control */}
        <div className="relative flex shrink-0 gap-1 rounded-full bg-admin-bg p-1 border border-admin-border">
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
                    className="absolute inset-0 rounded-full bg-admin-surface shadow-sm"
                    transition={springTransition}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    isActive ? "text-admin-text" : "text-admin-text-3"
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
                    fill={TOTAL_BAR_COLOR}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.4}
                    style={{ transition: "opacity 200ms ease-out" }}
                  />
                ))}
                <LabelList
                  dataKey="total_penerima"
                  position="top"
                  offset={8}
                  style={{ fontSize: 11, fontWeight: 600, fill: "var(--color-admin-text-3)" }}
                />
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
      className="flex items-center gap-1.5 text-xs text-admin-text-3"
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </motion.div>
  )
}