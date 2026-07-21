"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts"
import type { DistribusiFakultas } from "@/types/analitik"

interface FakultasChartProps {
  data: DistribusiFakultas[]
  totalDiusulkan: number
}

// Palet warna untuk meniru grafik kiri yang warna-warni
const COLORS = [
  '#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', 
  '#f59e0b', '#14b8a6', '#64748b', '#06b6d4', '#d946ef', 
  '#84cc16', '#6366f1', '#f43f5e', '#22c55e'
]

export default function FakultasChart({ data, totalDiusulkan }: FakultasChartProps) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            Jumlah Penerima per Fakultas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{totalDiusulkan}</span> total penerima (diusulkan KIP Kuliah)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Grafik Kiri: Total per Fakultas */}
        <div className="bg-background rounded-2xl border border-border p-5 flex flex-col justify-between">
          <div className="mb-6">
            <h4 className="text-sm font-bold text-foreground mb-1">Total per fakultas</h4>
            <p className="text-[11px] text-muted-foreground">Akumulasi jumlah penerima di setiap fakultas</p>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="fakultas" 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total_penerima" name="Total Penerima" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grafik Kanan: Laki-laki / Perempuan per Fakultas */}
        <div className="bg-background rounded-2xl border border-border p-5 flex flex-col justify-between">
          <div className="mb-2">
            <h4 className="text-sm font-bold text-foreground mb-1">Laki-laki / Perempuan per fakultas</h4>
            <p className="text-[11px] text-muted-foreground">Breakdown penerima berdasarkan jenis kelamin</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="fakultas" 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                {/* Warna Biru & Merah Muda Persis Gambar */}
                <Bar dataKey="laki_laki" name="Laki-laki (L)" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="perempuan" name="Perempuan (P)" fill="#fb7185" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}