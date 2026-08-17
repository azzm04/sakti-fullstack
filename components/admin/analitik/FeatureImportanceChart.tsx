"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Info } from "lucide-react"
import type { FeatureImportanceItem } from "@/types/analitik"

interface Props {
  data: FeatureImportanceItem[]
}

const INACTIVE_REASON =
  "Model Decision Tree tidak pernah menjadikan fitur ini sebagai titik pemisah (split) saat dilatih — nilainya kurang membedakan hasil dibanding fitur lain yang lebih dominan, atau informasinya sudah terwakili oleh fitur lain yang berkontribusi."

export default function FeatureImportanceChart({ data }: Props) {
  const [showAll, setShowAll] = useState(false)
  const safeData = Array.isArray(data) ? data : []

  const active = safeData.filter((f) => f.berkontribusi !== false && f.importance > 0)
  const inactive = safeData.filter((f) => f.berkontribusi === false || f.importance === 0)

  const displayed = showAll ? [...active, ...inactive] : active
  const maxPct = Math.max(1, ...active.map((f) => f.pct))

  return (
    <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm p-6 h-full flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-admin-heading text-[15px] font-bold text-admin-text">Faktor Dominan Keputusan</h3>
        {inactive.length > 0 && (
          <span className="text-[10.5px] font-medium text-admin-text-3 bg-admin-surface-soft border border-admin-border rounded-full px-2.5 py-1 shrink-0 whitespace-nowrap">
            {active.length} aktif · {inactive.length} tidak aktif
          </span>
        )}
      </div>
      <p className="text-xs text-admin-text-3 mb-5">Kontribusi tiap fitur terhadap hasil prediksi model</p>

      {displayed.length === 0 ? (
        <div className="flex items-center justify-center h-[160px] text-admin-text-3 text-sm">
          Data tidak tersedia
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {displayed.map((item, i) => {
            const isInactive = item.berkontribusi === false || item.importance === 0
            return (
              <div key={item.fitur} className={isInactive ? "group relative" : undefined}>
                <div className="flex items-baseline gap-2.5 mb-1.5">
                  {!isInactive && (
                    <span className="text-[12px] font-semibold text-admin-text-4 tabular-nums w-3.5 shrink-0">
                      {i + 1}
                    </span>
                  )}
                  <span
                    className={`text-[13px] font-medium flex-1 flex items-center gap-1.5 ${isInactive ? "text-admin-text-5 pl-6 cursor-help" : "text-admin-text"}`}
                  >
                    {item.fitur}
                    {isInactive && <Info size={12} className="text-admin-text-6 shrink-0" />}
                  </span>
                  <span className={`text-[13px] font-bold tabular-nums shrink-0 ${isInactive ? "text-admin-text-5" : "text-admin-text-2"}`}>
                    {item.pct.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </span>
                </div>
                <div className={`h-[7px] rounded-full bg-admin-grid overflow-hidden ${isInactive ? "" : "ml-6"}`}>
                  <div
                    className={`h-full rounded-full ${isInactive ? "bg-admin-text-6" : "bg-admin-accent"}`}
                    style={{ width: `${isInactive ? 0 : Math.max(2, (item.pct / maxPct) * 100)}%` }}
                  />
                </div>

                {isInactive && (
                  <div className="pointer-events-none absolute left-6 bottom-full mb-2 z-20 w-64 max-w-[80vw] rounded-lg bg-admin-text px-3.5 py-2.5 text-[11.5px] leading-relaxed text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                    {INACTIVE_REASON}
                    <div className="absolute left-4 top-full h-2 w-2 -mt-1 rotate-45 bg-admin-text" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {inactive.length > 0 && (
        <div className="mt-5 pt-4 border-t border-admin-border flex items-center justify-between gap-3 flex-wrap">
          <span className="flex items-center gap-2 text-[11px] text-admin-text-3">
            <span className="w-3 h-3 rounded-sm inline-block bg-admin-accent" />
            Berkontribusi ({active.length})
          </span>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-admin-accent hover:underline shrink-0"
          >
            {showAll ? (
              <>Sembunyikan fitur tidak aktif <ChevronUp size={13} /></>
            ) : (
              <>Lihat semua {safeData.length} fitur <ChevronDown size={13} /></>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
