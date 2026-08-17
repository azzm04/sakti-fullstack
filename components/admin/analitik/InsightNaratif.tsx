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
  const { ringkasan, feature_importance, rule_nodes, kasus_override } = data

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

  const safeOverride = Array.isArray(kasus_override) ? kasus_override : []
  // turun = pewawancara merekomendasikan Diusulkan, tapi admin mengubahnya jadi Tidak Diusulkan
  const diturunkanAdmin = safeOverride.filter((k) => k.jenis_override === "turun").length

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
      colorIcon: "text-admin-text-3",
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

  // 3. Keputusan yang diturunkan admin — kasus konkret, bukan anomali statistik
  if (diturunkanAdmin > 0) {
    insights.push({
      icon: AlertTriangle,
      colorIcon: "text-admin-warn-bar",
      title: `${diturunkanAdmin} Keputusan Layak Ditinjau Ulang`,
      body: `Ada ${diturunkanAdmin} kandidat yang direkomendasikan "Diusulkan" oleh pewawancara, tapi diubah admin menjadi "Tidak Diusulkan" saat finalisasi. Lihat detail tiap kasus pada tabel Keputusan Berbeda antara Pewawancara dan Admin di bawah.`,
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
    <div>
      <h3 className="font-admin-heading text-[19px] font-semibold text-admin-text">Ringkasan Analitik</h3>
      <p className="text-[12.5px] text-admin-text-3 mt-1 mb-4">
        Pola keputusan pewawancara yang ditemukan dari data
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {insights.map(({ icon: Icon, colorIcon, title, body }, i) => (
          <div
            key={i}
            className="bg-admin-surface border border-admin-border rounded-2xl p-5 flex flex-col gap-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Icon size={16} className={`${colorIcon} shrink-0`} strokeWidth={2.25} />
                <h4 className="font-admin-heading text-[14.5px] font-bold text-admin-text">{title}</h4>
              </div>
              <span className="text-[11px] font-semibold text-admin-text-5 tabular-nums shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <p className="text-[12.5px] text-admin-text-3 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
