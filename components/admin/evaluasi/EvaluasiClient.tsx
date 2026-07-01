"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  ListFilter,
  X,
} from "lucide-react";
import { nanoid } from "nanoid";
import Filters, {
  AnimateChangeInHeight,
  Filter,
  FilterOperator,
  FilterType,
  filterViewOptions,
  filterViewToFilterOptions,
  FilterOption,
} from "@/components/ui/filters";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import type { MahasiswaEvaluasi, EvaluasiApiResponse } from "@/schemas";
import { getStatusWawancara, getStatusWawancaraColor, isPerluReview } from "@/schemas";

export type EvaluasiStatus = "selesai" | "belum";

function isEvaluasiSelesai(m: MahasiswaEvaluasi): boolean {
  // Selesai = sudah ada rekomendasi dan hasil_akhir terisi
  return !!(m.rekomendasi && m.hasil_akhir && m.is_draft === false);
}

function getStatus(m: MahasiswaEvaluasi): EvaluasiStatus {
  return isEvaluasiSelesai(m) ? "selesai" : "belum";
}

function hasilAkhirBadge(rekomendasi: string | null | undefined, hasilAkhir: string | null | undefined) {
  // Jika belum ada data sama sekali
  if (!rekomendasi && !hasilAkhir) {
    return <span className="text-muted-foreground italic text-xs">Belum diisi</span>;
  }

  // Badge Perlu Review (Dipertimbangkan tanpa hasil akhir)
  if (isPerluReview(rekomendasi) && !hasilAkhir) {
    return (
      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
        Perlu Review
      </span>
    );
  }

  // Tampilkan hasil_akhir jika sudah ada
  if (hasilAkhir) {
    const isDisusulkan = hasilAkhir === "Diusulkan";
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        isDisusulkan
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200"
      }`}>
        {hasilAkhir}
      </span>
    );
  }

  // Tampilkan rekomendasi sementara jika hasil_akhir belum ada
  const lower = String(rekomendasi).toLowerCase();
  if (lower.includes("tidak layak")) {
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">{rekomendasi}</span>;
  }
  return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-600 border-slate-200">{rekomendasi}</span>;
}

interface EvaluasiClientProps {
  initialData: EvaluasiApiResponse;
}

export default function EvaluasiClient({ initialData }: EvaluasiClientProps) {
  const [data, setData] = useState<MahasiswaEvaluasi[]>(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"semua" | "selesai" | "belum">("semua");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalSelesai, setTotalSelesai] = useState(initialData.totalSelesai);
  const [totalBelum, setTotalBelum] = useState(initialData.totalBelum);

  // Hitung perlu review dari data yang sudah di-load
  const totalPerluReview = data.filter(
    (m) => isPerluReview(m.rekomendasi) && !m.hasil_akhir
  ).length;
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<FilterType | null>(null);
  const [filterInput, setFilterInput] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        filter,
        page: String(page),
      });
      const res = await fetch(`/api/admin/evaluasi?${params}`);
      const json: EvaluasiApiResponse = await res.json();
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

  // Apply client-side filters dari komponen Filters
  const filteredData = data.filter((m) => {
    for (const f of filters) {
      if (!f.value?.length) continue;

      if (f.type === FilterType.HASIL_AKHIR) {
        const match = f.value.some((v) =>
          v === m.hasil_akhir ||
          (v === "Perlu Review" && isPerluReview(m.rekomendasi) && !m.hasil_akhir)
        );
        if (!match) return false;
      }
      if (f.type === FilterType.STATUS) {
        const selesai = isEvaluasiSelesai(m);
        const match = f.value.some((v) =>
          v === "Selesai" ? selesai : !selesai,
        );
        if (!match) return false;
      }
      if (f.type === FilterType.JALUR_MASUK) {
        const match = f.value.some((v) => v === m.jalur_masuk);
        if (!match) return false;
      }
    }
    return true;
  });

  // Fetch ulang hanya saat search/filter/page berubah (bukan initial load)
  useEffect(() => {
    // Skip fetch pada mount pertama karena sudah ada initialData
    if (page === 1 && !search && filter === "semua") return;
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search, filter, page]);

  // Reset page saat filter/search berubah
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Mahasiswa",  value: total,           color: "text-primary",    bg: "bg-primary/8"   },
          { label: "Sudah Dievaluasi", value: totalSelesai,    color: "text-emerald-600", bg: "bg-emerald-50"  },
          { label: "Belum Dievaluasi", value: totalBelum,      color: "text-slate-500",   bg: "bg-slate-50"    },
          { label: "Perlu Review",     value: totalPerluReview, color: "text-amber-600",  bg: "bg-amber-50",
            note: "Layak/Tidak Layak Dipertimbangkan" },
        ].map(({ label, value, color, bg, note }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${bg} rounded-2xl border border-border p-4 shadow-sm`}
          >
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-extrabold font-headline ${color}`}>{value}</p>
            {note && <p className="text-[10px] text-muted-foreground mt-0.5">{note}</p>}
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 relative z-10">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. pendaftaran, atau prodi..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Filters filters={filters} setFilters={setFilters} />

          {filters.filter((f) => f.value?.length > 0).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg px-3 text-muted-foreground hover:text-red-600 hover:border-red-200"
              onClick={() => setFilters([])}
            >
              <X className="size-3 mr-1" />
              Hapus Filter
            </Button>
          )}

          <Popover
            open={filterOpen}
            onOpenChange={(o) => {
              setFilterOpen(o);
              if (!o)
                setTimeout(() => {
                  setSelectedView(null);
                  setFilterInput("");
                }, 200);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs rounded-lg flex gap-1.5 items-center transition group border border-border hover:border-primary/30 px-3"
              >
                <ListFilter className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary transition-all" />
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0 z-50 shadow-lg" align="end" sideOffset={8}>
              <AnimateChangeInHeight>
                <Command>
                  <CommandInput
                    placeholder={selectedView ?? "Filter..."}
                    className="h-9"
                    value={filterInput}
                    onInputCapture={(e) =>
                      setFilterInput(e.currentTarget.value)
                    }
                  />
                  <CommandList>
                    <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                    {selectedView ? (
                      <CommandGroup>
                        {filterViewToFilterOptions[selectedView].map(
                          (f: FilterOption) => (
                            <CommandItem
                              key={f.name}
                              value={f.name}
                              className="group text-muted-foreground flex gap-2 items-center"
                              onSelect={(val) => {
                                setFilters((prev) => [
                                  ...prev,
                                  {
                                    id: nanoid(),
                                    type: selectedView,
                                    operator: FilterOperator.IS,
                                    value: [val],
                                  },
                                ]);
                                setTimeout(() => {
                                  setSelectedView(null);
                                  setFilterInput("");
                                }, 200);
                                setFilterOpen(false);
                              }}
                            >
                              {f.icon}
                              <span className="text-accent-foreground">
                                {f.name}
                              </span>
                            </CommandItem>
                          ),
                        )}
                      </CommandGroup>
                    ) : (
                      filterViewOptions.map(
                        (group: FilterOption[], idx: number) => (
                          <div key={idx}>
                            <CommandGroup>
                              {group.map((f: FilterOption) => (
                                <CommandItem
                                  key={f.name}
                                  value={f.name}
                                  className="group text-muted-foreground flex gap-2 items-center"
                                  onSelect={(val) => {
                                    setSelectedView(val as FilterType);
                                    setFilterInput("");
                                  }}
                                >
                                  {f.icon}
                                  <span className="text-accent-foreground">
                                    {f.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            {idx < filterViewOptions.length - 1 && (
                              <CommandSeparator />
                            )}
                          </div>
                        ),
                      )
                    )}
                  </CommandList>
                </Command>
              </AnimateChangeInHeight>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
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
                  {[
                    "No",
                    "Nama",
                    "Prodi",
                    "Pewawancara",
                    "Rekomendasi",
                    "Hasil Akhir",
                    "Status",
                    "Jalur Masuk",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((m, idx) => {
                  const status = getStatus(m);
                  const statusWawancara = getStatusWawancara(m.is_draft, m.pewawancara_id);
                  const statusColor = getStatusWawancaraColor(statusWawancara);
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                        {(page - 1) * 50 + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-on-surface text-sm">
                          {m.nama}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {m.no_pendaftaran_kipk}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">
                        {m.prodi}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface">
                        {m.pewawancara || (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>
                      {/* Rekomendasi pewawancara */}
                      <td className="px-4 py-3">
                        {m.rekomendasi ? (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            m.rekomendasi === "Layak"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.rekomendasi === "Tidak Layak"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : m.rekomendasi === "Layak Dipertimbangkan"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {m.rekomendasi}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">—</span>
                        )}
                      </td>
                      {/* Hasil Akhir */}
                      <td className="px-4 py-3">
                        {hasilAkhirBadge(m.rekomendasi, m.hasil_akhir)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                          {statusWawancara === "Sudah Diwawancarai" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                          {statusWawancara}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface">
                        {m.jalur_masuk || (
                          <span className="text-muted-foreground italic">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/evaluasi/${m.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
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
            <p className="text-xs text-muted-foreground">
              Halaman {page} dari {totalPages}
            </p>
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
      </motion.div>
    </div>
  );
}
