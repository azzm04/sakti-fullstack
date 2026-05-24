'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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
} from '@tanstack/react-table';
import { CandidateData } from '@/schemas';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Table2, FileText, Database, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Save, Search, X, ArrowUpDown, ArrowUp, ArrowDown,
  Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Lightbulb, ShieldCheck, ShieldX, Clock,
} from 'lucide-react';

interface Props {
  data: CandidateData[];
  fileName: string;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  hasData?: boolean;
}

const columnHelper = createColumnHelper<CandidateData>();

// Format currency
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// Status badge component
function StatusBadge({ status }: { status: string }) {
  if (!status) return <span className="text-muted-foreground/50">—</span>;

  const config: Record<string, { bg: string; Icon: typeof ShieldCheck }> = {
    'Tersertifikasi':       { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', Icon: ShieldCheck },
    'Tidak Tersertifikasi': { bg: 'bg-red-100 text-red-700 border-red-200', Icon: ShieldX },
    'Proses Verifikasi':    { bg: 'bg-amber-100 text-amber-700 border-amber-200', Icon: Clock },
  };

  const badge = config[status];
  if (!badge) return <span className="text-xs text-muted-foreground">{status}</span>;

  const { Icon } = badge;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.bg}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

// Cell renderer for empty values
function CellValue({ value, isNumber }: { value: any; isNumber?: boolean }) {
  if (value === null || value === undefined || value === '' || (isNumber && value === 0)) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  if (isNumber && typeof value === 'number') {
    return <span className="font-medium text-foreground">{formatCurrency(value)}</span>;
  }
  return <>{value}</>;
}

export default function DataPreviewTable({ data, fileName, onSave, saveStatus = "idle", hasData = false }: Props) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Define all columns
  const columns = useMemo<ColumnDef<CandidateData, any>[]>(() => [
    columnHelper.accessor('no', {
      header: 'No',
      cell: (info) => (
        <span className="font-bold text-primary">{info.getValue()}</span>
      ),
      size: 60,
    }),
    columnHelper.accessor('no_pendaftaran_kipk', {
      header: 'No. Pendaftaran KIPK',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 180,
    }),
    columnHelper.accessor('no_bantuan_sosial', {
      header: 'No. Bantuan Sosial',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 160,
    }),
    columnHelper.accessor('nama', {
      header: 'Nama Lengkap',
      cell: (info) => (
        <span className="font-semibold text-foreground">{info.getValue() || '—'}</span>
      ),
      size: 200,
    }),
    columnHelper.accessor('prodi', {
      header: 'Program Studi',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 160,
    }),
    columnHelper.accessor('nik', {
      header: 'NIK',
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          <CellValue value={info.getValue()} />
        </span>
      ),
      size: 160,
    }),
    columnHelper.accessor('nisn', {
      header: 'NISN',
      cell: (info) => (
        <span className="font-mono text-xs text-muted-foreground">
          <CellValue value={info.getValue()} />
        </span>
      ),
      size: 120,
    }),
    columnHelper.accessor('asal_sekolah', {
      header: 'Asal Sekolah',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 180,
    }),
    columnHelper.accessor('jalur_masuk', {
      header: 'Jalur Masuk',
      cell: (info) => {
        const val = info.getValue();
        if (!val) return <span className="text-muted-foreground/50">—</span>;
        return (
          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            {val}
          </span>
        );
      },
      size: 110,
    }),
    columnHelper.accessor('no_hp', {
      header: 'No. HP',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 140,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 200,
    }),
    // Extended columns
    columnHelper.accessor('no_kartu_keluarga', {
      header: 'No. Kartu Keluarga',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 170,
    }),
    columnHelper.accessor('status_dtsen', {
      header: 'Status DTSEN',
      cell: (info) => <StatusBadge status={info.getValue()} />,
      size: 170,
    }),
    columnHelper.accessor('jumlah_tanggungan', {
      header: 'Jml. Tanggungan',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 130,
    }),
    columnHelper.accessor('jumlah_orang_rumah', {
      header: 'Jml. Orang Rumah',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 140,
    }),
    columnHelper.accessor('pekerjaan_ayah', {
      header: 'Pekerjaan Ayah',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 150,
    }),
    columnHelper.accessor('pekerjaan_ibu', {
      header: 'Pekerjaan Ibu',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 150,
    }),
    columnHelper.accessor('penghasilan_ayah', {
      header: 'Penghasilan Ayah',
      cell: (info) => <CellValue value={info.getValue()} isNumber />,
      size: 150,
    }),
    columnHelper.accessor('penghasilan_ibu', {
      header: 'Penghasilan Ibu',
      cell: (info) => <CellValue value={info.getValue()} isNumber />,
      size: 150,
    }),
    columnHelper.accessor('kab_kota', {
      header: 'Kab/Kota',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 140,
    }),
    columnHelper.accessor('provinsi', {
      header: 'Provinsi',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 140,
    }),
    columnHelper.accessor('alamat', {
      header: 'Alamat',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 220,
    }),
    columnHelper.accessor('pbb', {
      header: 'PBB',
      cell: (info) => <CellValue value={info.getValue()} isNumber />,
      size: 140,
    }),
    columnHelper.accessor('daya_listrik', {
      header: 'Daya Listrik',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 110,
    }),
    columnHelper.accessor('koordinat', {
      header: 'Koordinat',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 170,
    }),
    columnHelper.accessor('latitude', {
      header: 'Latitude',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 100,
    }),
    columnHelper.accessor('longitude', {
      header: 'Longitude',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 100,
    }),
    columnHelper.accessor('catatan_admin', {
      header: 'Catatan Admin',
      cell: (info) => <CellValue value={info.getValue()} />,
      size: 160,
    }),
  ], []);

  // Column visibility based on toggle
  const columnVisibility: VisibilityState = useMemo(() => {
    if (showAllColumns) {
      return {} as VisibilityState;
    }
    return {
      no_kartu_keluarga: false,
      status_dtsen: false,
      jumlah_tanggungan: false,
      jumlah_orang_rumah: false,
      pekerjaan_ayah: false,
      pekerjaan_ibu: false,
      penghasilan_ayah: false,
      penghasilan_ibu: false,
      kab_kota: false,
      provinsi: false,
      alamat: false,
      pbb: false,
      daya_listrik: false,
      koordinat: false,
      latitude: false,
      longitude: false,
      catatan_admin: false,
    } as VisibilityState;
  }, [showAllColumns]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 50 },
    },
  });

  const errorCount = data.filter(d => d.hasErrors).length;
  const validCount = data.length - errorCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="bg-tertiary rounded-2xl shadow-xl shadow-primary/5 overflow-hidden border border-border">

        {/* Header */}
        <div className="px-6 py-5 border-b border-border bg-muted/30">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Table2 size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-foreground tracking-tight">
                    Data Preview
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileText size={12} />
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                  <Database size={13} className="text-primary" />
                  <span className="text-xs font-bold text-primary">{data.length} Baris</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">{validCount} Valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border border-border">
                    <Info size={13} className="text-muted-foreground" />
                    <span className="text-xs font-bold text-secondary">{errorCount} Belum Lengkap</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all duration-200 flex items-center gap-2 active:scale-95"
              >
                {showAllColumns ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAllColumns ? 'Kolom Dasar' : 'Semua Kolom'}
              </button>

              <button
                onClick={onSave}
                disabled={!hasData || saveStatus === "saving" || saveStatus === "saved"}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-2 active:scale-95 ${
                  saveStatus === "saved" ? "bg-emerald-500 text-white" :
                  saveStatus === "saving" ? "bg-primary/70 text-primary-foreground cursor-wait" :
                  saveStatus === "error" ? "bg-destructive text-destructive-foreground" :
                  hasData ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" :
                  "bg-muted text-muted-foreground cursor-not-allowed border border-border"
                }`}
              >
                {saveStatus === "saving"
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : saveStatus === "saved" ? <CheckCircle2 size={14} />
                  : saveStatus === "error" ? <AlertTriangle size={14} />
                  : <Save size={14} />
                }
                {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : saveStatus === "error" ? "Gagal" : "Simpan Data"}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Cari berdasarkan nama, NIK, prodi, atau data lainnya..."
              className="w-full pl-12 pr-10 py-3 bg-tertiary border border-input rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            />
            {globalFilter && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                <X size={12} className="text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 whitespace-nowrap"
                      style={{ minWidth: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUp size={12} className="text-primary" />,
                            desc: <ArrowDown size={12} className="text-primary" />,
                          }[header.column.getIsSorted() as string] ?? (
                            header.column.getCanSort() ? <ArrowUpDown size={11} className="text-muted-foreground/50" /> : null
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
                        ? 'bg-muted/30 hover:bg-muted/50'
                        : 'hover:bg-muted/30'
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3 text-sm text-foreground/80 whitespace-nowrap"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    Tidak ada data ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer / Pagination */}
        <div className="bg-muted/30 px-6 py-4 border-t border-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
              <Info size={14} />
              Menampilkan{' '}
              <span className="font-bold text-foreground">
                {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
                –
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
              </span>
              {' '}dari{' '}
              <span className="font-bold text-foreground">{table.getFilteredRowModel().rows.length}</span> baris
              {globalFilter && ' (terfilter)'}
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <span className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-lg border border-primary/20">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info hint for incomplete data */}
      {errorCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 bg-muted/50 border border-border rounded-xl flex items-start gap-3"
        >
          <Lightbulb size={20} className="text-secondary mt-0.5 shrink-0" />
          <div>
            <h5 className="text-sm font-bold text-foreground mb-1">Info: Beberapa Data Belum Lengkap</h5>
            <p className="text-xs text-muted-foreground">
              Terdapat <span className="font-bold text-foreground">{errorCount} data</span> yang belum lengkap (kolom wajib kosong).
              Anda tetap bisa menyimpan — data tersebut akan ditandai untuk verifikasi manual.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
