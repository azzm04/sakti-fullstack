"use client";

import { useState, useEffect } from "react";
import { Eye, X, ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";

// Tipe data yang sesuai dengan skema Prisma
interface Aduan {
  id: string;
  kode_laporan: string;
  jenis_aduan: string;
  nama_terlapor: string;
  nim_terlapor: string | null;
  fakultas_prodi: string | null;
  angkatan: string | null;
  uraian_kronologi: string;
  url_bukti: string;
  status: "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";
  created_at: string;
}

export default function AduanDashboard() {
  const [laporan, setLaporan] = useState<Aduan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Modal Detail
  const [selectedAduan, setSelectedAduan] = useState<Aduan | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Mengambil data dari API saat halaman dimuat
  useEffect(() => {
    fetchLaporan();
  }, []);

  const fetchLaporan = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/aduan");
      const result = await res.json();
      if (res.ok) setLaporan(result.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi mengubah status ke API
  const updateStatus = async (id: string, statusBaru: string) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/admin/aduan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru }),
      });

      if (res.ok) {
        // Perbarui data di tabel tanpa harus reload halaman
        setLaporan((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: statusBaru as any } : item))
        );
        // Perbarui data di dalam modal jika sedang terbuka
        if (selectedAduan) {
          setSelectedAduan({ ...selectedAduan, status: statusBaru as any });
        }
      }
    } catch (error) {
      alert("Gagal memperbarui status.");
    } finally {
      setIsUpdating(false);
    }
  };

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
      
      {/* Header Tabel */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daftar Laporan Pengaduan</h2>
          <p className="text-sm text-slate-500">Kelola dan pantau indikasi penyalahgunaan KIP-K</p>
        </div>
        <div className="text-sm font-bold text-[#0b1727] bg-slate-200 px-4 py-2 rounded-lg">
          Total: {laporan.length} Laporan
        </div>
      </div>

      {/* Tabel */}
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
              <tr>
                <td colSpan={5} className="text-center py-10">Memuat data...</td>
              </tr>
            ) : laporan.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-500">Belum ada laporan yang masuk.</td>
              </tr>
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
                  <td className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => setSelectedAduan(item)}
                      className="inline-flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAIL ADUAN */}
      {selectedAduan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur z-10">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Detail Laporan</h3>
                <p className="text-sm text-slate-500 mt-1">Resi: <span className="font-bold text-slate-700">{selectedAduan.kode_laporan}</span></p>
              </div>
              <button onClick={() => setSelectedAduan(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Info Terlapor */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Nama Terlapor</p>
                  <p className="font-semibold text-slate-800">{selectedAduan.nama_terlapor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">NIM / Angkatan</p>
                  <p className="font-semibold text-slate-800">{selectedAduan.nim_terlapor || '-'} / {selectedAduan.angkatan || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Fakultas / Prodi</p>
                  <p className="font-semibold text-slate-800">{selectedAduan.fakultas_prodi || '-'}</p>
                </div>
              </div>

              {/* Kronologi */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Uraian Kronologi</p>
                <div className="bg-white border border-slate-200 p-4 rounded-xl text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAduan.uraian_kronologi}
                </div>
              </div>

              {/* Bukti */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-2">Bukti Pendukung</p>
                {selectedAduan.url_bukti ? (
                  <a href={selectedAduan.url_bukti} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                    <ExternalLink className="w-4 h-4 mr-2" /> Buka Tautan Bukti
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Tidak ada tautan bukti yang dilampirkan.</span>
                )}
              </div>
            </div>

            {/* Modal Footer (Action Ubah Status) */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 sticky bottom-0 flex justify-between items-center">
              <div className="text-sm font-bold text-slate-700 flex items-center gap-3">
                Status Saat Ini: {getStatusBadge(selectedAduan.status)}
              </div>
              
              <div className="flex gap-2">
                <select 
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedAduan.status}
                  onChange={(e) => updateStatus(selectedAduan.id, e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="MENUNGGU">Tandai Menunggu</option>
                  <option value="DIPROSES">Tandai Diproses</option>
                  <option value="SELESAI">Tandai Selesai</option>
                  <option value="DITOLAK">Tolak Laporan</option>
                </select>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}