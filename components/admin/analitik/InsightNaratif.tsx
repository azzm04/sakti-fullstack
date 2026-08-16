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
    title: string
    body: string
  }[] = []

  // 1. Faktor Penentu Utama
  if (topFitur.length > 0) {
    const top = topFitur[0]
    insights.push({
      icon: Lightbulb,
      colorIcon: "text-admin-text-2",
      title: "Faktor Penentu Utama",
      body: `Keputusan pewawancara paling dipengaruhi oleh ${top.fitur} (${top.pct}% kontribusi)${topFitur[1] ? `, diikuti ${topFitur[1].fitur} (${topFitur[1].pct}%)` : ""}${topFitur[2] ? ` dan ${topFitur[2].fitur} (${topFitur[2].pct}%)` : ""}. Faktor ekonomi mendominasi pola keputusan ini.`,
    })
  }

  // 2. Pola Tidak Diusulkan
  if (thresholdPenghasilan && thresholdTanggungan) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-admin-danger-bar",
      title: "Pola Tidak Diusulkan",
      body: `Pewawancara cenderung TIDAK mengusulkan jika penghasilan ayah melebihi ${fmtRp(thresholdPenghasilan)} dan jumlah tanggungan ≤ ${Math.round(thresholdTanggungan)} orang. Ini mencerminkan persepsi bahwa keluarga dengan penghasilan tinggi dan tanggungan sedikit dianggap mampu secara ekonomi.`,
    })
  } else if (aturanTolak.length > 0) {
    insights.push({
      icon: TrendingDown,
      colorIcon: "text-admin-danger-bar",
      title: "Pola Tidak Diusulkan",
      body: `Ditemukan ${aturanTolak.length} pola keputusan penolakan. Kondisi utama: ${aturanTolak[0].kondisi.split("&")[0].trim()}.`,
    })
  }

  // 3. Kasus Ambigu
  if (safeAmbigu.length > 0) {
    insights.push({
      icon: AlertTriangle,
      colorIcon: "text-admin-warn-bar",
      title: `${safeAmbigu.length} Keputusan Layak Ditinjau Ulang`,
      body: `${seharusnyaDiusulkan} dari ${safeAmbigu.length} kasus: kandidat yang TIDAK diusulkan pewawancara padahal pola umum data mengarah ke "Diusulkan". Ini bisa mengindikasikan pertimbangan subjektif di luar data yang perlu ditinjau lebih lanjut.`,
    })
  }

  // 4. Konsistensi Keputusan
  if (ringkasan.pct_diusulkan >= 85) {
    insights.push({
      icon: CheckCircle2,
      colorIcon: "text-admin-accent",
      title: "Konsistensi Keputusan Baik",
      body: `${ringkasan.pct_diusulkan}% kandidat diusulkan. Model Decision Tree berhasil menjelaskan pola keputusan ini dengan baik, menunjukkan pewawancara cukup konsisten dalam menggunakan kriteria yang sama.`,
    })
  }

  if (insights.length === 0) return null

  return (
    <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm p-6 lg:p-8">
      <h3 className="text-[15px] font-extrabold text-admin-text uppercase tracking-wide mb-1">
        Ringkasan Analitik
      </h3>
      <p className="text-xs text-admin-text-3 mb-5">
        Pola keputusan pewawancara yang ditemukan dari data
      </p>

      <div className="divide-y divide-admin-border">
        {insights.map(({ icon: Icon, colorIcon, title, body }, i) => (
          <div key={i} className="flex gap-4 py-5 first:pt-0 last:pb-0">
            <Icon size={18} className={`${colorIcon} shrink-0 mt-0.5`} strokeWidth={2.25} />
            <div>
              <h4 className="font-admin-heading text-sm font-bold text-admin-text mb-1.5">{title}</h4>
              <p className="text-[13px] text-admin-text-3 leading-relaxed">
                {body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}