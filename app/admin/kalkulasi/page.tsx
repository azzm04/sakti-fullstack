"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Kandidat {
  id: string;
  no: number;
  no_pendaftaran_kipk: string;
  nama: string;
  prodi: string;
  nik: string;
  no_hp: string;
  email: string;
  penghasilan_ayah: number;
  penghasilan_ibu: number;
  jumlah_tanggungan: number;
  nominal_per_kapita: number;
  rekomendasi: string;
  pewawancara: string;
  hasErrors: boolean;
  importBatchId: string | null;
  createdAt: string;
}

interface Batch {
  id: string;
  fileName: string;
  createdAt: string;
  totalRows: number;
}

interface ApiResponse {
  data: Kandidat[];
  total: number;
  page: number;
  totalPages: number;
  batches: Batch[];
}

const PAGE_SIZE = 10;
const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

// ── Component ─────────────────────────────────────────────────────────────────
export default function KalkulasiPage() {
  const [data, setData]           = useState<Kandidat[]>([]);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [batches, setBatches]     = useState<Batch[]>([]);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page:    String(page),
        limit:   String(PAGE_SIZE),
        ...(search      ? { search }      : {}),
        ...(selectedBatch ? { batchId: selectedBatch } : {}),
      });
      const res = await fetch(`/api/kandidat?${params}`);
      if (!res.ok) throw new Error("Gagal mengambil data");
      const json: ApiResponse = await res.json();
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setBatches(json.batches);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedBatch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const statusBadge = (rekomendasi: string) => {
    const r = rekomendasi.toLowerCase();
    if (r.includes("layak") && !r.includes("tidak") && !r.includes("pertimbang")) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">LAYAK</span>;
    }
    if (r.includes("pertimbang") || r.includes("dipertimbangkan")) {
      return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">DIPERTIMBANGKAN</span>;
    }
    if (r.includes("tidak")) {
      return <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">TIDAK LAYAK</span>;
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">BELUM DIISI</span>;
  };

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f7f9fb]">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        <span>Management</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span>Selection Process</span>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-primary">Data Kandidat</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">
            Data Kandidat KIPK
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Data kandidat yang telah diimport dan tersimpan di database
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Report
          </button>
          <Link href="/admin/import">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
              <span className="material-symbols-outlined text-lg">upload_file</span>
              Import Data Baru
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Left Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-5">

          {/* Stats Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-slate-600">bar_chart</span>
              <h3 className="font-bold text-slate-800">Ringkasan Data</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Kandidat</p>
                <p className="text-3xl font-extrabold text-primary">{total.toLocaleString("id-ID")}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Batch Import</p>
                <p className="text-3xl font-extrabold text-slate-700">{batches.length}</p>
              </div>
            </div>
          </div>

          {/* Filter Batch */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-500 text-lg">filter_list</span>
              Filter Batch Import
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedBatch(""); setPage(1); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                  !selectedBatch ? "bg-primary text-white font-semibold" : "hover:bg-slate-50 text-slate-600"
                }`}
              >
                Semua Batch ({total} kandidat)
              </button>
              {batches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { setSelectedBatch(b.id); setPage(1); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${
                    selectedBatch === b.id ? "bg-primary text-white font-semibold" : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  <p className="font-medium truncate">{b.fileName}</p>
                  <p className={`text-[10px] mt-0.5 ${selectedBatch === b.id ? "text-white/70" : "text-slate-400"}`}>
                    {b.totalRows} baris · {new Date(b.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </button>
              ))}
              {batches.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada data import</p>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-2">Data Pipeline</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Data kandidat yang tersimpan siap untuk tahap verifikasi wawancara dan kalkulasi SMART-TOPSIS.
            </p>
            <div className="space-y-2">
              {["Import Excel ✓", "Simpan Database ✓", "Verifikasi Wawancara", "Kalkulasi TOPSIS"].map((step, i) => (
                <div key={step} className={`flex items-center gap-2 text-sm ${i < 2 ? "text-emerald-400" : "text-slate-500"}`}>
                  <span className="material-symbols-outlined text-sm">
                    {i < 2 ? "check_circle" : "radio_button_unchecked"}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel — Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            {/* Table Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {["Semua", "Layak", "Dipertimbangkan"].map((tab) => (
                    <button key={tab} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      tab === "Semua" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                    }`}>
                      {tab}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400">
                  {loading ? "Memuat..." : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} dari ${total.toLocaleString("id-ID")}`}
                </span>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama, NIK, prodi..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-56 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                />
              </form>
            </div>

            {/* Column Headers */}
            <div className="grid grid-cols-[3rem_1fr_5rem_6rem_4rem] px-6 py-3 bg-slate-50 border-b border-slate-100">
              {["RANK", "KANDIDAT", "PENGHASILAN", "STATUS", "AKSI"].map((h) => (
                <span key={h} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[3rem_1fr_5rem_6rem_4rem] px-6 py-4 animate-pulse">
                    <div className="w-8 h-8 bg-slate-100 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-100 rounded w-32" />
                      <div className="h-2 bg-slate-100 rounded w-20" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-16 self-center" />
                    <div className="h-6 bg-slate-100 rounded-full w-16 self-center" />
                    <div className="w-6 h-6 bg-slate-100 rounded self-center" />
                  </div>
                ))
              ) : error ? (
                <div className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-red-300 mb-3 block">error</span>
                  <p className="text-sm text-slate-500">{error}</p>
                  <button onClick={fetchData} className="mt-3 text-xs text-primary font-semibold hover:underline">
                    Coba lagi
                  </button>
                </div>
              ) : data.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">inbox</span>
                  <p className="text-sm text-slate-500">Belum ada data kandidat</p>
                  <Link href="/admin/import" className="mt-3 text-xs text-primary font-semibold hover:underline block">
                    Import data sekarang →
                  </Link>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {data.map((k, idx) => {
                    const rank = (page - 1) * PAGE_SIZE + idx + 1;
                    const totalPenghasilan = k.penghasilan_ayah + k.penghasilan_ibu;
                    return (
                      <motion.div
                        key={k.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="grid grid-cols-[3rem_1fr_5rem_6rem_4rem] px-6 py-4 hover:bg-slate-50/60 transition-colors items-center"
                      >
                        {/* Rank */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          rank <= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {String(rank).padStart(2, "0")}
                        </div>

                        {/* Kandidat */}
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-slate-800 text-sm truncate">{k.nama}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{k.prodi}</p>
                          <p className="text-[10px] text-slate-300 font-mono">ID: {k.no_pendaftaran_kipk || k.nik}</p>
                        </div>

                        {/* Penghasilan */}
                        <div className="text-xs text-slate-600 font-medium">
                          {totalPenghasilan > 0
                            ? fmt.format(totalPenghasilan)
                            : <span className="text-slate-300">—</span>
                          }
                        </div>

                        {/* Status */}
                        <div>{statusBadge(k.rekomendasi)}</div>

                        {/* Aksi */}
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-center gap-1">
                <button onClick={() => goTo(page - 1)} disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400">…</span>
                    ) : (
                      <button key={p} onClick={() => goTo(p as number)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                          page === p ? "bg-primary text-white" : "text-slate-600 hover:bg-slate-100"
                        }`}>
                        {p}
                      </button>
                    )
                  )}

                <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 transition-colors">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
