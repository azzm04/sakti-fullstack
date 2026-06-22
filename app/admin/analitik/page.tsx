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

async function getAnalitikData(): Promise<DashboardAnalitikData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8000"
    const res = await fetch(`${baseUrl}/api/v1/analitik/dashboard`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function AnalitikPage() {
  const data = await getAnalitikData()

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Header ── */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Analitik Seleksi</span>
          </nav>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Dashboard Analitik
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Hasil analisis model Decision Tree terhadap data seleksi KIP-Kuliah.
              </p>
            </div>
            {data && (
              <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                <Sparkles size={12} />
                Diproses dalam {(data.waktu_proses_ms / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* ── Error State ── */}
        {!data && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              Gagal memuat data analitik
            </h3>
            <p className="text-slate-500 text-sm max-w-sm">
              Pastikan server FastAPI berjalan dan endpoint{" "}
              <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                /api/v1/analitik/dashboard
              </code>{" "}
              dapat diakses.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* ── Kartu Ringkasan ── */}
            <KartuRingkasan
              ringkasan={data.ringkasan}
              konsistensi={data.konsistensi}
            />

            {/* ── Baris 2: Feature Importance + Konsistensi + Model Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <FeatureImportanceChart data={data.feature_importance} />
              </div>
              <div className="md:col-span-1">
                <KonsistensiCard data={data.konsistensi} />
              </div>
              <div className="md:col-span-1">
                <ModelInfoCard data={data.model_info} />
              </div>
            </div>

            {/* ── Baris 3: Distribusi P3KE + Kondisi Rumah ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DistribusiChart
                data={data.distribusi_p3ke}
                title="Distribusi per Status P3KE"
                subtitle="Jumlah kandidat diusulkan vs tidak per kategori P3KE"
              />
              <DistribusiChart
                data={data.distribusi_kondisi_rumah}
                title="Distribusi per Kondisi Rumah"
                subtitle="Jumlah kandidat diusulkan vs tidak per kondisi tempat tinggal"
              />
            </div>

            {/* ── Distribusi DTKS + Geografis ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DistribusiChart
                data={data.distribusi_dtks}
                title="Distribusi Data DTKS"
                subtitle="Kandidat terdaftar vs belum terdata dalam DTKS"
              />
              <GeografisChart data={data.distribusi_geografis} />
            </div>

            {/* ── Rule Extraction ── */}
            <RuleExtraction rules={data.rule_nodes} />

            {/* ── Kasus Ambigu ── */}
            <KasusAmbigu data={data.kasus_ambigu} />
          </>
        )}
      </div>
    </div>
  )
}
