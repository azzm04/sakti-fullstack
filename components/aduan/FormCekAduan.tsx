"use client";

import { useState } from "react";

// Tipe data untuk hasil pencarian
interface HasilAduan {
  kode_laporan: string;
  status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  jenis_aduan: string;
  created_at: string;
}

export default function FormCekAduan() {
  const [kodeInput, setKodeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [hasil, setHasil] = useState<HasilAduan | null>(null);

  const handleCari = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeInput.trim()) return;

    setIsLoading(true);
    setErrorMsg("");
    setHasil(null);

    try {
      const res = await fetch(`/api/aduan/cek?kode=${encodeURIComponent(kodeInput.trim())}`);
      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Gagal mencari data");
      }

      setHasil(responseData.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "MENUNGGU": return "bg-amber-100 text-amber-800 border-amber-200";
      case "DIPROSES": return "bg-blue-100 text-blue-800 border-blue-200";
      case "SELESAI": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "DITOLAK": return "bg-rose-100 text-rose-800 border-rose-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="-mt-20 relative z-20 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6 sm:p-10">
        
        <form onSubmit={handleCari} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="kode" className="sr-only">Kode Resi Laporan</label>
            <input
              type="text"
              id="kode"
              value={kodeInput}
              onChange={(e) => setKodeInput(e.target.value.toUpperCase())}
              placeholder="Contoh: ADUAN-2026-XXXXX"
              className="block w-full rounded-lg border-slate-300 py-3.5 px-4 text-slate-900 shadow-sm focus:border-[#0b1727] focus:ring-[#0b1727] font-medium tracking-wide bg-slate-50 focus:bg-white transition-colors uppercase"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !kodeInput}
            className="flex-none flex justify-center items-center py-3.5 px-8 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#0b1727] hover:bg-[#152740] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0b1727] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? "Mencari..." : "Cari Laporan"}
          </button>
        </form>

        {errorMsg && (
          <div className="mt-8 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-center text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {hasil && (
          <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Resi</span>
              <span className="text-xs text-slate-500">
                Diajukan pada: {new Date(hasil.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-slate-500 mb-1">Kode Laporan</h4>
                <p className="text-xl font-extrabold text-slate-900 tracking-wide">{hasil.kode_laporan}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Kategori Laporan</h4>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                    {hasil.jenis_aduan === 'KETIDAKTEPATAN' ? 'Ketidaktepatan Sasaran' : 'Penyalahgunaan Dana'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 mb-2">Status Saat Ini</h4>
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(hasil.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse"></span>
                    {hasil.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}