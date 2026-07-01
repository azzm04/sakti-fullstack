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

function kekuatanColor(prob: number) {
  if (prob >= 0.9) return "text-destructive bg-destructive/8 border-destructive/20"
  if (prob >= 0.7) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-emerald-700 bg-emerald-50 border-emerald-200"
}

export default function KasusAmbigu({ data }: Props) {
  const safeData = Array.isArray(data) ? data : []

  function handleExport() {
    const header = ["#", "Keputusan Aktual", "Pola Umum", "Kekuatan Pola", "Status P3KE", "Per Kapita", "Kondisi Rumah"]
    const rows = safeData.map((k) => [
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
    a.download = "keputusan_tidak_konsisten.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Keputusan Tidak Konsisten dengan Pola
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {safeData.length} kasus di mana keputusan pewawancara berbeda dari pola umum data
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold text-secondary border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors"
        >
          <Download size={13} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-muted/40 border-b border-border text-muted-foreground">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Keputusan Aktual</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Pola Umum</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Kekuatan Pola</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Status P3KE</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Per Kapita</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider">Kondisi Rumah</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {safeData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Tidak ada keputusan yang tidak konsisten
                </td>
              </tr>
            ) : safeData.map((k) => (
              <tr key={k.index} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{k.index}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    k.keputusan_aktual === "Diusulkan"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-destructive/8 text-destructive"
                  }`}>
                    {k.keputusan_aktual}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    k.prediksi_model === "Diusulkan"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-destructive/8 text-destructive"
                  }`}>
                    {k.prediksi_model}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${kekuatanColor(k.probabilitas)}`}>
                    {(k.probabilitas * 100).toFixed(1)}% ⚠
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-foreground">{k.status_p3ke}</td>
                <td className="px-5 py-3 text-sm font-mono text-foreground">
                  {formatRupiah(k.nominal_per_kapita)}
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${
                    k.kondisi_rumah === "Tidak Layak"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
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
