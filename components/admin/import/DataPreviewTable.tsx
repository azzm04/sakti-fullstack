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
  type ColumnDef,
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
    return <span className="text-slate-300">—</span>;
  }
  if (isNumber && typeof value === "number") {
    return <span className="font-medium text-slate-700">{formatRupiah(value)}</span>;
  }
  return <>{String(value)}</>;
}

function P3KEBadge({ status }: { status: string }) {
  if (!status) return <span className="text-slate-300">—</span>;
  const isDesil = status.toLowerCase().includes("desil");
  const isBelum = status.toLowerCase().includes("belum");
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
        isBelum
          ? "bg-slate-50 text-slate-500 border-slate-200"
          : isDesil
          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      {status}
    </span>
  );
}

function DTKSBadge({ status }: { status: string }) {
  if (!status) return <span className="text-slate-300">—</span>;
  const terdata = status.toLowerCase() === "terdata";
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
        terdata
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-amber-50 text-amber-700 border-amber-200"
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

  const columns = useMemo<ColumnDef<CandidateData, unknown>[]>(
    () => [
      // ── Kolom selalu tampil ───────────────────────────────────────────────
      columnHelper.accessor("no", {
        header: "No",
        cell: (info) => (
          <span className="font-bold text-indigo-600">{info.getValue() as number}</span>
        ),
        size: 55,
      }),
      columnHelper.accessor("no_pendaftaran_kipk", {
        header: "No. Pendaftaran KIP",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-600">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 190,
      }),
      columnHelper.accessor("nama_pendaftar", {
        header: "Nama Pendaftar",
        cell: (info) => (
          <span className="font-semibold text-slate-800">{String(info.getValue() || "—")}</span>
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
          <span className="font-mono text-xs text-slate-500">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 160,
      }),
      columnHelper.accessor("nisn", {
        header: "NISN",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">
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
      columnHelper.accessor("status_dtks", {
        header: "Status DTKS",
        cell: (info) => <DTKSBadge status={String(info.getValue() ?? "")} />,
        size: 130,
      }),
      columnHelper.accessor("status_p3ke", {
        header: "Status P3KE",
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
          return v ? <span>{v} km</span> : <span className="text-slate-300">—</span>;
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
          <span className="font-mono text-xs text-slate-500">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 165,
      }),
      columnHelper.accessor("nik_kepala_keluarga", {
        header: "NIK Kepala KK",
        cell: (info) => (
          <span className="font-mono text-xs text-slate-500">
            <CellValue value={info.getValue()} />
          </span>
        ),
        size: 155,
      }),
      columnHelper.accessor("validasi_dtks", {
        header: "Validasi DTKS",
        cell: (info) => <CellValue value={info.getValue()} />,
        size: 120,
      }),
      columnHelper.accessor("validasi_p3ke", {
        header: "Validasi P3KE",
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
          if (!val) return <span className="text-slate-300">—</span>;
          return (
            <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {val}
            </span>
          );
        },
        size: 110,
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
    validasi_dtks: false,
    validasi_p3ke: false,
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                  <Table2 size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900">Data Preview</h4>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <FileText size={11} />
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                  <Database size={12} className="text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-700">{data.length} Baris</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">{validCount} Valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                    <Info size={12} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">{errorCount} Perlu Periksa</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
              >
                {showAllColumns ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAllColumns ? "Kolom Dasar" : "Semua Kolom"}
              </button>

              <button
                onClick={onSave}
                disabled={!hasData || saveStatus === "saving" || saveStatus === "saved"}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2
                  ${saveStatus === "saved" ? "bg-emerald-500 text-white" :
                    saveStatus === "saving" ? "bg-indigo-400 text-white cursor-wait" :
                    saveStatus === "error" ? "bg-red-500 text-white" :
                    hasData ? "bg-indigo-600 hover:bg-indigo-700 text-white" :
                    "bg-slate-100 text-slate-400 cursor-not-allowed"
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
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari nama, NIK, prodi, email, status P3KE..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
              >
                <X size={11} className="text-slate-600" />
              </button>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-100 hover:bg-slate-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ minWidth: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-indigo-600 transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUp size={11} className="text-indigo-500" />,
                            desc: <ArrowDown size={11} className="text-indigo-500" />,
                          }[header.column.getIsSorted() as string] ?? (
                            header.column.getCanSort() ? (
                              <ArrowUpDown size={10} className="text-slate-300" />
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
                        ? "bg-amber-50/40 hover:bg-amber-50/60"
                        : "hover:bg-slate-50/80"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400 text-sm">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <p className="text-xs text-slate-500">
            Menampilkan{" "}
            <span className="font-bold text-slate-700">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length,
              )}
            </span>{" "}
            dari{" "}
            <span className="font-bold text-slate-700">
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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <Icon size={15} />
              </button>
            ))}

            <span className="px-3 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-100">
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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
          className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
        >
          <Lightbulb size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <h5 className="text-sm font-bold text-amber-900 mb-0.5">
              {errorCount} data belum lengkap
            </h5>
            <p className="text-xs text-amber-700">
              Kolom wajib (Nama, No. Pendaftaran KIP, NIK, Email) kosong. Data tetap dapat disimpan dan akan ditandai untuk verifikasi manual.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
