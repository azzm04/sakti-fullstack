import { AlertCircle, Sparkles } from "lucide-react"
import type { DashboardAnalitikData } from "@/types/analitik"

import KartuRingkasan from "@/components/admin/analitik/KartuRingkasan"
import FeatureImportanceChart from "@/components/admin/analitik/FeatureImportanceChart"
import KonsistensiCard from "@/components/admin/analitik/KonsistensiCard"
import DistribusiChart from "@/components/admin/analitik/DistribusiChart"
import GeografisChart from "@/components/admin/analitik/GeografisChart"
import RuleExtraction from "@/components/admin/analitik/RuleExtraction"
import KasusAmbigu from "@/components/admin/analitik/KasusAmbigu"
import ModelInfoCard from "@/components/admin/analitik/ModelInfoCard"
import InsightNaratif from "@/components/admin/analitik/InsightNaratif"

async function getAnalitikData(): Promise<{ data: DashboardAnalitikData | null; error: string | null }> {
  const baseUrl =
    process.env.NEXT_PUBLIC_FASTAPI_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8001"
  const url = `${baseUrl}/api/v1/analitik/dashboard`

  try {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}))
      const msg = errorBody.pesan || `Gagal mengambil data (Status: ${res.status})`
      console.error("[analitik] fetch error:", res.status, errorBody)
      return { data: null, error: msg }
    }
    const data = await res.json()
    return { data, error: null }
  } catch (err) {
    console.error("[analitik] server tidak dapat dijangkau:", err)
    return { data: null, error: "Server analitik tidak dapat dijangkau. Pastikan FastAPI berjalan." }
  }
}

export default async function AnalitikPage() {
  const { data, error } = await getAnalitikData()

  return (
    <div className="p-4 md:p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Analitik Seleksi</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight font-headline">
                Dashboard Analitik
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Hasil analisis model Decision Tree terhadap data seleksi KIP-Kuliah.
              </p>
            </div>
            {data && (
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 border border-primary/15 rounded-xl px-3 py-2">
                <Sparkles size={12} />
                Diproses dalam {(data.waktu_proses_ms / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {!data && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-border">
            <div className="w-14 h-14 bg-destructive/8 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-destructive" />
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">
              Gagal memuat data analitik
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {error ?? (
                <>
                  Pastikan server FastAPI berjalan dan endpoint{" "}
                  <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                    /api/v1/analitik/dashboard
                  </code>{" "}
                  dapat diakses.
                </>
              )}
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Kartu Ringkasan */}
            <KartuRingkasan ringkasan={data.ringkasan} konsistensi={data.konsistensi} />

            {/* Insight Naratif */}
            <InsightNaratif data={data} />

            {/* Feature Importance + Konsistensi — 2 kolom, lebih lega */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FeatureImportanceChart data={data.feature_importance} />
              <KonsistensiCard data={data.konsistensi} />
            </div>

            {/* 3 Distribusi vertikal — grid 3 kolom */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DistribusiChart
                data={data.distribusi_p3ke}
                title="Distribusi per Status P3KE"
                subtitle="Diusulkan vs tidak per kategori P3KE"
              />
              <DistribusiChart
                data={data.distribusi_kondisi_rumah}
                title="Distribusi per Kondisi Rumah"
                subtitle="Diusulkan vs tidak per kondisi tempat tinggal"
              />
              <DistribusiChart
                data={data.distribusi_dtks}
                title="Distribusi Data DTKS"
                subtitle="Terdaftar vs belum terdata dalam DTKS"
              />
            </div>

            {/* Distribusi Geografis — full width agar nama provinsi terbaca */}
            <GeografisChart data={data.distribusi_geografis} />

            {/* Rule Extraction */}
            <RuleExtraction rules={data.rule_nodes} />

            {/* Keputusan Tidak Konsisten */}
            <KasusAmbigu data={data.kasus_ambigu} />

            {/* Model Info — accordion untuk pengguna teknis */}
            <ModelInfoCard data={data.model_info} />
          </>
        )}
      </div>
    </div>
  )
}
