"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { CandidateData } from "@/schemas";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Table2, FileText, Database, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Save, Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Lightbulb,
} from "lucide-react";

interface Props {
  data: CandidateData[];
  fileName: string;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  hasData?: boolean;
  jalurMasuk?: string;
}

const columnHelper = createColumnHelper<CandidateData>();

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function CellValue({ value, isNumber }: { value: unknown; isNumber?: boolean }) {
  if (value === null || value === undefined || value === "" || (isNumber && value === 0)) {
    return <span className="text-admin-text-5">—</span>;
  }
  if (isNumber && typeof value === "number") {
    return <span className="font-medium text-admin-text">{formatRupiah(value)}</span>;
  }
  return <>{String(value)}</>;
}

function P3KEBadge({ status }: { status: string }) {
  if (!status) return <span className="text-admin-text-5">—</span>;
  const isDesil = status.toLowerCase().includes("desil");
  const isBelum = status.toLowerCase().includes("belum");
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
        isBelum
          ? "bg-admin-surface-soft text-admin-text-3 border-admin-border"
          : isDesil
          ? "bg-admin-accent/8 text-admin-accent border-admin-accent/20"
          : "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25"
      }`}
    >
      {status}
    </span>
  );
}

function DTKSBadge({ status }: { status: string }) {
  if (!status) return <span className="text-admin-text-5">—</span>;
  const terdata = status.toLowerCase() === "terdata";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
        terdata
          ? "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25"
          : "bg-admin-warn-bg-2 text-admin-warn-text border-admin-warn-border"
      }`}
    >
      {status}
    </span>
  );
}

