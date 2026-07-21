"use client"

import { AlertTriangle, Download, Info } from "lucide-react"
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

function kekuatanInfo(prob: number) {
  if (prob >= 0.9) return { color: "text-red-700 bg-red-50 border-red-200", label: "Sangat perlu ditinjau" }
  if (prob >= 0.7) return { color: "text-amber-700 bg-amber-50 border-amber-200", label: "Perlu ditinjau" }
  return { color: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Cukup wajar" }
}

export default function KasusAmbigu({ data }: Props) {
  const safeData = Array.isArray(data) ? data : []
  const sortedData = [...safeData].sort((a, b) => b.probabilitas - a.probabilitas)

  function handleExport() {
    const header = ["#", "Keputusan Aktual", "Pola Umum", "Kekuatan Pola", "Status P3KE", "Per Kapita", "Kondisi Rumah"]
    const rows = sortedData.map((k) => [
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
    a.download = "keputusan_perlu_ditinjau.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="flex items-start sm:items-center justify-between px-6 py-5 border-b border-slate-100 gap-4 flex-col sm:flex-row">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Kasus yang Layak Ditinjau Ulang
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 flex items-start gap-1.5 max-w-2xl leading-relaxed">
            <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
            Pendaftar yang keputusan wawancaranya berbeda dari pola pendaftar serupa lainnya. Diurutkan dari yang paling mencurigakan.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider w-16">#</th>
              <th className="px-6 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Tingkat Kejanggalan</th>
              <th className="px-6 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Keputusan Aktual</th>
              <th className="px-6 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Status DTKS</th>
              <th className="px-6 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Per Kapita</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Info size={24} className="text-slate-300" />
                    <p className="text-sm text-slate-500">Tidak ada kasus yang perlu ditinjau ulang</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((k) => {
                const { color, label } = kekuatanInfo(k.probabilitas)
                return (
                  <tr key={k.index} className="hover:bg-slate-50/80 transition-colors align-middle group">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 group-hover:text-slate-500">
                      {k.index}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${color}`}>
                          {(k.probabilitas * 100).toFixed(0)}% {label}
                        </span>
                        {/* <p className="text-[11px] text-slate-500">{label}</p> */}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-md ${
                          k.keputusan_aktual === "Diusulkan"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-red-50 text-red-700 border border-red-100"
                        }`}
                      >
                        {k.keputusan_aktual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {k.status_p3ke}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">
                      {formatRupiah(k.nominal_per_kapita)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}