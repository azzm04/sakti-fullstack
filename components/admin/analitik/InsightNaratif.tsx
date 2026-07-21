"use client"

import { Lightbulb, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { DashboardAnalitikData } from "@/types/analitik"

interface Props {
  data: DashboardAnalitikData
}

function fmtRp(n: number): string {
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)} jt`
  return `Rp ${n.toLocaleString("id-ID")}`
}

export default function InsightNaratif({ data }: Props) {
  const { ringkasan, feature_importance, rule_nodes, kasus_ambigu } = data

  const topFitur = (Array.isArray(feature_importance) ? feature_importance : [])
    .filter((f) => f.importance > 0)
    .slice(0, 3)

  const aturanTolak = (Array.isArray(rule_nodes) ? rule_nodes : [])
    .filter((r) => r.keputusan !== "Diusulkan")
    .sort((a, b) => b.jumlah_sampel - a.jumlah_sampel)

  const thresholdMatch = aturanTolak[0]?.kondisi?.match(/Penghasilan Ayah.*?>\s*([\d,.]+)/)
  const thresholdPenghasilan = thresholdMatch
    ? parseFloat(thresholdMatch[1].replace(/[,.]/g, ""))
    : null

  const thresholdTanggunganMatch = aturanTolak[0]?.kondisi?.match(/Jumlah Tanggungan.*?≤\s*([\d.]+)/)
  const thresholdTanggungan = thresholdTanggunganMatch
    ? parseFloat(thresholdTanggunganMatch[1])
    : null

  const safeAmbigu = Array.isArray(kasus_ambigu) ? kasus_ambigu : []
  // Kasus di mana pewawancara menolak, padahal model memprediksi "Diusulkan"
  const seharusnyaDiusulkan = safeAmbigu.filter(
    (k) => k.keputusan_aktual !== "Diusulkan" && k.prediksi_model === "Diusulkan"
  ).length

  const insights: {
    icon: React.ElementType
    colorIcon: string
    colorTitle: string
    bg: string
    border: string
    title: string
    body: string
  }[] = []

  // 1. Faktor Penentu Utama
  if (topFitur.length > 0) {
    const top = topFitur[0]
    insights.push({
      icon: Lightbulb,
      colorIcon: "text-secondary",
      colorTitle: "text-foreground",
      bg: "bg-muted/60",
      border: "border-border",
      title: "Faktor Penentu Utama",
      body: `Keputusan pewawancara paling dipengaruhi oleh ${top.fitur} (${top.pct}% kontribusi)${topFitur[1] ? `, diikuti ${topFitur[1].fitur} (${topFitur[1].pct}%)` : ""}${topFitur[2] ? ` dan ${topFitur[2].fitur} (${topFitur[2].pct}%)` : ""}. Faktor ekonomi mendominasi pola keputusan ini.`,
    })
  }

  // 2. Pola Tidak Diusulkan
  if (thresholdPenghasilan && thresholdTanggungan) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-rose-500",
      colorTitle: "text-rose-600",
      bg: "bg-rose-50/50",
      border: "border-rose-100",
      title: "Pola Tidak Diusulkan",
      body: `Pewawancara cenderung TIDAK mengusulkan jika penghasilan ayah melebihi ${fmtRp(thresholdPenghasilan)} dan jumlah tanggungan ≤ ${Math.round(thresholdTanggungan)} orang. Ini mencerminkan persepsi bahwa keluarga dengan penghasilan tinggi dan tanggungan sedikit dianggap mampu secara ekonomi.`,
    })
  } else if (aturanTolak.length > 0) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-rose-500",
      colorTitle: "text-rose-600",
      bg: "bg-rose-50/50",
      border: "border-rose-100",
      title: "Pola Tidak Diusulkan",
      body: `Ditemukan ${aturanTolak.length} pola keputusan penolakan. Kondisi utama: ${aturanTolak[0].kondisi.split("&")[0].trim()}.`,
    })
  }

  // 3. Kasus Ambigu
  if (safeAmbigu.length > 0) {
    insights.push({
      icon: AlertTriangle,
      colorIcon: "text-amber-500",
      colorTitle: "text-amber-700",
      bg: "bg-amber-50/50",
      border: "border-amber-200/60",
      title: `${safeAmbigu.length} Keputusan Layak Ditinjau Ulang`,
      body: `${seharusnyaDiusulkan} dari ${safeAmbigu.length} kasus: kandidat yang TIDAK diusulkan pewawancara padahal pola umum data mengarah ke "Diusulkan". Ini bisa mengindikasikan pertimbangan subjektif di luar data yang perlu ditinjau lebih lanjut.`,
    })
  }

  // 4. Konsistensi Keputusan
  if (ringkasan.pct_diusulkan >= 85) {
    insights.push({
      icon: CheckCircle2,
      colorIcon: "text-emerald-500",
      colorTitle: "text-emerald-700",
      bg: "bg-emerald-50/50",
      border: "border-emerald-200/60",
      title: "Konsistensi Keputusan Baik",
      body: `${ringkasan.pct_diusulkan}% kandidat diusulkan. Model Decision Tree berhasil menjelaskan pola keputusan ini dengan baik, menunjukkan pewawancara cukup konsisten dalam menggunakan kriteria yang sama.`,
    })
  }

  if (insights.length === 0) return null

  return (
    <div className="bg-tertiary rounded-2xl border border-border shadow-sm p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border shrink-0">
          <Lightbulb size={20} className="text-secondary" strokeWidth={2} />
        </div>
        <h3 className="text-[15px] font-extrabold text-foreground uppercase tracking-wide">
          Ringkasan Analitik Pola Keputusan Pewawancara
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {insights.map(({ icon: Icon, colorIcon, colorTitle, bg, border, title, body }, i) => (
          <div
            key={i}
            className={`${bg} border ${border} rounded-2xl p-5 transition-colors hover:bg-opacity-80`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <Icon size={18} className={colorIcon} strokeWidth={2.5} />
              <h4 className={`text-sm font-bold ${colorTitle}`}>{title}</h4>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
              {body}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}