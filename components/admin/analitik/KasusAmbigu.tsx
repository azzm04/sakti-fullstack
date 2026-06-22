"use client"

import { AlertTriangle, Download } from "lucide-react"
import type { KasusAmbigu } from "@/types/analitik"

interface Props {
  data: KasusAmbigu[]
}

function formatRupiah(value: number | null) {
  if (value === null) return "—"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)
}

function keyakinanColor(prob: number) {
  if (prob < 0.3) return "text-red-600 bg-red-50 border-red-100"
  if (prob < 0.6) return "text-amber-600 bg-amber-50 border-amber-100"
  return "text-emerald-600 bg-emerald-50 border-emerald-100"
}

export default function KasusAmbigu({ data }: Props) {
  function handleExport() {
    const header = ["#", "Aktual", "Prediksi Model", "Keyakinan", "Status P3KE", "Per Kapita", "Kondisi Rumah"]
    const rows = data.map((k) => [
      k.index,
      k.keputusan_aktual,
      k.prediksi_model,
      `${(k.probabilitas * 100).toFixed(1)}%`,
      k.status_p3ke,
      k.nominal_per_kapita ?? "",
      k.kondisi_rumah,
    ])
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "kasus_ambigu.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Kasus Ambigu
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.length} kasus di mana keputusan aktual berbeda dari prediksi model
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Aktual</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Prediksi</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Keyakinan</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status P3KE</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Per Kapita</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Kondisi Rumah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((k) => (
              <tr key={k.index} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-slate-400">{k.index}</td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      k.keputusan_aktual === "Diusulkan"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {k.keputusan_aktual}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      k.prediksi_model === "Diusulkan"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {k.prediksi_model}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md border ${keyakinanColor(k.probabilitas)}`}
                  >
                    {(k.probabilitas * 100).toFixed(1)}% ⚠
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-slate-600">{k.status_p3ke}</td>
                <td className="px-5 py-3 text-sm font-mono text-slate-600">
                  {formatRupiah(k.nominal_per_kapita)}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md ${
                      k.kondisi_rumah === "Tidak Layak"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {k.kondisi_rumah}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
