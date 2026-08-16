"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Loader2,
  ListFilter,
  Search,
  Settings2,
  Sparkles,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Pill } from "@/components/admin/ui/Pill";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { nanoid } from "nanoid";
import Filters, {
  AnimateChangeInHeight,
  Filter,
  FilterOperator,
  FilterType,
  filterViewOptions,
  filterViewToFilterOptions,
  FilterOption,
  JalurMasuk,
  RekomendasiWawancara,
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
import type { EvaluasiApiResponse, MahasiswaEvaluasi } from "@/schemas";
import {
  getStatusWawancara,
  getStatusWawancaraColor,
  isPerluReview,
} from "@/schemas";

export type EvaluasiStatus = "selesai" | "belum";

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 2019 }, (_, index) =>
  String(currentYear - index),
);
const JALUR_OPTIONS = Object.values(JalurMasuk);
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 500] as const;

// Limit fetch ke server: cukup besar untuk menampung seluruh data
// per kombinasi tahun+jalur, karena pagination sesungguhnya dilakukan
// di client setelah filter diterapkan (lihat komentar di bawah).
const FETCH_ALL_LIMIT = 5000;

function isEvaluasiSelesai(m: MahasiswaEvaluasi): boolean {
  return !!(m.rekomendasi && m.hasil_akhir && m.is_draft === false);
}

