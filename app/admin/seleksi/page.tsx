"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Loader2, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";

interface RankedKandidat {
  rank: number;
  id: string | number;
  nama: string;
  prodi: string;
  no_pendaftaran_kipk: string;
  skor: number;           // field dari API teman (sesuaikan jika beda)
  rekomendasi?: string;
  [key: string]: unknown; // fleksibel untuk field tambahan
}

interface ApiResult {
  data: RankedKandidat[];
  total?: number;
  [key: string]: unknown;
}

// ── Ganti URL ini dengan endpoint SMART-TOPSIS dari teman kamu ──
const TOPSIS_API_URL = process.env.NEXT_PUBLIC_TOPSIS_API_URL ?? "";

export default function SeleksiPage() {
  const [data, setData] = useState<RankedKandidat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState(TOPSIS_API_URL);

  async function fetchHasil() {
    if (!apiUrl) {
      setError("URL API SMART-TOPSIS belum diisi");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json: ApiResult = await res.json();

      // Fleksibel: support { data: [...] } atau langsung array
      const rows = Array.isArray(json) ? json : (json.data ?? []);
      setData(rows as RankedKandidat[]);
      setTotal(Array.isArray(json) ? json.length : (json.total as number ?? rows.length));
      setLastFetch(new Date().toLocaleTimeString("id-ID"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data dari API");
    } finally {
      setLoading(false);
    }
  }

  function rekomendasiBadge(r?: string) {
    if (!r) return null;
    const lower = r.toLowerCase();
    if (lower.includes("diusulkan") && !lower.includes("tidak")) {
      return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">DIUSULKAN</span>;
    }
    if (lower.includes("tidak")) {
      return <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-200">TIDAK DIUSULKAN</span>;
    }
    return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded-full border border-amber-200">DIPERTIMBANGKAN</span>;
  }

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f7f9fb]">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        <span>Management</span>
        <span>›</span>
        <span className="text-primary">Hasil Seleksi SMART-TOPSIS</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">
            Hasil Seleksi
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Perankingan kandidat KIPK dari API SMART-TOPSIS
          </p>
        </div>
        <button
          onClick={fetchHasil}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          {loading ? "Mengambil data..." : "Ambil Hasil"}
        </button>
      </div>

      {/* API URL input */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          URL API SMART-TOPSIS
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api-topsis.example.com/ranking"
            className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 font-mono transition-all"
          />
          {apiUrl && (
            <a
              href={apiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <ExternalLink size={13} /> Buka
            </a>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">
          Set permanen via env: <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_TOPSIS_API_URL</code> di file <code className="bg-slate-100 px-1 rounded">.env.local</code>
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-semibold mb-5">
          <AlertTriangle size={15} />
          {error}
        </div>
      )}

      {/* Belum fetch */}
      {!loading && data.length === 0 && !error && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center">
          <Trophy size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 mb-1">Belum ada data ranking</p>
          <p className="text-xs text-slate-300">Isi URL API lalu klik "Ambil Hasil"</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-40" />
                <div className="h-2 bg-slate-100 rounded w-24" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-16" />
              <div className="h-5 bg-slate-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      )}

      {/* Hasil */}
      {!loading && data.length > 0 && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: "Total Kandidat", value: total, color: "text-primary" },
              { label: "Diusulkan", value: data.filter((d) => d.rekomendasi?.toLowerCase().includes("diusulkan") && !d.rekomendasi?.toLowerCase().includes("tidak")).length, color: "text-emerald-600" },
              { label: "Tidak Diusulkan", value: data.filter((d) => d.rekomendasi?.toLowerCase().includes("tidak")).length, color: "text-red-500" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {lastFetch && (
            <p className="text-xs text-slate-400 mb-3">Terakhir diambil: {lastFetch}</p>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Rank", "Kandidat", "Prodi", "Skor", "Rekomendasi"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map((k, idx) => (
                  <motion.tr
                    key={k.id ?? idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${
                        k.rank <= 3 ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {k.rank <= 3 ? <Trophy size={13} /> : String(k.rank).padStart(2, "0")}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{k.nama}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{k.no_pendaftaran_kipk}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{k.prodi}</td>
                    <td className="px-4 py-3">
                      {k.skor != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(k.skor * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700">
                            {(k.skor <= 1 ? k.skor * 100 : k.skor).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{rekomendasiBadge(k.rekomendasi)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
