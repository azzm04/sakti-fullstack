"use client"

import { useSyncExternalStore } from "react"
import { Map as MapIcon } from "lucide-react"
import dynamic from "next/dynamic"
import type { DistribusiGeografis } from "@/types/analitik"

import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const CircleMarker = dynamic(() => import("react-leaflet").then((mod) => mod.CircleMarker), { ssr: false })
const Tooltip = dynamic(() => import("react-leaflet").then((mod) => mod.Tooltip), { ssr: false })

function subscribeNoop() {
  return () => {}
}
function useIsMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  )
}

const KOORDINAT_PROVINSI: Record<string, [number, number]> = {
  "ACEH": [4.6951, 96.7494],
  "SUMATERA UTARA": [2.1154, 99.5451],
  "SUMATERA BARAT": [-0.7399, 100.8000],
  "RIAU": [0.2933, 101.7068],
  "JAMBI": [-1.6101, 103.6131],
  "SUMATERA SELATAN": [-3.3194, 104.9147],
  "BENGKULU": [-3.7928, 102.2608],
  "LAMPUNG": [-4.5586, 105.1790],
  "KEPULAUAN BANGKA BELITUNG": [-2.7411, 106.4406],
  "KEPULAUAN RIAU": [3.9456, 108.1429],
  "DKI JAKARTA": [-6.2088, 106.8456],
  "JAWA BARAT": [-6.9204, 107.6046],
  "JAWA TENGAH": [-7.1509, 110.1403],
  "DI YOGYAKARTA": [-7.7956, 110.3695],
  "JAWA TIMUR": [-7.5361, 112.2384],
  "BANTEN": [-6.4058, 106.0640],
  "BALI": [-8.4095, 115.1889],
  "NUSA TENGGARA BARAT": [-8.6529, 117.3616],
  "NUSA TENGGARA TIMUR": [-8.6574, 121.0794],
  "KALIMANTAN BARAT": [-0.2787, 111.4753],
  "KALIMANTAN TENGAH": [-1.6815, 113.3824],
  "KALIMANTAN SELATAN": [-3.0926, 115.2838],
  "KALIMANTAN TIMUR": [0.5387, 116.4194],
  "KALIMANTAN UTARA": [3.0731, 116.0414],
  "SULAWESI UTARA": [0.6247, 123.9750],
  "SULAWESI TENGAH": [-1.4300, 121.4456],
  "SULAWESI SELATAN": [-3.6688, 119.9740],
  "SULAWESI TENGGARA": [-4.1449, 122.1746],
  "GORONTALO": [0.6999, 122.4467],
  "SULAWESI BARAT": [-2.8441, 119.2321],
  "MALUKU": [-3.2385, 130.1453],
  "MALUKU UTARA": [1.5709, 127.8088],
  "PAPUA": [-4.2699, 138.0804],
  "PAPUA BARAT": [-1.3361, 133.1747],
  "PAPUA SELATAN": [-7.1534, 139.3789],
  "PAPUA TENGAH": [-4.2492, 136.0028],
  "PAPUA PEGUNUNGAN": [-4.1843, 138.9902],
  "PAPUA BARAT DAYA": [-1.2291, 132.3213],
}

interface Props {
  data: DistribusiGeografis[]
}

function rateFill(pct: number): string {
  if (pct >= 90) return "var(--color-admin-accent)"
  if (pct >= 75) return "var(--color-admin-warn-bar)"
  return "var(--color-admin-danger-bar)"
}

function rateText(pct: number): string {
  if (pct >= 90) return "text-admin-accent-ink"
  if (pct >= 75) return "text-admin-warn-text"
  return "text-admin-danger-text"
}

const TOP_N = 10

export default function GeografisChart({ data }: Props) {
  const isMounted = useIsMounted()
  const safeData = Array.isArray(data) ? data : []

  const sorted = [...safeData].sort((a, b) => b.total - a.total)
  const top = sorted.slice(0, TOP_N)
  const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0)
  const maxTotal = sorted.length > 0 ? Math.max(...sorted.map((d) => d.total)) : 0
  const maxTop = top.length > 0 ? Math.max(...top.map((d) => d.total)) : 0

  if (sorted.length === 0) {
    return (
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm p-6">
        <h3 className="font-admin-heading text-[15px] font-bold text-admin-text flex items-center gap-2 mb-1">
          <MapIcon size={16} className="text-admin-text-2" />
          Sebaran per Provinsi
        </h3>
        <p className="text-xs text-admin-text-3">Data geografis tidak tersedia</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-3.5 items-start">
      {/* Peta */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-admin-border">
          <h3 className="font-admin-heading text-[15px] font-bold text-admin-text">Sebaran per Provinsi</h3>
          <p className="text-xs text-admin-text-3 mt-1">
            <span className="font-bold text-admin-text">{grandTotal.toLocaleString("id-ID")}</span> total pendaftar
            {" · "}ukuran lingkaran = volume pendaftar, warna = tingkat diusulkan
          </p>
        </div>

        <div className="relative h-[460px]">
          {isMounted ? (
            <MapContainer
              center={[-2.5489, 118.0149]}
              zoom={5}
              style={{ height: "100%", width: "100%", zIndex: 10 }}
              zoomControl={true}
              scrollWheelZoom={false}
              doubleClickZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {sorted.map((item, index) => {
                if (item.total === 0) return null

                const koordinat = KOORDINAT_PROVINSI[item.provinsi.toUpperCase().trim()]
                if (!koordinat) return null

                const radius = maxTotal > 0 ? 6 + (item.total / maxTotal) * 22 : 6
                const fill = rateFill(item.pct_diusulkan)

                return (
                  <CircleMarker
                    key={index}
                    center={koordinat}
                    radius={radius}
                    fillOpacity={0.65}
                    pathOptions={{
                      color: "var(--color-admin-accent)",
                      fillColor: fill,
                      weight: 1,
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs font-semibold text-admin-text">{item.provinsi.toUpperCase()}</div>
                      <div className="text-[11px] text-admin-text-3">
                        Total {item.total.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-admin-text-3">
                        {item.diusulkan.toLocaleString("id-ID")} diusulkan, {item.tidak_diusulkan.toLocaleString("id-ID")} tidak
                      </div>
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-admin-text-3">
              <MapIcon size={40} className="mb-3 opacity-20 animate-pulse" />
              <p className="text-sm font-medium">Memuat Peta...</p>
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-admin-heading text-[15px] font-bold text-admin-text">Ringkasan per Provinsi</h3>
          <span className="text-[10.5px] font-medium text-admin-text-3 bg-admin-surface-soft border border-admin-border rounded-full px-2.5 py-1 shrink-0">
            {top.length} teratas
          </span>
        </div>

        <ol className="flex flex-col gap-3">
          {top.map((item, index) => (
            <li key={item.provinsi} className="flex items-center gap-3">
              <span className="text-[11px] font-semibold text-admin-text-4 tabular-nums w-3.5 shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-medium truncate ${rateText(item.pct_diusulkan)}`}>
                  {item.provinsi}
                </p>
                <div className="h-1.5 rounded-full bg-admin-grid overflow-hidden mt-1.5">
                  <div
                    className="h-full rounded-full bg-admin-accent"
                    style={{ width: `${maxTop > 0 ? Math.max(2, (item.total / maxTop) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <span className="text-[13px] font-bold text-admin-text tabular-nums shrink-0">
                {item.total.toLocaleString("id-ID")}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
