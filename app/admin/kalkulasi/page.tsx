"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  Play,
  Loader2,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Users,
  Settings2,
} from "lucide-react";

import type { KandidatResult } from "@/schemas";

type FilterView = "semua" | "lolos" | "tidak_lolos";
type Jalur = "SNBP" | "SNBT" | "UM";

const JALUR_OPTIONS: Jalur[] = ["SNBP", "SNBT", "UM"];

const JALUR_COLOR: Record<Jalur, string> = {
  SNBP: "bg-blue-50 text-blue-700 border-blue-200",
  SNBT: "bg-purple-50 text-purple-700 border-purple-200",
  UM: "bg-orange-50 text-orange-700 border-orange-200",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function KalkulasiPage() {
  // Pilih 1 jalur untuk diproses
  const [jalurTerpilih, setJalurTerpilih] = useState<Jalur>("SNBP");
  const [kuotaTerpilih, setKuotaTerpilih] = useState<string>("");

  // State hasil
  const [results, setResults] = useState<KandidatResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [filter, setFilter] = useState<FilterView>("semua");
  const [jalurAktif, setJalurAktif] = useState<Jalur | "">("SNBP");

  const handleRun = useCallback(async () => {
    if (!jalurTerpilih) {
      setError("Pilih jalur masuk terlebih dahulu");
      return;
    }
    if (!kuotaTerpilih || parseInt(kuotaTerpilih) === 0) {
      setError("Isi kuota untuk jalur yang dipilih");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Kirim via proxy route Next.js (menghindari CORS)
      const res = await fetch("/api/admin/kalkulasi/topsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jalur_masuk: jalurTerpilih,
          kuota: parseInt(kuotaTerpilih),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menjalankan kalkulasi");
        return;
      }

      // Normalisasi response — support berbagai format FastAPI
      const ranked: KandidatResult[] = (
        Array.isArray(json) ? json : (json.data ?? json.hasil ?? [])
      ).map((item: Record<string, unknown>, idx: number) => ({
        id: item.id,
        no: item.no,
        no_pendaftaran_kipk: item.no_pendaftaran_kipk,
        nama: item.nama,
        prodi: item.prodi,
        jalur_masuk: item.jalur_masuk ?? "",
        skor_total: Number(item.skor ?? item.skor_total ?? item.score ?? 0),
        ranking: Number(item.ranking ?? item.rank ?? idx + 1),
        lolos: Boolean(item.lolos ?? item.status === "lolos"),
      }));

      // Simpan skor & ranking ke DB
      if (ranked.length > 0) {
        await fetch("/api/admin/kalkulasi/simpan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hasil: ranked }),
        });
      }

      setResults(ranked);
      setHasRun(true);
      setJalurAktif(jalurTerpilih); // Auto-filter ke jalur yang baru di-run
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menjalankan kalkulasi",
      );
    } finally {
      setLoading(false);
    }
  }, [jalurTerpilih, kuotaTerpilih]);

  // Filter data
  const filtered = results.filter((r) => {
    const matchStatus =
      filter === "semua" ? true : filter === "lolos" ? r.lolos : !r.lolos;
    const matchJalur = jalurAktif === "" ? true : r.jalur_masuk === jalurAktif;
    return matchStatus && matchJalur;
  });

  const lolosCount = results.filter((r) => r.lolos).length;
  const tidakLolosCount = results.length - lolosCount;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900">Kalkulasi SMART-TOPSIS</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                Kalkulasi SMART-TOPSIS
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Jalankan perankingan kandidat KIPK berdasarkan hasil wawancara
                lapangan.
              </p>
            </div>
          </div>
        </div>

        {/* ── Panel Konfigurasi Unified ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-primary rounded-lg">
                <Settings2 size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">
                Parameter Perankingan
              </h3>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200 mb-6"
              >
                <AlertTriangle size={16} /> {error}
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              {/* Pemilihan Jalur (Segmented Control) */}
              <div className="md:col-span-5">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Jalur Masuk
                </label>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {JALUR_OPTIONS.map((j) => (
                    <button
                      key={j}
                      onClick={() => setJalurTerpilih(j)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        jalurTerpilih === j
                          ? "bg-white text-primary shadow-sm"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Kuota */}
              <div className="md:col-span-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Kuota Penerimaan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={kuotaTerpilih}
                    onChange={(e) => setKuotaTerpilih(e.target.value)}
                    placeholder="Contoh: 40"
                    className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Tombol Run */}
              <div className="md:col-span-3">
                <button
                  onClick={handleRun}
                  disabled={loading || !jalurTerpilih || !kuotaTerpilih}
                  className="w-full h-12.5 flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-600 focus:ring-4 focus:ring-indigo-500/20 disabled:opacity-50 disabled:hover:bg-slate-900 transition-all shadow-sm"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} className="fill-current" />
                  )}
                  {loading ? "Memproses..." : "Mulai Kalkulasi"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Hasil ── */}
        <AnimatePresence mode="wait">
          {!hasRun && !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white/50 border border-slate-200 border-dashed rounded-3xl py-24 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
                <Calculator size={32} />
              </div>
              <h4 className="text-slate-900 font-bold text-lg mb-1">
                Siap untuk dikalkulasi
              </h4>
              <p className="text-slate-500 text-sm max-w-sm">
                Tentukan jalur masuk dan jumlah kuota di atas, lalu klik <strong>Mulai Kalkulasi</strong> untuk melihat hasil perankingan.
                Kalkulasi untuk melihat hasil perankingan.
              </p>
            </motion.div>
          ) : hasRun ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: "Total Kandidat",
                    value: results.length,
                    icon: Users,
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                  },
                  {
                    label: "Lolos Seleksi",
                    value: lolosCount,
                    icon: CheckCircle2,
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Tidak Lolos",
                    value: tidakLolosCount,
                    icon: XCircle,
                    color: "text-red-500",
                    bg: "bg-red-50",
                  },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-4"
                  >
                    <div className={`p-3 rounded-xl ${bg} ${color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {label}
                      </p>
                      <p className={`text-2xl font-bold mt-0.5 ${color}`}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Card */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Toolbar */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Status Filter */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
                    {(
                      [
                        { key: "semua", label: "Semua" },
                        { key: "lolos", label: "Lolos" },
                        { key: "tidak_lolos", label: "Tidak Lolos" },
                      ] as { key: FilterView; label: string }[]
                    ).map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          filter === key
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Jalur Filter (Pill style) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
                    <span className="text-xs font-semibold text-slate-400 mr-1">
                      <Filter size={14} className="inline mr-1" /> Jalur:
                    </span>
                    <button
                      onClick={() => setJalurAktif("")}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                        jalurAktif === ""
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Semua
                    </button>
                    {JALUR_OPTIONS.map((j) => (
                      <button
                        key={j}
                        onClick={() => setJalurAktif(j)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                          jalurAktif === j
                            ? JALUR_COLOR[j]
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {j}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-16">
                          Rank
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Kandidat
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Prodi
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Jalur
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Skor TOPSIS
                        </th>
                        <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <AnimatePresence>
                        {filtered.length > 0 ? (
                          filtered.map((r, i) => (
                            <motion.tr
                              key={r.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-slate-50/80 transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                    r.ranking <= 3
                                      ? "bg-amber-100 text-amber-600"
                                      : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                                  }`}
                                >
                                  {r.ranking <= 3 ? (
                                    <Trophy size={14} />
                                  ) : (
                                    r.ranking
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">
                                  {r.nama}
                                </p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5">
                                  {r.no_pendaftaran_kipk}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex text-slate-600 text-sm">
                                  {r.prodi}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {r.jalur_masuk ? (
                                  <span
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${JALUR_COLOR[r.jalur_masuk as Jalur]}`}
                                  >
                                    {r.jalur_masuk}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-sm font-semibold text-slate-700 w-8">
                                    {(r.skor_total <= 1
                                      ? r.skor_total * 100
                                      : r.skor_total
                                    ).toFixed(1)}
                                  </span>
                                  <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(r.skor_total <= 1 ? r.skor_total * 100 : r.skor_total, 100)}%`,
                                      }}
                                      transition={{
                                        duration: 1,
                                        ease: "easeOut",
                                      }}
                                      className="h-full bg-indigo-500 rounded-full"
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {r.lolos ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700">
                                    <CheckCircle2 size={14} /> Lolos
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-red-50 text-red-600">
                                    <XCircle size={14} /> Gugur
                                  </span>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center">
                              <p className="text-slate-500 font-medium">
                                Tidak ada kandidat yang cocok dengan filter.
                              </p>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
