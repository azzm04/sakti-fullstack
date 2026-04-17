"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, ChevronRight, CheckCircle2, Clock, Loader2 } from "lucide-react";

interface Mahasiswa {
  id: string;
  no: number;
  no_pendaftaran_kipk: string;
  nama: string;
  prodi: string;
  rekomendasi: string;
  pewawancara: string;
}

export default function PewawancaraMahasiswaPage() {
  const [data, setData]       = useState<Mahasiswa[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page) });
      const res  = await fetch(`/api/admin/evaluasi?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  useEffect(() => { setPage(1); }, [search]);

  const selesai = data.filter((m) => m.rekomendasi && m.pewawancara).length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-primary font-headline">Daftar Mahasiswa</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {total} mahasiswa · {selesai} sudah dievaluasi
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau no. pendaftaran..."
          className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary transition-all"
        />
      </div>

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
                {["No", "Nama", "Prodi", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((m, idx) => {
                const done = !!(m.rekomendasi && m.pewawancara);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{(page - 1) * 50 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">{m.nama}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{m.no_pendaftaran_kipk}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{m.prodi}</td>
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
                      <Link href={`/pewawancara/mahasiswa/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        Isi Evaluasi <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && data.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">Belum ada data mahasiswa.</div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">← Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
