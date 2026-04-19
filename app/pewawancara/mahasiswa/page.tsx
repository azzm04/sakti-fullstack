"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronRight, CheckCircle2, Clock, Loader2,
  User, CalendarDays, Users, Lock, AlertTriangle,
} from "lucide-react";

import type { MahasiswaListItem, MahasiswaApiResponse } from "@/schemas";

type Mode = "saya" | "hari_ini" | "semua";

const MODE_CONFIG: { key: Mode; label: string; icon: React.ElementType; desc: string }[] = [
  { key: "saya",     label: "Jatah Saya",  icon: User,         desc: "MahasiswaListItem yang ditugaskan ke kamu" },
  { key: "hari_ini", label: "Hari Ini",    icon: CalendarDays, desc: "Semua MahasiswaListItem terjadwal hari ini" },
  { key: "semua",    label: "Semua",       icon: Users,        desc: "Seluruh kandidat" },
];

export default function PewawancaraMahasiswaPage() {
  const [mode, setMode]         = useState<Mode>("saya");
  const [data, setData]         = useState<MahasiswaListItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [jatahSelesai, setJatahSelesai] = useState(0);
  const [jatahTotal, setJatahTotal]     = useState(0);
  const [jatahSudahSelesai, setJatahSudahSelesai] = useState(false);
  const [locked, setLocked]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLocked(false);
    try {
      const params = new URLSearchParams({ mode, search, page: String(page) });
      const res  = await fetch(`/api/pewawancara/MahasiswaListItem?${params}`);
      const json: MahasiswaApiResponse = await res.json();

      if (res.status === 403 && json.locked) {
        setLocked(true);
        setData([]);
        setTotal(0);
        setJatahSelesai(json.jatah_selesai ?? 0);
        setJatahTotal(json.jatah_total ?? 0);
        return;
      }

      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
      setJatahSelesai(json.jatah_selesai ?? 0);
      setJatahTotal(json.jatah_total ?? 0);
      setJatahSudahSelesai(json.jatah_sudah_selesai ?? false);
    } finally {
      setLoading(false);
    }
  }, [mode, search, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  useEffect(() => { setPage(1); }, [mode, search]);

  const selesaiCount = data.filter((m) => m.rekomendasi && m.pewawancara).length;
  const progressPct  = jatahTotal > 0 ? Math.round((jatahSelesai / jatahTotal) * 100) : 0;

  return (
    <div className="p-6 md:p-8">

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-primary font-headline">Daftar MahasiswaListItem</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Jatah kamu: <span className="font-semibold text-on-surface">{jatahSelesai}/{jatahTotal}</span> selesai
        </p>
      </div>

      {/* Progress jatah sendiri */}
      {jatahTotal > 0 && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 mb-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground">Progress Jatah Saya</p>
            <span className={`text-xs font-bold ${jatahSudahSelesai ? "text-emerald-600" : "text-primary"}`}>
              {progressPct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${jatahSudahSelesai ? "bg-emerald-500" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {jatahSudahSelesai && (
            <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
              <CheckCircle2 size={11} />
              Semua jatah selesai — kamu bisa membantu wawancara MahasiswaListItem lain
            </p>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-white border border-border rounded-xl w-fit mb-5 shadow-sm">
        {MODE_CONFIG.map(({ key, label, icon: Icon }) => {
          const isLocked = (key === "hari_ini" || key === "semua") && !jatahSudahSelesai;
          return (
            <button
              key={key}
              onClick={() => !isLocked && setMode(key)}
              title={isLocked ? "Selesaikan jatahmu terlebih dahulu" : label}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === key
                  ? "bg-primary text-white shadow-sm"
                  : isLocked
                  ? "text-slate-300 cursor-not-allowed"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isLocked ? <Lock size={12} /> : <Icon size={13} />}
              {label}
            </button>
          );
        })}
      </div>

      {/* Deskripsi mode aktif */}
      <p className="text-xs text-muted-foreground mb-4">
        {MODE_CONFIG.find((m) => m.key === mode)?.desc}
        {mode !== "saya" && (
          <span className="ml-1 text-slate-400">· {total} MahasiswaListItem</span>
        )}
      </p>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau no. pendaftaran..."
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary transition-all"
        />
      </div>

      {/* Locked state */}
      <AnimatePresence>
        {locked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lock size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-800">Fitur Terkunci</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Selesaikan semua wawancara jatahmu terlebih dahulu sebelum bisa melihat MahasiswaListItem lain.
              </p>
              <p className="text-xs text-amber-600 mt-1 font-semibold">
                Progress: {jatahSelesai} / {jatahTotal} selesai
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Memuat...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                {["No Urut", "Nama", "Prodi", "Pewawancara", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((m) => {
                const done = !!(m.rekomendasi && m.pewawancara);
                const isOwnJatah = m.pewawancara_id !== null;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold font-mono text-slate-500">#{m.no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{m.nama}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{m.no_pendaftaran_kipk}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{m.prodi}</td>
                    <td className="px-4 py-3">
                      {m.pewawancara ? (
                        <p className="text-xs text-slate-600 truncate max-w-[120px]">{m.pewawancara}</p>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {done ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock size={11} /> Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* Mode hari_ini/semua: hanya tampilkan aksi untuk yang belum selesai */}
                      {(mode === "saya" || !done) ? (
                        <Link
                          href={`/pewawancara/MahasiswaListItem/${m.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {done ? "Lihat" : "Isi Evaluasi"} <ChevronRight size={13} />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && !locked && data.length === 0 && (
          <div className="py-12 text-center">
            {mode === "saya" ? (
              <>
                <User size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada MahasiswaListItem yang ditugaskan ke kamu.</p>
                <p className="text-xs text-slate-400 mt-1">Tunggu admin melakukan distribusi setelah WAR selesai.</p>
              </>
            ) : mode === "hari_ini" ? (
              <>
                <CalendarDays size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada MahasiswaListItem terjadwal hari ini.</p>
              </>
            ) : (
              <>
                <Users size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada data kandidat.</p>
              </>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages} · {total} total</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
