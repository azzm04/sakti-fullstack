"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { motion, useReducedMotion } from "motion/react";

interface ChartPoint { label: string; value: number }
interface Props { title: string; description: string; data: ChartPoint[]; unit: string }
interface ShapeProps { x?: number; y?: number; width?: number; height?: number; index?: number }

function AnimatedBar({ x = 0, y = 0, width = 0, height = 0, expanded }: ShapeProps & { expanded: boolean }) {
  const reduceMotion = useReducedMotion();
  const barWidth = expanded ? Math.min(width, 32) : Math.min(width, 8);
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill="transparent" />
      <motion.rect initial={false} animate={{ x: x + (width - barWidth) / 2, width: barWidth }}
        y={y} height={height} rx={2} fill="#000352"
        transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 220, damping: 28 }} />
    </g>
  );
}

export default function MonospaceBarChart({ title, description, data, unit }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const point = active === null ? null : data[active];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="min-w-0 rounded-lg border border-[#E2E8F0] bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-dashed border-[#CBD5E1] pb-5">
        <div><h2 className="text-base font-semibold text-[#0B1536]">{title}</h2><p className="mt-1 text-sm text-[#64748B]">{description}</p></div>
        <div className="min-w-28 text-right"><p className="text-xs text-[#64748B]">{point?.label ?? "Total pada grafik"}</p><p className="mt-1 font-mono text-2xl tabular-nums text-[#000352]">{(point?.value ?? total).toLocaleString("id-ID")} <span className="font-sans text-xs text-[#64748B]">{unit}</span></p></div>
      </div>
      {data.length === 0 ? <p className="py-20 text-center text-sm text-[#64748B]">Belum ada data untuk ditampilkan.</p> : <>
        <div className="mt-5 overflow-x-auto">
          <div className="h-64" style={{ minWidth: Math.max(280, data.length * 85) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} accessibilityLayer margin={{ top: 10, right: 12, bottom: 5, left: -15 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" strokeDasharray="3 4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} tick={{ fontSize: 11, fill: "#64748B" }} tickFormatter={(label: string) => label.length > 14 ? `${label.slice(0, 13)}...` : label} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                <Bar dataKey="value" isAnimationActive={false} onMouseEnter={(_, index) => setActive(index)} onMouseLeave={() => setActive(null)} onClick={(_, index) => setActive(index)}
                  shape={(props: unknown) => { const shape = props as ShapeProps; return <AnimatedBar {...shape} expanded={shape.index === active} />; }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <details className="mt-4 border-t border-dashed border-[#E2E8F0] pt-3 text-xs text-[#64748B]">
          <summary className="w-fit cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-[#000352]">Lihat angka per {unit === "laporan" ? "periode" : "tahun"}</summary>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{data.map((item, index) => <li key={item.label}><button type="button" onFocus={() => setActive(index)} onBlur={() => setActive(null)} onClick={() => setActive(index)} className="flex w-full justify-between gap-4 rounded p-2 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#000352]"><span>{item.label}</span><span className="font-mono text-[#000352]">{item.value.toLocaleString("id-ID")}</span></button></li>)}</ul>
        </details>
      </>}
    </section>
  );
}
