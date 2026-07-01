"use client"

import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { RuleNode } from "@/types/analitik"
import { useState } from "react"

interface Props {
  rules: RuleNode[]
}

function humanizeKondisi(kondisi: string): string {
  return kondisi
    .replace(/(\w[\w\s()]+?)\s*([≤>]+)\s*(\d+(?:\.\d+)?)/g, (_, feat, op, val) => {
      const numVal = parseFloat(val)
      const isRupiah =
        feat.toLowerCase().includes("penghasilan") ||
        feat.toLowerCase().includes("kapita")
      const formatted = isRupiah
        ? `Rp ${numVal.toLocaleString("id-ID")}`
        : numVal % 1 === 0
        ? numVal.toLocaleString("id-ID")
        : numVal.toFixed(1)
      return `${feat.trim()} ${op} ${formatted}`
    })
    .replace(/Status P3KE\s*([≤>]+)\s*([\d.]+)/g, (_, op, val) => {
      const v = parseFloat(val)
      if (op === "≤" && v < 1) return `Status P3KE = "Belum Terdata"`
      if (op === ">") return `Status P3KE ≠ "Belum Terdata" (Desil 3+)`
      return `Status P3KE ${op} ${val}`
    })
    .replace(/Jenis Kelamin\s*([≤>]+)\s*([\d.]+)/g, (_, op) => {
      if (op === "≤") return `Jenis Kelamin = "Perempuan"`
      return `Jenis Kelamin = "Laki-laki"`
    })
    .replace(/\s*&\s*/g, "\n  & ")
}

export default function RuleExtraction({ rules }: Props) {
  const [expanded, setExpanded] = useState(true)
  const safeRules = Array.isArray(rules) ? rules : []

  const diusulkan = safeRules.filter((r) => r.keputusan === "Diusulkan")
  const tidak = safeRules.filter((r) => r.keputusan !== "Diusulkan")

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-border hover:bg-muted/40 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Aturan Keputusan (Rule Extraction)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Pola logika yang dihasilkan Decision Tree — {safeRules.length} aturan
          </p>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-muted-foreground" />
          : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-6 space-y-6">
          {diusulkan.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Diusulkan ({diusulkan.length} aturan)
              </p>
              {diusulkan.map((rule, i) => (
                <RuleCard key={i} rule={rule} variant="diusulkan" />
              ))}
            </div>
          )}

          {tidak.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5">
                <XCircle size={12} /> Tidak Diusulkan ({tidak.length} aturan)
              </p>
              {tidak.map((rule, i) => (
                <RuleCard key={i} rule={rule} variant="tidak" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RuleCard({ rule, variant }: { rule: RuleNode; variant: "diusulkan" | "tidak" }) {
  const isDiusulkan = variant === "diusulkan"
  const pct = Math.round(rule.confidence * 100)

  // Warna confidence bar: hijau tinggi, amber sedang, merah rendah
  const barColor = pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-400" : "bg-red-400"
  const textColor = isDiusulkan ? "text-emerald-700" : "text-destructive"
  const borderColor = isDiusulkan ? "border-emerald-100" : "border-destructive/20"
  const bgColor = isDiusulkan ? "bg-emerald-50/60" : "bg-destructive/5"
  const Icon = isDiusulkan ? CheckCircle2 : XCircle
  const iconColor = isDiusulkan ? "text-emerald-500" : "text-destructive"

  const humanized = humanizeKondisi(rule.kondisi)
  const lines = humanized.split("\n")

  return (
    <div className={`flex items-start gap-3 ${bgColor} border ${borderColor} rounded-xl p-4`}>
      <Icon size={14} className={`${iconColor} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs text-foreground leading-relaxed break-words">
          <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">JIKA </span>
          {lines.map((line, i) => (
            <span key={i} className={i > 0 ? "block pl-4" : ""}>{line}</span>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">{rule.jumlah_sampel} sampel</span>
          <div className="flex items-center gap-1.5 flex-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <span className={`text-[11px] font-bold ${textColor}`}>Keyakinan {pct}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
