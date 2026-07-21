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
  if (pct >= 90) return "var(--color-primary)"
  if (pct >= 75) return "var(--color-secondary)"
  return "color-mix(in srgb, var(--color-primary) 40%, white)"
}

export default function GeografisChart({ data }: Props) {
  const isMounted = useIsMounted()
  const safeData = Array.isArray(data) ? data : []

  const sorted = [...safeData].sort((a, b) => b.total - a.total)
  const grandTotal = sorted.reduce((acc, curr) => acc + curr.total, 0)
  const maxTotal = sorted.length > 0 ? Math.max(...sorted.map((d) => d.total)) : 0

  if (sorted.length === 0) {
    return (
      <div className="bg-tertiary rounded-2xl border border-border shadow-sm p-6">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-1">
          <MapIcon size={16} className="text-secondary" />
          Sebaran per Provinsi
        </h3>
        <p className="text-xs text-muted-foreground">Data geografis tidak tersedia</p>
      </div>
    )
  }

  return (
    <div className="bg-tertiary rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-5 border-b border-border bg-muted/40">
        <h3 className="text-[15px] font-bold text-foreground flex items-center gap-2">
          <MapIcon size={18} className="text-secondary" />
          Sebaran per Provinsi
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-bold text-foreground">{grandTotal.toLocaleString("id-ID")}</span> total pendaftar
          {" · "}ukuran lingkaran = volume pendaftar, warna = tingkat diusulkan
        </p>
      </div>

      <div className="flex flex-col lg:flex-row h-[500px]">
        <div className="flex-1 bg-muted relative z-0">
          {isMounted ? (
            <MapContainer
              center={[-2.5489, 118.0149]}
              zoom={5}
              style={{ height: "100%", width: "100%", zIndex: 10 }}
              zoomControl={true}
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
                      color: "var(--color-primary)",
                      fillColor: fill,
                      weight: 1,
                    }}
                  >
                    <Tooltip sticky>
                      <div className="text-xs font-semibold text-foreground">{item.provinsi.toUpperCase()}</div>
                      <div className="text-[11px] text-muted-foreground">
                        Total {item.total.toLocaleString("id-ID")}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {item.diusulkan.toLocaleString("id-ID")} diusulkan, {item.tidak_diusulkan.toLocaleString("id-ID")} tidak
                      </div>
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <MapIcon size={48} className="mb-3 opacity-20 animate-pulse" />
              <p className="text-sm font-medium">Memuat Peta...</p>
            </div>
          )}

          {/* Legend Peta */}
          <div className="absolute bottom-4 right-4 bg-tertiary/95 backdrop-blur px-4 py-3 rounded-lg shadow-sm border border-border text-xs text-muted-foreground z-[400] pointer-events-none">
            <p className="font-bold text-foreground mb-2">Ukuran = volume pendaftar</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border border-border"></div>
              <span>Sedikit</span>
              <div className="w-6 h-6 rounded-full bg-muted-foreground/30 border border-border ml-2"></div>
              <span>Banyak</span>
            </div>
            <p className="font-bold text-foreground mb-1.5 mt-3">Warna = tingkat diusulkan</p>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-primary)" }}></div>
              <span>Tinggi (≥90%)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ background: "var(--color-secondary)" }}></div>
              <span>Sedang (75-89%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: "color-mix(in srgb, var(--color-primary) 40%, white)" }}></div>
              <span>Rendah (&lt;75%)</span>
            </div>
          </div>
        </div>

        {/* Sidebar Kanan (List Provinsi) */}
        <div className="w-full lg:w-[320px] bg-tertiary flex flex-col border-l border-border relative z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="px-5 py-4 border-b border-border bg-tertiary">
            <h4 className="text-[15px] font-semibold text-foreground">Ringkasan per provinsi</h4>
          </div>

          <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
            <ul className="space-y-0">
              {sorted.map((item, index) => (
                <li
                  key={index}
                  className="px-5 py-2.5 hover:bg-muted/60 transition-colors cursor-default text-[13px] text-foreground flex items-center"
                >
                  <span>{item.provinsi.toUpperCase()}</span>
                  <span className="text-muted-foreground ml-1.5">
                    (total {item.total.toLocaleString("id-ID")})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--color-border);
          border-radius: 20px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: var(--color-secondary);
        }
      `}</style>
    </div>
  )
}