export default function DataPreviewTable({
  data,
  fileName,
  onSave,
  saveStatus = "idle",
  hasData = false,
}: Props) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(
    () => [
      // ── Kolom selalu tampil ───────────────────────────────────────────────
      columnHelper.accessor("no", {
        header: "No",
        cell: (info) => (
          <span className="font-bold text-admin-accent">{info.getValue() as number}</span>
        ),
        size: 55,
      }),
      columnHelper.accessor("no_pendaftaran_kipk", {
        header: "No. Pendaftaran KIP",
        cell: (info) => (
          <span className="font-admin-mono text-xs text-admin-text-3">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 190,
      }),
      columnHelper.accessor("nama_pendaftar", {
        header: "Nama Pendaftar",
        cell: (info) => (
          <span className="font-semibold text-admin-text">{String(info.getValue() || "—")}</span>
        ),
        size: 210,
      }),
      columnHelper.accessor("prodi_pendaftar", {
        header: "Program Studi",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 180,
      }),
      columnHelper.accessor("nik", {
        header: "NIK",
        cell: (info) => (
          <span className="font-admin-mono text-xs text-admin-text-3">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 160,
      }),
      columnHelper.accessor("nisn", {
        header: "NISN",
        cell: (info) => (
          <span className="font-admin-mono text-xs text-admin-text-3">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 120,
      }),
      columnHelper.accessor("no_hp", {
        header: "No. HP",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 140,
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 210,
      }),
columnHelper.accessor("aktif_dtsen" as keyof CandidateData, {
        header: "Aktif DTSEN",
        cell: (info) => <DTKSBadge status={String(info.getValue() ?? "")} />,
        size: 130,
      }),
      columnHelper.accessor("desil_dtsen" as keyof CandidateData, {
        header: "Desil DTSEN",
        cell: (info) => <P3KEBadge status={String(info.getValue() ?? "")} />,
        size: 160,
      }),
      columnHelper.accessor("penghasilan_ayah", {
        header: "Penghasilan Ayah",
        cell: (info) => <CellValue value={info.getValue()} isNumber />,
        size: 155,
      }),
      columnHelper.accessor("penghasilan_ibu", {
        header: "Penghasilan Ibu",
        cell: (info) => <CellValue value={info.getValue()} isNumber />,
        size: 145,
      }),
      columnHelper.accessor("nominal_per_kapita", {
        header: "Per Kapita",
        cell: (info) => <CellValue value={info.getValue()} isNumber />,
        size: 130,
      }),
      columnHelper.accessor("jarak_pusat_kota", {
        header: "Jarak (KM)",
        cell: (info) => {
          const v = info.getValue() as number;
          return v ? <span>{v} km</span> : <span className="text-admin-text-5">—</span>;
        },
        size: 100,
      }),

      // ── Kolom extended ────────────────────────────────────────────────────
      columnHelper.accessor("no_kip", {
        header: "No. KIP",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("no_kks", {
        header: "No. KKS",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("no_kartu_keluarga", {
        header: "No. KK",
        cell: (info) => (
          <span className="font-admin-mono text-xs text-admin-text-3">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 165,
      }),
      columnHelper.accessor("nik_kepala_keluarga", {
        header: "NIK Kepala KK",
        cell: (info) => (
          <span className="font-admin-mono text-xs text-admin-text-3">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 155,
      }),
      columnHelper.accessor("validasi_aktif_dtsen", {
        header: "Validasi AKTIF DTSEN",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor("validasi_desil_dtsen", {
        header: "Validasi DESIL DTSEN",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor("asal_sekolah", {
        header: "Asal Sekolah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 200,
      }),
      columnHelper.accessor("kab_kota_sekolah", {
        header: "Kab/Kota Sekolah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 160,
      }),
      columnHelper.accessor("provinsi_sekolah", {
        header: "Provinsi Sekolah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 150,
      }),
      columnHelper.accessor("tempat_lahir", {
        header: "Tempat Lahir",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 140,
      }),
      columnHelper.accessor("tanggal_lahir", {
        header: "Tanggal Lahir",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("jenis_kelamin", {
        header: "L/P",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 60,
      }),
      columnHelper.accessor("alamat", {
        header: "Alamat",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 240,
      }),
      columnHelper.accessor("pekerjaan_ayah", {
        header: "Pekerjaan Ayah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 150,
      }),
      columnHelper.accessor("ket_pekerjaan_ayah", {
        header: "Ket. Pekerjaan Ayah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 180,
      }),
      columnHelper.accessor("status_ayah", {
        header: "Status Ayah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 110,
      }),
      columnHelper.accessor("pekerjaan_ibu", {
        header: "Pekerjaan Ibu",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 150,
      }),
      columnHelper.accessor("ket_pekerjaan_ibu", {
        header: "Ket. Pekerjaan Ibu",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 180,
      }),
      columnHelper.accessor("status_ibu", {
        header: "Status Ibu",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 110,
      }),
      columnHelper.accessor("penghasilan_lain", {
        header: "Penghasilan Lain",
        cell: (info) => <CellValue value={info.getValue()} isNumber />,
        size: 145,
      }),
      columnHelper.accessor("jumlah_tanggungan", {
        header: "Tanggungan",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 110,
      }),
      columnHelper.accessor("jumlah_orang_rumah", {
        header: "Orang Serumah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("kepemilikan_rumah", {
        header: "Kepemilikan Rumah",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 160,
      }),
      columnHelper.accessor("sumber_listrik", {
        header: "Sumber Listrik",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 130,
      }),
      columnHelper.accessor("sumber_air", {
        header: "Sumber Air",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor("mck", {
        header: "MCK",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 110,
      }),
      columnHelper.accessor("kab_kota", {
        header: "Kab/Kota",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 140,
      }),
      columnHelper.accessor("provinsi", {
        header: "Provinsi",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 140,
      }),
      columnHelper.accessor("jalur_masuk", {
        header: "Jalur Masuk",
        cell: (info) => {
          const val = info.getValue() as string;
          if (!val) return <span className="text-admin-text-5">—</span>;
          return (
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-admin-accent/8 text-admin-accent border border-admin-accent/20">
              {val}
            </span>
          );
        },
        size: 110,
      }),
      columnHelper.accessor("golongan_ukt" as keyof CandidateData, {
        header: "Golongan UKT",
        cell: (info) => {
          const v = info.getValue() as number;
          return v ? (
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-admin-surface-soft text-admin-text-2 border border-admin-border">
              Golongan {v}
            </span>
          ) : (
            <span className="text-admin-text-5">—</span>
          );
        },
        size: 120,
      }),
    ],
    [],
  );

  // Kolom yang disembunyikan di mode "Dasar"
  const hiddenInBasic: VisibilityState = {
    no_kip: false,
    no_kks: false,
    no_kartu_keluarga: false,
    nik_kepala_keluarga: false,
    validasi_aktif_dtsen: false,
    validasi_desil_dtsen: false,
    asal_sekolah: false,
    kab_kota_sekolah: false,
    provinsi_sekolah: false,
    tempat_lahir: false,
    tanggal_lahir: false,
    jenis_kelamin: false,
    alamat: false,
    pekerjaan_ayah: false,
    ket_pekerjaan_ayah: false,
    status_ayah: false,
    pekerjaan_ibu: false,
    ket_pekerjaan_ibu: false,
    status_ibu: false,
    penghasilan_lain: false,
    jumlah_tanggungan: false,
    jumlah_orang_rumah: false,
    kepemilikan_rumah: false,
    sumber_listrik: false,
    sumber_air: false,
    mck: false,
    kab_kota: false,
    provinsi: false,
    jalur_masuk: false,
  };

  const columnVisibility: VisibilityState = useMemo(
    () => (showAllColumns ? {} : hiddenInBasic),
    [showAllColumns],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 50 } },
  });

  const errorCount = data.filter((d) => d.hasErrors).length;
  const validCount = data.length - errorCount;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-admin-border-soft">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-admin-accent flex items-center justify-center shadow-sm">
                  <Table2 size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-admin-heading text-lg font-extrabold text-admin-text">Data Preview</h4>
                  <p className="text-[11px] text-admin-text-3 flex items-center gap-1.5">
                    <FileText size={11} />
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-accent/8 rounded-lg border border-admin-accent/20">
                  <Database size={12} className="text-admin-accent" />
                  <span className="text-xs font-bold text-admin-accent">{data.length} Baris</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-accent/10 rounded-lg border border-admin-accent/20">
                  <CheckCircle2 size={12} className="text-admin-accent" />
                  <span className="text-xs font-bold text-admin-accent-ink">{validCount} Valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-warn-bg-2 rounded-lg border border-admin-warn-border">
                    <Info size={12} className="text-admin-warn-text" />
                    <span className="text-xs font-bold text-admin-warn-text">{errorCount} Perlu Periksa</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="px-4 py-2.5 bg-admin-surface-soft hover:bg-admin-border/60 text-admin-text text-xs font-bold rounded-xl transition-all flex items-center gap-2"
              >
                {showAllColumns ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAllColumns ? "Kolom Dasar" : "Semua Kolom"}
              </button>

              <button
                onClick={onSave}
                disabled={!hasData || saveStatus === "saving" || saveStatus === "saved"}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2
                  ${saveStatus === "saved" ? "bg-admin-accent text-white" :
                    saveStatus === "saving" ? "bg-admin-accent/60 text-white cursor-wait" :
                    saveStatus === "error" ? "bg-admin-danger-text text-white" :
                    hasData ? "bg-admin-accent hover:bg-admin-accent-hover text-white" :
                    "bg-admin-border text-admin-placeholder cursor-not-allowed"
                  }`}
              >
                {saveStatus === "saving" ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : saveStatus === "saved" ? (
                  <CheckCircle2 size={14} />
                ) : saveStatus === "error" ? (
                  <AlertTriangle size={14} />
                ) : (
                  <Save size={14} />
                )}
                {saveStatus === "saving" ? "Menyimpan..." :
                  saveStatus === "saved" ? "Tersimpan" :
                  saveStatus === "error" ? "Gagal" : "Simpan Data"}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-3" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari nama, NIK, prodi, email, status P3KE..."
              className="w-full pl-10 pr-10 py-2.5 bg-admin-surface-soft border border-admin-border rounded-xl text-sm text-admin-text placeholder:text-admin-placeholder focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-admin-surface-soft hover:bg-admin-border rounded-full transition-colors"
              >
                <X size={11} className="text-admin-text-3" />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-admin-surface-soft border-b border-admin-border-soft hover:bg-admin-surface-soft">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ minWidth: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-admin-text-3 hover:text-admin-accent transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUp size={11} className="text-admin-accent" />,
                            desc: <ArrowDown size={11} className="text-admin-accent" />,
                          }[header.column.getIsSorted() as string] ?? (
                            header.column.getCanSort() ? (
                              <ArrowUpDown size={10} className="text-admin-text-5" />
                            ) : null
                          )}
                        </button>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.original.hasErrors
                        ? "bg-admin-warn-bg/40 hover:bg-admin-warn-bg/70"
                        : "hover:bg-admin-surface-soft"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 text-sm text-admin-text-2 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-admin-text-5 text-sm">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="bg-admin-surface-soft px-6 py-4 border-t border-admin-border-soft flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-admin-text-3">
            Menampilkan{" "}
            <span className="font-bold text-admin-text-2">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-admin-text-2">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            baris{globalFilter ? " (terfilter)" : ""}
          </p>

          <div className="flex items-center gap-1">
            {[
              { icon: ChevronsLeft, action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
              { icon: ChevronLeft, action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-3 hover:bg-admin-accent/10 hover:text-admin-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon size={15} />
              </button>
            ))}

            <span className="px-3 py-1 text-xs font-bold text-admin-accent-ink bg-admin-accent/10 rounded-lg border border-admin-accent/20">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>

            {[
              { icon: ChevronRight, action: () => table.nextPage(), disabled: !table.getCanNextPage() },
              { icon: ChevronsRight, action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
            ].map(({ icon: Icon, action, disabled }, i) => (
              <button
                key={i}
                onClick={action}
                disabled={disabled}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-3 hover:bg-admin-accent/10 hover:text-admin-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info incomplete */}
      {errorCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 bg-admin-warn-bg-2 border border-admin-warn-border rounded-xl flex items-start gap-3"
        >
          <Lightbulb size={18} className="text-admin-warn-text mt-0.5 shrink-0" />
          <div>
            <h5 className="text-sm font-bold text-admin-warn-text mb-0.5">
              {errorCount} data belum lengkap
            </h5>
            <p className="text-xs text-admin-warn-text/85">
              Kolom wajib (Nama, No. Pendaftaran KIP, NIK, Email) kosong. Data tetap dapat disimpan dan akan ditandai untuk verifikasi manual.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
