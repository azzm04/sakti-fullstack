"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Play, Loader2, Trophy, CheckCircle2,
  XCircle, AlertTriangle, Filter, Download,
} from "lucide-react";

import type { KandidatResult } from "@/schemas";

type FilterView = "semua" | "lolos" | "tidak_lolos";
type Jalur = "SNBP" | "SNBT" | "UM";

const JALUR_OPTIONS: Jalur[] = ["SNBP", "SNBT", "UM"];

const JALUR_COLOR: Record<Jalur, string> = {
  SNBP: "bg-blue-50 text-blue-700 border-blue-200",
  SNBT: "bg-purple-50 text-purple-700 border-purple-200",
  UM:   "bg-orange-50 text-orange-700 border-orange-200",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function KalkulasiPage() {
  // Kuota per jalur
  const [kuota, setKuota] = useState<Record<Jalur, string>>({ SNBP: "", SNBT: "", UM: "" });
  const [jalurAktif, setJalurAktif] = useState<Jalur>("SNBP");

  // State hasil
  const [results, setResults]   = useState<KandidatResult[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [hasRun, setHasRun]     = useState(false);
  const [filter, setFilter]     = useState<FilterView>("semua");
  const [apiUrl, setApiUrl]     = useState(process.env.NEXT_PUBLIC_TOPSIS_API_URL ?? "");

  const totalKuota = JALUR_OPTIONS.reduce((sum, j) => sum + (parseInt(kuota[j]) || 0), 0);

  const handleRun = useCallback(async () => {
    if (!apiUrl) { setError("URL API SMART-TOPSIS belum diisi"); return; }
    if (totalKuota === 0) { setError("Isi minimal satu kuota jalur masuk"); return; }

    setLoading(true);
    setError("");

    try {
      // Kirim via proxy route Next.js (menghindari CORS)
      const res = await fetch("/api/admin/kalkulasi/topsis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiUrl,
          kuota: {
            SNBP: parseInt(kuota.SNBP) || 0,
            SNBT: parseInt(kuota.SNBT) || 0,
            UM:   parseInt(kuota.UM)   || 0,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Gagal menjalankan kalkulasi"); return; }

      // Normalisasi response — support berbagai format FastAPI
      const ranked: KandidatResult[] = (Array.isArray(json) ? json : json.data ?? json.hasil ?? [])
        .map((item: Record<string, unknown>, idx: number) => ({
          id:                  item.id,
          no:                  item.no,
          no_pendaftaran_kipk: item.no_pendaftaran_kipk,
          nama:                item.nama,
          prodi:               item.prodi,
          jalur_masuk:         item.jalur_masuk ?? "",
          skor_total:          Number(item.skor ?? item.skor_total ?? item.score ?? 0),
          ranking:             Number(item.ranking ?? item.rank ?? idx + 1),
          lolos:               Boolean(item.lolos ?? (item.status === "lolos")),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjalankan kalkulasi");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, kuota, totalKuota]);

  // Filter data
  const filtered = results.filter((r) => {
    if (filter === "lolos") return r.lolos;
    if (filter === "tidak_lolos") return !r.lolos;
    return true;
  });

  const lolosCount     = results.filter((r) => r.lolos).length;
  const tidakLolosCount = results.length - lolosCount;

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f7f9fb]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        <span>Management</span>
        <span>›</span>
        <span className="text-primary">Kalkulasi SMART-TOPSIS</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">
          Kalkulasi SMART-TOPSIS
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Jalankan perankingan kandidat KIPK berdasarkan hasil wawancara
        </p>
      </div>

      {/* ── Panel konfigurasi ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* Kuota per jalur */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
            <Calculator size={15} className="text-primary" />
            Kuota KIPK per Jalur Masuk
          </h3>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {JALUR_OPTIONS.map((j) => (
              <div key={j}>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Jalur {j}
                </label>
                <input
                  type="number"
                  min={0}
                  value={kuota[j]}
                  onChange={(e) => setKuota((k) => ({ ...k, [j]: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 transition-all"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
            <span>Total kuota</span>
            <span className="font-bold text-slate-700">{totalKuota} mahasiswa</span>
          </div>
        </div>

        {/* API URL + tombol run */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">URL API SMART-TOPSIS</label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api-topsis.example.com/rank"
              className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 font-mono transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl border border-red-200">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={loading || !apiUrl || totalKuota === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm mt-auto"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Menghitung..." : "Jalankan SMART-TOPSIS"}
          </button>
        </div>
      </div>

      {/* ── Hasil ── */}
      {hasRun && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total Kandidat",  value: results.length,   color: "text-primary"     },
              { label: "Lolos",           value: lolosCount,       color: "text-emerald-600" },
              { label: "Tidak Lolos",     value: tidakLolosCount,  color: "text-red-500"     },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter + tabel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-xl">
                <Filter size={12} className="text-slate-400 ml-1.5" />
                {([
                  { key: "semua",       label: "Semua"       },
                  { key: "lolos",       label: "Lolos"       },
                  { key: "tidak_lolos", label: "Tidak Lolos" },
                ] as { key: FilterView; label: string }[]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filter === key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filter jalur */}
              <div className="flex gap-1">
                {JALUR_OPTIONS.map((j) => (
                  <button
                    key={j}
                    onClick={() => setJalurAktif(j)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      jalurAktif === j
                        ? JALUR_COLOR[j]
                        : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {j}
                  </button>
                ))}
                <button
                  onClick={() => setJalurAktif("" as Jalur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    !jalurAktif ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"
                  }`}
                >
                  Semua Jalur
                </button>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Rank", "Kandidat", "Prodi", "Jalur", "Skor", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered
                  .filter((r) => !jalurAktif || r.jalur_masuk === jalurAktif)
                  .map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                          r.ranking <= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          {r.ranking <= 3 ? <Trophy size={13} /> : String(r.ranking).padStart(2, "0")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{r.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{r.no_pendaftaran_kipk}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[160px] truncate">{r.prodi}</td>
                      <td className="px-4 py-3">
                        {r.jalur_masuk ? (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            JALUR_COLOR[r.jalur_masuk as Jalur] ?? "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {r.jalur_masuk}
                          </span>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min((r.skor_total <= 1 ? r.skor_total * 100 : r.skor_total), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {(r.skor_total <= 1 ? r.skor_total * 100 : r.skor_total).toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.lolos ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 size={11} /> LOLOS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                            <XCircle size={11} /> TIDAK LOLOS
                          </span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">Tidak ada data untuk filter ini</div>
            )}
          </div>
        </motion.div>
      )}

      {!hasRun && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <Calculator size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">Belum ada hasil kalkulasi</p>
          <p className="text-xs text-slate-300">Isi kuota dan URL API, lalu klik "Jalankan SMART-TOPSIS"</p>
        </div>
      )}
    </div>
  );
}
