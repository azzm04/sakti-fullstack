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
  const ambiguMestiDisusulkan = safeAmbigu.filter((k) => k.prediksi_model === "Diusulkan").length

  const insights: {
    icon: React.ElementType
    colorIcon: string
    colorTitle: string
    bg: string
    border: string
    title: string
    body: string
  }[] = []

  if (topFitur.length > 0) {
    const top = topFitur[0]
    insights.push({
      icon: Lightbulb,
      colorIcon: "text-primary",
      colorTitle: "text-primary",
      bg: "bg-primary/5",
      border: "border-primary/15",
      title: "Faktor Penentu Utama",
      body: `Keputusan pewawancara paling dipengaruhi oleh ${top.fitur} (${top.pct}% kontribusi)${topFitur[1] ? `, diikuti ${topFitur[1].fitur} (${topFitur[1].pct}%)` : ""}${topFitur[2] ? ` dan ${topFitur[2].fitur} (${topFitur[2].pct}%)` : ""}. Faktor ekonomi mendominasi pola keputusan ini.`,
    })
  }

  if (thresholdPenghasilan && thresholdTanggungan) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-destructive",
      colorTitle: "text-destructive",
      bg: "bg-destructive/5",
      border: "border-destructive/15",
      title: "Pola Tidak Diusulkan",
      body: `Pewawancara cenderung TIDAK mengusulkan jika penghasilan ayah melebihi ${fmtRp(thresholdPenghasilan)} dan jumlah tanggungan ≤ ${Math.round(thresholdTanggungan)} orang. Ini mencerminkan persepsi bahwa keluarga dengan penghasilan tinggi dan tanggungan sedikit dianggap mampu secara ekonomi.`,
    })
  } else if (aturanTolak.length > 0) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-destructive",
      colorTitle: "text-destructive",
      bg: "bg-destructive/5",
      border: "border-destructive/15",
      title: "Pola Tidak Diusulkan",
      body: `Ditemukan ${aturanTolak.length} pola keputusan penolakan. Kondisi utama: ${aturanTolak[0].kondisi.split("&")[0].trim()}.`,
    })
  }

  if (safeAmbigu.length > 0) {
    insights.push({
      icon: AlertTriangle,
      colorIcon: "text-amber-600",
      colorTitle: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: `${safeAmbigu.length} Keputusan Tidak Konsisten dengan Pola`,
      body: `${ambiguMestiDisusulkan} dari ${safeAmbigu.length} keputusan tidak konsisten: kandidat yang TIDAK diusulkan pewawancara padahal pola umum data mengarah ke "Diusulkan". Ini bisa mengindikasikan pertimbangan subjektif di luar data yang perlu ditinjau lebih lanjut.`,
    })
  }

  if (ringkasan.pct_diusulkan >= 85) {
    insights.push({
      icon: CheckCircle2,
      colorIcon: "text-emerald-600",
      colorTitle: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      title: "Konsistensi Keputusan Baik",
      body: `${ringkasan.pct_diusulkan}% kandidat diusulkan. Model Decision Tree berhasil menjelaskan 90% pola keputusan ini, menunjukkan pewawancara cukup konsisten dalam menggunakan kriteria yang sama.`,
    })
  }

  if (insights.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
          <Lightbulb size={15} className="text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
            Ringkasan Analitik pola keputusan pewawancara
          </h3>
          {/* <p className="text-xs text-muted-foreground">
            Ringkasan pola keputusan pewawancara
          </p> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map(({ icon: Icon, colorIcon, colorTitle, bg, border, title, body }, i) => (
          <div key={i} className={`${bg} border ${border} rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={colorIcon} />
              <p className={`text-xs font-bold ${colorTitle}`}>{title}</p>
            </div>
            <p className="text-xs text-foreground/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
