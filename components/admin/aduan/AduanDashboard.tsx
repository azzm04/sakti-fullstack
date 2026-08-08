"use client";

import { useState, useEffect } from "react";
import { Eye, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Link from "next/link"; 

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
    <div className="bg-transparent md:bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200 overflow-hidden">
      {/* HEADER DASBOR */}
      <div className="px-4 md:px-6 py-5 md:border-b border-slate-200 bg-white md:bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-xl md:rounded-none mb-4 md:mb-0 shadow-sm md:shadow-none border border-slate-200 md:border-none">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daftar Laporan Pengaduan</h2>
          <p className="text-sm text-slate-500">Kelola dan pantau indikasi penyalahgunaan KIP-K</p>
        </div>
        <div className="text-sm font-bold text-[#0b1727] bg-slate-100 md:bg-slate-200 px-4 py-2 rounded-lg w-full md:w-auto text-center">
          Total: {laporan.length} Laporan
        </div>
      </div>

      {/* TABEL RESPONSIP */}
      <div className="w-full">
        <table className="w-full text-sm text-left text-slate-600 block md:table">
          {/* THEAD disembunyikan di Mobile */}
          <thead className="hidden md:table-header-group text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold">Tanggal & Resi</th>
              <th className="px-6 py-4 font-bold">Terlapor</th>
              <th className="px-6 py-4 font-bold">Kategori</th>
              <th className="px-6 py-4 font-bold">Status</th>
              <th className="px-6 py-4 font-bold text-center">Aksi</th>
            </tr>
          </thead>
          
          <tbody className="block md:table-row-group">
            {isLoading ? (
              <tr className="block md:table-row"><td colSpan={5} className="block md:table-cell text-center py-10 bg-white rounded-xl">Memuat data...</td></tr>
            ) : laporan.length === 0 ? (
              <tr className="block md:table-row"><td colSpan={5} className="block md:table-cell text-center py-10 text-slate-500 bg-white rounded-xl">Belum ada laporan.</td></tr>
            ) : (
              laporan.map((item) => (
                <tr key={item.id} className="block md:table-row bg-white md:bg-transparent border border-slate-200 md:border-0 md:border-b md:border-slate-100 mb-4 md:mb-0 rounded-xl md:rounded-none md:hover:bg-slate-50 shadow-sm md:shadow-none transition-colors">
                  
                  {/* KOLOM 1: TANGGAL & RESI */}
                  <td className="block md:table-cell px-5 md:px-6 py-3 md:py-4 border-b border-slate-50 md:border-none">
                    <div className="flex md:block justify-between items-center mb-1 md:mb-0">
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Aduan</span>
                      <div className="font-bold text-slate-800">{item.kode_laporan}</div>
                    </div>
                    <div className="text-xs text-slate-500 text-right md:text-left">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>

                  {/* KOLOM 2: TERLAPOR */}
                  <td className="block md:table-cell px-5 md:px-6 py-3 md:py-4 border-b border-slate-50 md:border-none">
                     <div className="flex md:block justify-between md:justify-start items-center">
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider w-1/3">Terlapor</span>
                      <div className="text-right md:text-left w-2/3 md:w-auto">
                        <div className="font-semibold text-slate-700">{item.nama_terlapor}</div>
                        <div className="text-xs text-slate-500 truncate">{item.fakultas_prodi}</div>
                      </div>
                    </div>
                  </td>

                  {/* KOLOM 3: KATEGORI */}
                  <td className="block md:table-cell px-5 md:px-6 py-3 md:py-4 border-b border-slate-50 md:border-none font-medium text-slate-600">
                    <div className="flex md:block justify-between items-center">
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kategori</span>
                      <span className="text-right md:text-left">
                        {item.jenis_aduan === 'KETIDAKTEPATAN' ? 'Ketidaktepatan Sasaran' : 'Penyalahgunaan Dana'}
                      </span>
                    </div>
                  </td>

                  {/* KOLOM 4: STATUS */}
                  <td className="block md:table-cell px-5 md:px-6 py-3 md:py-4 border-b border-slate-50 md:border-none">
                    <div className="flex md:block justify-between items-center">
                      <span className="md:hidden text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                      {getStatusBadge(item.status)}
                    </div>
                  </td>

                  {/* KOLOM 5: AKSI (TOMBOL) */}
                  <td className="block md:table-cell px-5 md:px-6 py-4 md:text-center bg-slate-50/50 md:bg-transparent rounded-b-xl md:rounded-none">
                    <Link 
                      href={`/admin/aduan/${item.id}`}
                      className="flex md:inline-flex items-center justify-center w-full md:w-auto gap-2 p-2.5 md:p-2 text-blue-600 bg-blue-100/50 md:bg-blue-50 hover:bg-blue-200 md:hover:bg-blue-100 rounded-lg transition-colors font-semibold text-sm md:text-base"
                    >
                      <Eye className="w-4 h-4 md:w-4 md:h-4" />
                      <span className="md:hidden">Buka Detail Aduan</span>
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