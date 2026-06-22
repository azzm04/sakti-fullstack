"use client"

import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { RuleNode } from "@/types/analitik"
import { useState } from "react"

interface Props {
  rules: RuleNode[]
}

export default function RuleExtraction({ rules }: Props) {
  const [expanded, setExpanded] = useState(true)

  const diusulkan = rules.filter((r) => r.keputusan === "Diusulkan")
  const tidak = rules.filter((r) => r.keputusan !== "Diusulkan")

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Aturan Keputusan (Rule Extraction)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pola logika yang dihasilkan Decision Tree — {rules.length} aturan
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="p-6 space-y-3">
          {/* Aturan Diusulkan */}
          {diusulkan.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Diusulkan ({diusulkan.length} aturan)
              </p>
              {diusulkan.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-emerald-50/60 border border-emerald-100 rounded-xl p-4"
                >
                  <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-700 leading-relaxed break-words">
                      IF {rule.kondisi}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {rule.jumlah_sampel} sampel
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        Keyakinan {(rule.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aturan Tidak Diusulkan */}
          {tidak.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle size={12} /> Tidak Diusulkan ({tidak.length} aturan)
              </p>
              {tidak.map((rule, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 bg-red-50/60 border border-red-100 rounded-xl p-4"
                >
                  <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-slate-700 leading-relaxed break-words">
                      IF {rule.kondisi}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {rule.jumlah_sampel} sampel
                      </span>
                      <span className="text-[11px] font-semibold text-red-500">
                        Keyakinan {(rule.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
