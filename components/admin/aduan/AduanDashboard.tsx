"use client";

import { useState, useEffect } from "react";
import { Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link"; // Komponen Link untuk redirect halaman

interface Aduan {
  id: string;
  kode_laporan: string;
  jenis_aduan: string;
  nama_terlapor: string;
  nim_terlapor: string | null;
  fakultas_prodi: string | null;
  angkatan: string | null;
  status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  created_at: string;
}

export default function AduanDashboard() {
  const [laporan, setLaporan] = useState<Aduan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res = await fetch("/api/admin/aduan");
        const result = await res.json();
        if (res.ok) setLaporan(result.data);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MENUNGGU": return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Menunggu</span>;
      case "DIPROSES": return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Diproses</span>;
      case "SELESAI": return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> Selesai</span>;
      case "DITOLAK": return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold w-fit">Ditolak</span>;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daftar Laporan Pengaduan</h2>
          <p className="text-sm text-slate-500">Kelola dan pantau indikasi penyalahgunaan KIP-K</p>
        </div>
        <div className="text-sm font-bold text-[#0b1727] bg-slate-200 px-4 py-2 rounded-lg">
          Total: {laporan.length} Laporan
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Tanggal & Resi</th>
              <th className="px-6 py-4 font-bold">Terlapor</th>
              <th className="px-6 py-4 font-bold">Kategori</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10">Memuat data...</td></tr>
            ) : laporan.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500">Belum ada laporan.</td></tr>
            ) : (
              laporan.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{item.kode_laporan}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{item.nama_terlapor}</div>
                    <div className="text-xs text-slate-500">{item.fakultas_prodi}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {item.jenis_aduan === 'KETIDAKTEPATAN' ? 'Ketidaktepatan Sasaran' : 'Penyalahgunaan Dana'}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                  <td className="px-6 py-4 text-center">
                    {/* INI KUNCI PERUBAHANNYA: Menggunakan Link yang redirect ke Dynamic Route, bukan setState Modal */}
                    <Link 
                      href={`/admin/aduan/${item.id}`}
                      className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Buka Halaman Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}