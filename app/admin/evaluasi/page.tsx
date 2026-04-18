"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, ChevronRight, CheckCircle2, Clock, Filter, Loader2 } from "lucide-react";

export type EvaluasiStatus = "selesai" | "belum";

export interface MahasiswaEvaluasi {
  id: string;
  no: number;
  no_pendaftaran_kipk: string;
  nama: string;
  prodi: string;
  nik: string;
  no_hp: string;
  email: string;
  hasil_akhir: number | null;
  alasan: string;
  pewawancara: string;
}

type FilterStatus = "semua" | "selesai" | "belum";

function getStatus(m: MahasiswaEvaluasi): EvaluasiStatus {
  return m.hasil_akhir && m.pewawancara ? "selesai" : "belum";
}

function hasilAkhirBadge(v: number | null) {
  if (!v) return <span className="text-muted-foreground italic text-xs">Belum diisi</span>;
  const map: Record<number, { label: string; cls: string }> = {
    1: { label: "Layak",           cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    2: { label: "Dipertimbangkan", cls: "bg-amber-50 text-amber-700 border-amber-200"       },
    3: { label: "Tidak Layak",     cls: "bg-red-50 text-red-700 border-red-200"             },
  };
  const item = map[v];
  if (!item) return <span className="text-muted-foreground italic text-xs">—</span>;
  return <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${item.cls}`}>{item.label}</span>;
}

export default function EvaluasiPage() {
  const [data, setData]       = useState<MahasiswaEvaluasi[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState<FilterStatus>("semua");
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSelesai, setTotalSelesai] = useState(0);
  const [totalBelum, setTotalBelum]     = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        filter,
        page: String(page),
      });
      const res  = await fetch(`/api/admin/evaluasi?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
      setTotalSelesai(json.totalSelesai ?? 0);
      setTotalBelum(json.totalBelum ?? 0);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  // Reset page saat filter/search berubah
  useEffect(() => { setPage(1); }, [search, filter]);

  const selesaiCount = data.filter((m) => getStatus(m) === "selesai").length;
  const belumCount   = data.length - selesaiCount;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary">Evaluasi Wawancara</span>
        </nav>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
          Evaluasi Wawancara
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pantau dan validasi hasil wawancara yang diisi oleh pewawancara.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Mahasiswa",  value: total,        color: "text-primary",     bg: "bg-primary/8"  },
          { label: "Sudah Dievaluasi", value: totalSelesai, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Belum Dievaluasi", value: totalBelum,   color: "text-amber-600",   bg: "bg-amber-50"   },
        ].map(({ label, value, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`${bg} rounded-2xl border border-border p-4 shadow-sm`}>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-extrabold font-headline ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. pendaftaran, atau prodi..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl">
          <Filter size={13} className="text-muted-foreground ml-2" />
          {(["semua", "selesai", "belum"] as FilterStatus[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {f === "semua" ? "Semua" : f === "selesai" ? "Sudah" : "Belum"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  {["No", "Nama", "Prodi", "Pewawancara", "Hasil Akhir", "Status", "Aksi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((m, idx) => {
                  const status = getStatus(m);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface text-sm">{m.nama}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{m.no_pendaftaran_kipk}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{m.prodi}</td>
                      <td className="px-4 py-3 text-xs text-on-surface">
                        {m.pewawancara || <span className="text-muted-foreground italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {hasilAkhirBadge(m.hasil_akhir)}
                      </td>
                      <td className="px-4 py-3">
                        {status === "selesai" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={11} /> Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock size={11} /> Menunggu
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/evaluasi/${m.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                          Lihat Evaluasi <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && data.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Tidak ada data. Pastikan sudah import data kandidat terlebih dahulu.
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