function hasilAkhirBadge(
  rekomendasi: string | null | undefined,
  hasilAkhir: string | null | undefined,
) {
  if (!rekomendasi && !hasilAkhir) {
    return (
      <span className="text-admin-text-3 italic text-xs">Belum diisi</span>
    );
  }

  if (isPerluReview(rekomendasi) && !hasilAkhir) {
    return (
      <span className="flex w-fit items-center gap-1 rounded-full border border-admin-warn-border bg-admin-warn-bg-2 px-2 py-0.5 text-[11px] font-bold text-admin-warn-text">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-admin-warn-bar animate-pulse" />
        Perlu Review
      </span>
    );
  }

  if (hasilAkhir) {
    const isDisusulkan = hasilAkhir === "Diusulkan";
    return (
      <span
        className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${
          isDisusulkan
            ? "border-admin-accent/25 bg-admin-accent/10 text-admin-accent-ink"
            : "border-admin-danger-border bg-admin-danger-bg text-admin-danger-text"
        }`}
      >
        {hasilAkhir}
      </span>
    );
  }

  const lower = String(rekomendasi).toLowerCase();
  if (lower.includes("tidak layak")) {
    return (
      <span className="rounded-full border border-admin-danger-border bg-admin-danger-bg px-2 py-0.5 text-[11px] font-bold text-admin-danger-text">
        {rekomendasi}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-admin-border bg-admin-border-soft px-2 py-0.5 text-[11px] font-bold text-admin-text-3">
      {rekomendasi}
    </span>
  );
}

export default function EvaluasiClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTahun = searchParams.get("tahun");
  const urlJalur = searchParams.get("jalur");
  const urlTahunValid =
    !!urlTahun &&
    /^\d{4}$/.test(urlTahun) &&
    parseInt(urlTahun) >= 2020 &&
    parseInt(urlTahun) <= currentYear;
  const urlJalurValid = !!urlJalur && JALUR_OPTIONS.includes(urlJalur as JalurMasuk);
  const urlSelectionValid = urlTahunValid && urlJalurValid;

  const [tahun, setTahun] = useState(urlTahunValid ? (urlTahun as string) : String(currentYear));
  const [jalur, setJalur] = useState(urlJalurValid ? (urlJalur as string) : "");
  const [activeSelection, setActiveSelection] = useState<{
    tahun: string;
    jalur: string;
  } | null>(urlSelectionValid ? { tahun: urlTahun as string, jalur: urlJalur as string } : null);
  const [formCollapsed, setFormCollapsed] = useState(urlSelectionValid);

  // `data` sekarang menyimpan SELURUH data untuk kombinasi tahun+jalur
  // yang aktif (tidak dipotong per halaman oleh server).
  const [data, setData] = useState<MahasiswaEvaluasi[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(100);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<FilterType | null>(null);
  const [filterInput, setFilterInput] = useState("");

  const tahunValid =
    /^\d{4}$/.test(tahun) &&
    parseInt(tahun) >= 2020 &&
    parseInt(tahun) <= currentYear;
  const canRun = tahunValid && !!jalur;
  const hasSelection = activeSelection !== null;

  const totalPerluReview = useMemo(
    () =>
      data.filter((m) => isPerluReview(m.rekomendasi) && !m.hasil_akhir).length,
    [data],
  );

  // Dihitung dari hasil keputusan akhir (hasil_akhir), bukan status proses.
  // Ini yang paling relevan buat admin: berapa yang lolos, berapa yang tidak,
  // berapa yang masih menggantung (perlu review).
  const totalDiusulkan = useMemo(
    () => data.filter((m) => m.hasil_akhir === "Diusulkan").length,
    [data],
  );

  const totalTidakDiusulkan = useMemo(
    () => data.filter((m) => m.hasil_akhir === "Tidak Diusulkan").length,
    [data],
  );

  // Sudah direkomendasikan pewawancara tapi belum difinalisasi admin —
  // mencakup SEMUA rekomendasi yang belum berbuah hasil_akhir, bukan cuma
  // kasus "Dipertimbangkan" (rekomendasi non-ambigu yang belum sempat
  // difinalisasi tetap masuk sini). Bersama 3 bucket lain di bawah, ini
  // mutually exclusive & exhaustive terhadap `data`, jadi jumlah keempatnya
  // harus selalu sama dengan `total`.
  const totalMenungguFinalisasi = useMemo(
    () => data.filter((m) => !!m.rekomendasi && !m.hasil_akhir).length,
    [data],
  );

  const totalBelumDievaluasi = useMemo(
    () => data.filter((m) => !m.rekomendasi).length,
    [data],
  );

  // Daftar pewawancara & beban kerja — diturunkan dari data yang sudah
  // dimuat untuk jalur aktif (bukan endpoint terpisah), jadi selalu
  // konsisten dengan apa yang sedang ditampilkan di tabel.
  const interviewerLoad = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of data) {
      if (m.pewawancara) counts.set(m.pewawancara, (counts.get(m.pewawancara) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [data]);

  const loadData = useCallback(
    async (params: { tahun: string; jalur: string; search: string }) => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          tahun: params.tahun,
          jalur_masuk: params.jalur,
          page: "1",
          limit: String(FETCH_ALL_LIMIT),
        });

        if (params.search) {
          query.set("search", params.search);
        }

        const res = await fetch(`/api/admin/evaluasi?${query.toString()}`);
        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(body?.error || "Gagal mengambil data evaluasi");
        }

        const json = body as EvaluasiApiResponse;
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
        setFormCollapsed(true);
      } catch (fetchError) {
        setData([]);
        setTotal(0);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Gagal mengambil data evaluasi",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Fetch ulang hanya saat kombinasi tahun/jalur aktif berubah, atau search berubah.
  // page & rowsPerPage TIDAK memicu fetch lagi karena pagination sekarang murni di client.
  useEffect(() => {
    if (!activeSelection) return;

    const timer = setTimeout(
      () => {
        void loadData({
          ...activeSelection,
          search,
        });
      },
      search ? 350 : 0,
    );

    return () => clearTimeout(timer);
  }, [activeSelection, loadData, search]);

  // Reset ke halaman 1 setiap kali filter atau search berubah,
  // supaya tidak "nyangkut" di halaman kosong setelah filter mengecilkan hasil.
  useEffect(() => {
    setPage(1);
  }, [filters, search]);

  const filteredData = data.filter((m) => {
    for (const f of filters) {
      if (!f.value?.length) continue;

      if (f.type === FilterType.HASIL_AKHIR) {
        const match = f.value.some(
          (v) =>
            v === m.hasil_akhir ||
            (v === "Perlu Review" &&
              isPerluReview(m.rekomendasi) &&
              !m.hasil_akhir),
        );
        if (!match) return false;
      }

      if (f.type === FilterType.REKOMENDASI) {
        const match = f.value.some((v) => v === m.rekomendasi);
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

  // Pagination dihitung dari HASIL FILTER, bukan dari total data mentah server.
  // Ini yang membuat jumlah halaman & urutan menyesuaikan secara dinamis
  // terhadap filter aktif, alih-alih terpotong statis per 100 data.
  const totalPages = Math.max(1, Math.ceil(filteredData.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const handleRun = () => {
    if (!canRun) return;

    setPage(1);
    setActiveSelection({ tahun, jalur });
    router.replace(
      `${pathname}?tahun=${encodeURIComponent(tahun)}&jalur=${encodeURIComponent(jalur)}`,
      { scroll: false },
    );
  };

  const handleRowsPerPageChange = (value: number) => {
    setRowsPerPage(value);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        breadcrumb="Admin / Seleksi KIP-K / Evaluasi"
        title="Evaluasi Wawancara"
        right={
          <>
            <label className="flex items-center gap-[9px] bg-admin-bg border border-admin-border rounded-[11px] px-[13px] py-[9px] flex-1 sm:flex-none sm:w-70 text-admin-text-3 focus-within:border-admin-accent transition-colors">
              <Search size={15} strokeWidth={1.6} className="shrink-0" />
              <input
                type="text"
                placeholder="Cari kandidat, NIM, prodi…"
                className="border-0 bg-transparent outline-none text-[13px] text-admin-text w-full placeholder:text-admin-placeholder"
              />
            </label>
            <button
              type="button"
              className="border border-admin-border bg-transparent rounded-[11px] w-[38px] h-[38px] shrink-0 flex items-center justify-center text-admin-text-2 hover:bg-admin-surface-soft transition-colors"
            >
              <Bell size={17} strokeWidth={1.6} />
            </button>
          </>
        }
      />

      <div className="px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-white shadow-[0_1px_2px_rgba(20,40,70,0.05)]">
        <motion.button
          onClick={() => setFormCollapsed((value) => !value)}
          whileTap={{ scale: 0.995 }}
          className="flex w-full items-center justify-between border-b border-admin-border px-6 py-4 text-left transition-colors hover:bg-admin-surface-soft/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-admin-accent/8 text-admin-accent">
              <Settings2 size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-admin-text">
                Pilih Data yang Akan Ditampilkan
              </p>
              {hasSelection ? (
                <p className="mt-0.5 text-xs text-admin-text-3">
                  {activeSelection?.jalur} · Tahun {activeSelection?.tahun}
                  {!loading && (
                    <span className="ml-2 font-semibold text-admin-accent">
                      · {total.toLocaleString("id-ID")} data
                    </span>
                  )}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-admin-text-3">
                  Klik untuk memilih tahun dan jalur masuk
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasSelection && !loading && (
              <Pill tone="accent" dot>
                Evaluasi aktif
              </Pill>
            )}
            <motion.div animate={{ rotate: formCollapsed ? 0 : 180 }}>
              <ChevronDown size={16} className="text-admin-text-3" />
            </motion.div>
          </div>
        </motion.button>

        {!formCollapsed && (
          <div className="border-t border-admin-border px-5 pb-5 pt-5">
            <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_auto] gap-[22px] items-start">
              <div>
                <label className="mb-[9px] block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-admin-text-4">
                  Tahun Seleksi
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    strokeWidth={1.6}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-3"
                  />
                  <select
                    value={tahun}
                    onChange={(event) => {
                      setTahun(event.target.value);
                      setError(null);
                    }}
                    className="w-full appearance-none rounded-[11px] border border-admin-border bg-admin-surface-soft py-[11px] pl-9 pr-4 text-sm font-semibold text-admin-text outline-none transition-all focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  >
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                {!tahunValid && (
                  <p className="mt-1 text-[11px] text-admin-danger-text">
                    Pilih tahun antara 2020 dan {currentYear}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-[9px] block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-admin-text-4">
                  Jalur Masuk
                </label>
                <div className="flex flex-wrap gap-[9px]">
                  {JALUR_OPTIONS.map((option) => {
                    const selected = jalur === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setJalur(option);
                          setError(null);
                        }}
                        className={`flex items-center gap-[10px] rounded-[11px] border px-[15px] py-[10px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
                          selected
                            ? "border-admin-accent bg-admin-accent text-white"
                            : "border-admin-border bg-admin-surface-soft text-admin-text-2 hover:border-admin-accent/40"
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 shrink-0 rounded-full border-[1.5px] ${
                            selected ? "border-white" : "border-admin-text-5"
                          }`}
                        >
                          {selected && (
                            <span className="block w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              <motion.button
                onClick={handleRun}
                disabled={!canRun || loading}
                whileHover={canRun && !loading ? { scale: 1.02 } : undefined}
                whileTap={canRun && !loading ? { scale: 0.97 } : undefined}
                className={`flex items-center gap-2 rounded-[11px] px-5 py-[11px] text-[13.5px] font-bold whitespace-nowrap transition-colors lg:mt-[26px] ${
                  canRun && !loading
                    ? "bg-admin-accent text-white hover:bg-admin-accent-hover"
                    : "cursor-not-allowed bg-admin-border text-admin-placeholder"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Memuat Data...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    {hasSelection ? "Muat Ulang Data" : "Tampilkan Data"}
                  </>
                )}
              </motion.button>
            </div>

            {(hasSelection || error) && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-admin-border-soft pt-4">
                {hasSelection && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-[10px] px-4 text-xs font-semibold text-admin-text-3 hover:border-admin-accent/30 hover:text-admin-text"
                    onClick={() => {
                      setActiveSelection(null);
                      setData([]);
                      setTotal(0);
                      setFilters([]);
                      setSearch("");
                      setPage(1);
                      setError(null);
                      setFormCollapsed(false);
                      router.replace(pathname, { scroll: false });
                    }}
                  >
                    Reset Pilihan
                  </Button>
                )}

                {hasSelection && (
                  <div className="flex items-center gap-2 rounded-[10px] border border-admin-border bg-white px-3 py-[7px] text-xs text-admin-text-3">
                    <span className="font-semibold">Jumlah baris per halaman</span>
                    <select
                      value={rowsPerPage}
                      onChange={(event) =>
                        handleRowsPerPageChange(Number(event.target.value))
                      }
                      className="rounded-lg border border-admin-border bg-admin-bg px-2 py-1 text-xs font-semibold text-admin-text outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                    >
                      {ROWS_PER_PAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option} rows
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {error && (
                  <p
                    role="alert"
                    className="flex items-center gap-1.5 text-sm text-admin-danger-text"
                  >
                    <TriangleAlert size={14} className="shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!hasSelection ? (
        <EmptyState
          icon={<ListFilter size={28} strokeWidth={1.4} />}
          title="Belum Ada Data Dimuat"
          description="Pilih tahun seleksi dan jalur masuk di panel atas, lalu tekan Tampilkan Data untuk memuat tabel evaluasi."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-[2.6fr_1fr] gap-[14px] items-start">
          <div className="min-w-0 flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-admin-border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-3"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama, no. pendaftaran, atau prodi..."
                className="w-full rounded-xl border border-admin-border bg-white py-2.5 pl-9 pr-3 text-sm transition-all focus:border-admin-accent focus:outline-none focus:ring-1 focus:ring-admin-accent/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Filters filters={filters} setFilters={setFilters} />

              {totalPerluReview > 0 &&
                !filters.some(
                  (filter) =>
                    filter.type === FilterType.REKOMENDASI &&
                    filter.value.includes(
                      RekomendasiWawancara.LAYAK_DIPERTIMBANGKAN,
                    ),
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg border-admin-warn-bar bg-admin-warn-bg-2 px-3 text-xs text-admin-warn-text hover:border-admin-warn-bar hover:bg-admin-warn-border"
                    onClick={() =>
                      setFilters((prev) => [
                        ...prev.filter(
                          (filter) => filter.type !== FilterType.REKOMENDASI,
                        ),
                        {
                          id: nanoid(),
                          type: FilterType.REKOMENDASI,
                          operator: FilterOperator.IS_ANY_OF,
                          value: [
                            RekomendasiWawancara.LAYAK_DIPERTIMBANGKAN,
                            RekomendasiWawancara.TIDAK_LAYAK_DIPERTIMBANGKAN,
                          ],
                        },
                      ])
                    }
                  >
                    <TriangleAlert className="size-3 text-admin-warn-bar" />
                    Perlu Review ({totalPerluReview})
                  </Button>
                )}

              {filters.filter((filter) => filter.value?.length > 0).length >
                0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg px-3 text-xs text-admin-text-3 hover:border-admin-danger-border hover:text-admin-danger-text"
                  onClick={() => setFilters([])}
                >
                  <X className="mr-1 size-3" />
                  Hapus Filter
                </Button>
              )}

              <Popover
                open={filterOpen}
                onOpenChange={(open) => {
                  setFilterOpen(open);
                  if (!open) {
                    setTimeout(() => {
                      setSelectedView(null);
                      setFilterInput("");
                    }, 200);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-admin-border px-3 text-xs transition hover:border-admin-accent/30"
                  >
                    <ListFilter className="size-3.5 shrink-0 text-admin-text-3 transition-all group-hover:text-admin-accent" />
                    Filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="z-50 w-55 p-0 shadow-lg"
                  align="end"
                  sideOffset={8}
                >
                  <AnimateChangeInHeight>
                    <Command>
                      <CommandInput
                        placeholder={selectedView ?? "Filter..."}
                        className="h-9"
                        value={filterInput}
                        onInputCapture={(event) =>
                          setFilterInput(event.currentTarget.value)
                        }
                      />
                      <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        {selectedView ? (
                          <CommandGroup>
                            {filterViewToFilterOptions[selectedView].map(
                              (option: FilterOption) => (
                                <CommandItem
                                  key={option.name}
                                  value={option.name}
                                  className="group flex items-center gap-2 text-admin-text-3"
                                  onSelect={(value) => {
                                    setFilters((prev) => {
                                      const existing = prev.find(
                                        (filter) =>
                                          filter.type === selectedView,
                                      );

                                      if (existing) {
                                        return prev.map((filter) =>
                                          filter.type === selectedView
                                            ? {
                                                ...filter,
                                                value: [
                                                  ...new Set([
                                                    ...filter.value,
                                                    value,
                                                  ]),
                                                ],
                                              }
                                            : filter,
                                        );
                                      }

                                      return [
                                        ...prev,
                                        {
                                          id: nanoid(),
                                          type: selectedView,
                                          operator: FilterOperator.IS,
                                          value: [value],
                                        },
                                      ];
                                    });
                                    setTimeout(() => {
                                      setSelectedView(null);
                                      setFilterInput("");
                                    }, 200);
                                    setFilterOpen(false);
                                  }}
                                >
                                  {option.icon}
                                  <span className="text-accent-foreground">
                                    {option.name}
                                  </span>
                                </CommandItem>
                              ),
                            )}
                          </CommandGroup>
                        ) : (
                          filterViewOptions.map(
                            (group: FilterOption[], index: number) => {
                              const activeTypes = new Set(
                                filters.map((filter) => filter.type),
                              );
                              const availableGroup = group.filter(
                                (option) =>
                                  !activeTypes.has(option.name as FilterType),
                              );

                              if (availableGroup.length === 0) return null;

                              return (
                                <div key={index}>
                                  <CommandGroup>
                                    {availableGroup.map(
                                      (option: FilterOption) => (
                                        <CommandItem
                                          key={option.name}
                                          value={option.name}
                                          className="group flex items-center gap-2 text-admin-text-3"
                                          onSelect={(value) => {
                                            setSelectedView(
                                              value as FilterType,
                                            );
                                            setFilterInput("");
                                          }}
                                        >
                                          {option.icon}
                                          <span className="text-accent-foreground">
                                            {option.name}
                                          </span>
                                        </CommandItem>
                                      ),
                                    )}
                                  </CommandGroup>
                                  {index < filterViewOptions.length - 1 && (
                                    <CommandSeparator />
                                  )}
                                </div>
                              );
                            },
                          )
                        )}
                      </CommandList>
                    </Command>
                  </AnimateChangeInHeight>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-admin-border bg-white shadow-sm"
          >
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-surface-soft">
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
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-admin-text-3"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {Array.from({ length: 8 }).map((_, rowIndex) => (
                      <tr key={rowIndex}>
                        {Array.from({ length: 9 }).map((_, colIndex) => (
                          <td key={colIndex} className="px-4 py-3">
                            <div
                              className="h-3.5 rounded bg-admin-border-soft animate-pulse"
                              style={{
                                width: `${55 + ((rowIndex + colIndex) % 4) * 12}%`,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : paginatedData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-surface-soft">
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
                      ].map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-admin-text-3"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-admin-border">
                    {paginatedData.map((row, index) => {
                      const statusWawancara = getStatusWawancara(
                        row.is_draft,
                        row.pewawancara_id,
                      );
                      const statusColor =
                        getStatusWawancaraColor(statusWawancara);

                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-admin-surface-soft/60"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-admin-text-3">
                            {(currentPage - 1) * rowsPerPage + index + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-admin-text">
                              {row.nama_pendaftar}
                            </p>
                            <p className="text-[11px] font-mono text-admin-text-3">
                              {row.no_pendaftaran_kipk}
                            </p>
                          </td>
                          <td className="max-w-45 truncate px-4 py-3 text-xs font-semibold text-admin-text-3">
                            {row.prodi_pendaftar}
                          </td>
                          <td className="px-4 py-3 text-xs text-admin-text">
                            {row.pewawancara || (
                              <span className="italic text-admin-text-3">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.rekomendasi ? (
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                                  row.rekomendasi === "Layak"
                                    ? "border-admin-accent/25 bg-admin-accent/10 text-admin-accent-ink"
                                    : row.rekomendasi === "Tidak Layak"
                                      ? "border-admin-danger-border bg-admin-danger-bg text-admin-danger-text"
                                      : row.rekomendasi ===
                                          "Layak Dipertimbangkan"
                                        ? "border-admin-accent/25 bg-admin-accent/10 text-admin-accent-ink"
                                        : "border-admin-warn-border bg-admin-warn-bg-2 text-admin-warn-text"
                                }`}
                              >
                                {row.rekomendasi}
                              </span>
                            ) : (
                              <span className="text-xs italic text-admin-text-3">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {hasilAkhirBadge(row.rekomendasi, row.hasil_akhir)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                            >
                              {statusWawancara === "Sudah Diwawancarai" ? (
                                <CheckCircle2 size={11} />
                              ) : (
                                <Clock size={11} />
                              )}
                              {statusWawancara}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-admin-text">
                            {row.jalur_masuk || (
                              <span className="italic text-admin-text-3">
                                —
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/evaluasi/${row.id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-admin-accent hover:underline"
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
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-admin-surface-soft">
                  <ListFilter size={20} className="text-admin-text-3" />
                </div>
                <p className="text-sm text-admin-text-3">
                  Tidak ada data untuk kombinasi filter yang dipilih.
                </p>
                {(filters.length > 0 || search) && (
                  <button
                    onClick={() => {
                      setFilters([]);
                      setSearch("");
                    }}
                    className="text-xs font-semibold text-admin-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/30 rounded"
                  >
                    Reset filter &amp; pencarian
                  </button>
                )}
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-admin-border px-4 py-3">
                <p className="text-xs text-admin-text-3">
                  Halaman {currentPage} dari {totalPages} ·{" "}
                  {filteredData.length.toLocaleString("id-ID")} data
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-admin-border px-3 py-1.5 text-xs transition-colors hover:bg-admin-surface-soft disabled:opacity-40"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-admin-border px-3 py-1.5 text-xs transition-colors hover:bg-admin-surface-soft disabled:opacity-40"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
          </div>

          <div className="flex flex-col gap-[14px] min-w-0">
            <article className="bg-white border border-admin-border rounded-2xl p-[18px_20px] shadow-sm">
              <h2 className="font-admin-heading text-[18px] font-semibold m-0">
                Progres Finalisasi
              </h2>
              <div className="flex items-baseline gap-2.5 mt-3">
                <span className="font-admin-heading text-[42px] font-semibold leading-[0.9] tracking-[-0.02em] tabular-nums">
                  {(totalDiusulkan + totalTidakDiusulkan).toLocaleString("id-ID")}
                </span>
                <span className="text-[16px] font-semibold text-admin-text-2">
                  dari <span className="tabular-nums">{total.toLocaleString("id-ID")}</span> mahasiswa ·{" "}
                  {total > 0
                    ? ((totalDiusulkan + totalTidakDiusulkan) / total * 100).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                    : "0"}
                  %
                </span>
              </div>
              <div className="h-[9px] rounded-full bg-admin-grid overflow-hidden my-3.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-admin-accent/65 to-admin-accent"
                  style={{
                    width: `${total > 0 ? Math.min(100, ((totalDiusulkan + totalTidakDiusulkan) / total) * 100) : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-admin-bg rounded-xl p-[11px_12px]">
                  <div className="font-admin-heading text-[20px] font-semibold leading-none tabular-nums">
                    {interviewerLoad.length}
                  </div>
                  <div className="text-[10px] tracking-[0.12em] uppercase text-admin-text-4 mt-[5px]">
                    Pewawancara
                  </div>
                </div>
                <div className="bg-admin-bg rounded-xl p-[11px_12px]">
                  <div className="font-admin-heading text-[20px] font-semibold leading-none tabular-nums">
                    {(total - totalDiusulkan - totalTidakDiusulkan).toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] tracking-[0.12em] uppercase text-admin-text-4 mt-[5px]">
                    Menunggu
                  </div>
                </div>
                <div className="bg-admin-bg rounded-xl p-[11px_12px]">
                  <div className="font-admin-heading text-[20px] font-semibold leading-none tabular-nums">
                    {totalBelumDievaluasi.toLocaleString("id-ID")}
                  </div>
                  <div className="text-[10px] tracking-[0.12em] uppercase text-admin-text-4 mt-[5px]">
                    Belum Wawancara
                  </div>
                </div>
              </div>
            </article>

            <article className="bg-white border border-admin-border rounded-2xl p-[18px_20px_20px] shadow-sm">
              <h2 className="font-admin-heading text-[18px] font-semibold m-0">Sebaran Rekomendasi</h2>
              <p className="text-[12.5px] text-admin-text-3 mt-[3px] mb-[15px] m-0">
                Pada jalur yang sedang dimuat
              </p>
              <div className="flex flex-col gap-[13px]">
                {[
                  { label: "Diusulkan", value: totalDiusulkan, color: "var(--color-admin-accent)" },
                  { label: "Menunggu finalisasi", value: totalMenungguFinalisasi, color: "var(--color-admin-warn-bar)" },
                  { label: "Tidak diusulkan", value: totalTidakDiusulkan, color: "var(--color-admin-danger-bar)" },
                  { label: "Belum dievaluasi", value: totalBelumDievaluasi, color: "var(--color-admin-text-6)" },
                ].map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[15px] text-admin-text-2">
                      <span>{b.label}</span>
                      <span className="font-bold text-[17px] tabular-nums">{b.value.toLocaleString("id-ID")}</span>
                    </div>
                    <div className="h-2 rounded-full bg-admin-grid overflow-hidden mt-[7px]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: b.color,
                          width: `${total > 0 ? Math.max(2, (b.value / total) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="bg-white border border-admin-border rounded-2xl p-[18px_20px_20px] shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-admin-heading text-[18px] font-semibold m-0">Daftar Pewawancara</h2>
                  <p className="text-[12.5px] text-admin-text-3 mt-[3px] m-0">
                    Ditugaskan pada jalur yang sedang dimuat
                  </p>
                </div>
                <span className="text-[11.5px] font-semibold text-admin-text-2 bg-admin-surface-soft-2 border border-admin-border-soft rounded-full px-[11px] py-[5px] whitespace-nowrap">
                  {interviewerLoad.length} orang
                </span>
              </div>
              {interviewerLoad.length === 0 ? (
                <p className="text-[12.5px] text-admin-text-4 mt-4">
                  Belum ada pewawancara yang mengisi hasil pada jalur ini.
                </p>
              ) : (
                <div className="flex flex-col gap-[9px] mt-[15px]">
                  {interviewerLoad.map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center gap-3 border border-admin-border-soft bg-admin-surface-soft rounded-xl px-[13px] py-[11px]"
                    >
                      <span className="w-[34px] h-[34px] rounded-[11px] bg-admin-accent/[0.13] text-admin-accent-ink flex items-center justify-center text-xs font-bold shrink-0">
                        <UserRound size={15} strokeWidth={1.7} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate">{name}</div>
                      </div>
                      <span className="text-[11px] text-admin-text-4 tabular-nums whitespace-nowrap">
                        {count} kandidat
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
