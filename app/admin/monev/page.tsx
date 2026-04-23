"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  FileImage,
  ExternalLink,
  Users,
  ScanSearch,
  AlertCircle,
  FileQuestion,
} from "lucide-react";

// --- Tipe Data ---
export interface AdminMonevData {
  id: string;
  user_id: string;
  nim: string;
  nama: string;
  prodi: string;
  pekerjaan_ayah: string;
  penghasilan_ayah: number;
  url_bukti_ayah: { kerja: string | null; gaji: string | null };
  pekerjaan_ibu: string;
  penghasilan_ibu: number;
  url_bukti_ibu: { kerja: string | null; gaji: string | null };
  penghasilan_lain: number;
  url_bukti_lain: string | null;
  jumlah_tanggungan: number;
  url_scan_kk: string | null;
  status_pengisian: "Sudah" | "Belum";
  total_pendapatan: number;
  rupiah_per_tanggungan: number;
  hasil_deteksi_yolo: number | null; // null = belum, 0 = tidak terbaca, >0 = hasil deteksi
}

const formatRp = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);
};

export default function AdminMonevPage() {
  const [data, setData] = useState<AdminMonevData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, sudah: 0, belum: 0 });

  // State untuk Trigger AI YOLO
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);

  // --- FETCH DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Dummy data dengan berbagai skenario YOLO
      const mockData: AdminMonevData[] = [
        {
          id: "1",
          user_id: "u1",
          nim: "21110631170001",
          nama: "Azzam Syaiful Islam",
          prodi: "Teknik Komputer",
          pekerjaan_ayah: "PNS",
          penghasilan_ayah: 4500000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Ibu Rumah Tangga",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 4,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 4500000,
          rupiah_per_tanggungan: 1125000,
          hasil_deteksi_yolo: null, // Skenario 1: Belum discan
        },
        {
          id: "2",
          user_id: "u2",
          nim: "11000125120161",
          nama: "Zahro Nur Alifah",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Wiraswasta",
          penghasilan_ayah: 1500000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Tidak Bekerja",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 2,
          url_scan_kk: "#",
          status_pengisian: "Belum",
          total_pendapatan: 1500000,
          rupiah_per_tanggungan: 750000,
          hasil_deteksi_yolo: 3, // Skenario 2: Beda (Input 2, AI 3)
        },
        {
          id: "3",
          user_id: "u3",
          nim: "11000125120015",
          nama: "Nazwa Amalia",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Petani",
          penghasilan_ayah: 800000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Petani",
          penghasilan_ibu: 700000,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 3,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 1500000,
          rupiah_per_tanggungan: 500000,
          hasil_deteksi_yolo: 3, // Skenario 3: Sesuai (Input 3, AI 3)
        },
        {
          id: "4",
          user_id: "u4",
          nim: "11000125120030",
          nama: "Ghiza Bilal",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Lainnya",
          penghasilan_ayah: 3250000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Tidak Bekerja",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 4,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 3250000,
          rupiah_per_tanggungan: 812500,
          hasil_deteksi_yolo: 0, // Skenario 4: Gambar rusak/buram tidak terdeteksi
        },
      ];

      setTimeout(() => {
        setData(mockData);
        setTotalPages(10);
        setStats({ total: 5000, sudah: 4200, belum: 800 });
        setLoading(false);
      }, 500);
    } catch {
      setData([]);
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  // --- FUNGSI SCAN MASSAL ---
  const handleScanAll = async () => {
    setIsScanningAll(true);
    // Simulasi proses API hit
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.hasil_deteksi_yolo === null
            ? { ...item, hasil_deteksi_yolo: Math.floor(Math.random() * 5) } // simulasi hasil random
            : item,
        ),
      );
      setIsScanningAll(false);
    }, 2500);
  };

  // --- FUNGSI SCAN SATUAN ---
  const handleScanSingle = async (id: string) => {
    setScanningId(id);
    // Simulasi proses API hit
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, hasil_deteksi_yolo: item.jumlah_tanggungan } // Simulasi lolos
            : item,
        ),
      );
      setScanningId(null);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-secondary">Dashboard</span>
          <span className="text-secondary">›</span>
          <span className="text-primary">Monitoring & Evaluasi</span>
        </nav>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight">
          Data Laporan Monev
        </h2>
        <p className="text-secondary text-sm mt-1">
          Pantau kelengkapan dokumen evaluasi ekonomi mahasiswa KIP-Kuliah
          secara real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-10" />
          <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">
            Total Target
          </p>
          <p className="text-3xl font-extrabold text-primary">
            {stats.total.toLocaleString("id-ID")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10" />
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
            Sudah Mengisi
          </p>
          <p className="text-3xl font-extrabold text-emerald-600">
            {stats.sudah.toLocaleString("id-ID")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-amber-100 p-5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10" />
          <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
            Belum Mengisi
          </p>
          <p className="text-3xl font-extrabold text-amber-600">
            {stats.belum.toLocaleString("id-ID")}
          </p>
        </motion.div>
      </div>

      {/* --- TOOLBAR dengan Tombol Scan Massal --- */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIM atau Nama..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>

        <button
          onClick={handleScanAll}
          disabled={isScanningAll}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isScanningAll ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Memindai AI...
            </>
          ) : (
            <>
              <ScanSearch size={16} /> Scan AI Massal
            </>
          )}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto">
          {/* Tabel dirampingkan karena Aksi dihapus */}
          <table className="w-full text-sm text-left min-w-[1100px]">
            <thead className="bg-primary/5 border-b border-slate-200 text-secondary">
              <tr>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] w-12 text-center">
                  No
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Identitas Mahasiswa
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-blue-50/50">
                  Data Ayah
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-rose-50/50">
                  Data Ibu
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-amber-50/50">
                  Lainnya & KK
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Kalkulasi Sistem
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="inline-flex items-center gap-3 text-secondary">
                      <Loader2
                        size={20}
                        className="animate-spin text-primary"
                      />
                      <span className="text-sm font-medium">
                        Memuat data monev...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-slate-500 text-sm"
                  >
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-5 py-4 text-xs font-mono text-slate-400 text-center">
                      {(page - 1) * 50 + idx + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800 text-sm mb-0.5">
                        {m.nama}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-primary bg-primary/5 px-1.5 rounded">
                          {m.nim}
                        </span>
                        <span className="text-secondary truncate max-w-[150px]">
                          {m.prodi}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 bg-blue-50/20">
                      <p className="font-semibold text-slate-700 text-xs mb-1">
                        {m.pekerjaan_ayah}
                      </p>
                      <p className="text-sm font-bold text-slate-800 mb-2">
                        {formatRp(m.penghasilan_ayah)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {m.url_bukti_ayah.kerja && (
                          <Link
                            href={m.url_bukti_ayah.kerja}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </Link>
                        )}
                        {m.url_bukti_ayah.gaji && (
                          <Link
                            href={m.url_bukti_ayah.gaji}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                          >
                            <FileImage size={12} /> Gaji
                          </Link>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 bg-rose-50/20">
                      <p className="font-semibold text-slate-700 text-xs mb-1">
                        {m.pekerjaan_ibu}
                      </p>
                      <p className="text-sm font-bold text-slate-800 mb-2">
                        {formatRp(m.penghasilan_ibu)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {m.url_bukti_ibu.kerja && (
                          <Link
                            href={m.url_bukti_ibu.kerja}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded hover:bg-rose-200 transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </Link>
                        )}
                        {m.url_bukti_ibu.gaji && (
                          <Link
                            href={m.url_bukti_ibu.gaji}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 transition-colors"
                          >
                            <FileImage size={12} /> Gaji
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* --- BAGIAN LAINNYA & YOLO --- */}
                    <td className="px-5 py-4 bg-amber-50/20 min-w-[200px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-secondary">
                          Pend. Lain:
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {formatRp(m.penghasilan_lain)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-secondary">
                          Tanggungan:
                        </span>
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                          <Users size={12} /> {m.jumlah_tanggungan}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-amber-200/50">
                        {m.url_scan_kk && (
                          <Link
                            href={m.url_scan_kk}
                            target="_blank"
                            className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1.5 rounded hover:bg-amber-200 transition-colors border border-amber-200"
                            title="Lihat Kartu Keluarga"
                          >
                            <ExternalLink size={12} /> Lihat KK
                          </Link>
                        )}

                        {/* LOGIKA YOLO */}
                        {m.hasil_deteksi_yolo === null ? (
                          <button
                            onClick={() => handleScanSingle(m.id)}
                            disabled={scanningId === m.id || isScanningAll}
                            className="inline-flex w-full justify-center items-center gap-1.5 text-[10px] font-bold bg-white text-slate-600 px-2 py-1.5 rounded border border-slate-300 hover:bg-slate-100 hover:text-primary transition-colors disabled:opacity-50"
                          >
                            {scanningId === m.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />{" "}
                                Memproses...
                              </>
                            ) : (
                              <>
                                <ScanSearch size={12} /> Pindai AI
                              </>
                            )}
                          </button>
                        ) : m.hasil_deteksi_yolo === 0 ? (
                          <div className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1.5 rounded border border-slate-300">
                            <FileQuestion size={12} className="shrink-0" />{" "}
                            Gambar tak terdeteksi AI
                          </div>
                        ) : (
                          <div
                            className={`inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded border ${
                              m.hasil_deteksi_yolo !== m.jumlah_tanggungan
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {m.hasil_deteksi_yolo !== m.jumlah_tanggungan ? (
                              <>
                                <AlertCircle size={12} className="shrink-0" />{" "}
                                Beda: AI ({m.hasil_deteksi_yolo}) vs Input (
                                {m.jumlah_tanggungan})
                              </>
                            ) : (
                              <>
                                <ScanSearch size={12} className="shrink-0" />{" "}
                                Sesuai (Lolos AI)
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 bg-slate-50">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-secondary font-semibold uppercase">
                            Total Pendapatan
                          </p>
                          <p className="font-bold text-primary text-sm">
                            {formatRp(m.total_pendapatan)}
                          </p>
                        </div>
                        <div className="border-t border-slate-200 pt-1.5">
                          <p className="text-[10px] text-secondary font-semibold uppercase">
                            Rp / Tanggungan
                          </p>
                          <p className="font-extrabold text-primary text-sm">
                            {formatRp(m.rupiah_per_tanggungan)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {m.status_pengisian === "Sudah" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={14} /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                          <Clock size={14} /> Belum
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- KONTROL PAGINATION BAWAH --- */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <p className="text-xs font-medium text-secondary">
              Halaman <span className="font-bold text-primary">{page}</span>{" "}
              dari <span className="font-bold text-primary">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold border border-slate-300 bg-white text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold border border-slate-300 bg-white text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors shadow-sm"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
