'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CandidateData } from '@/schemas';

interface Props {
  data: CandidateData[];
  fileName: string;
  onSave?: () => void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  hasData?: boolean;
}

type ColumnKey = keyof CandidateData;
type SortDirection = 'asc' | 'desc' | null;

export default function DataPreviewTable({ data, fileName, onSave, saveStatus = "idle", hasData = false }: Props) {
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<ColumnKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 100;

  // Column definitions with modern design
  const basicColumns = [
    { key: 'no' as ColumnKey, label: 'No', width: 'w-16', sortable: true },
    { key: 'nama' as ColumnKey, label: 'Nama Lengkap', width: 'min-w-[200px]', sortable: true },
    { key: 'no_pendaftaran_kipk' as ColumnKey, label: 'No. Pendaftaran', width: 'min-w-[180px]', sortable: false },
    { key: 'prodi' as ColumnKey, label: 'Program Studi', width: 'min-w-[180px]', sortable: true },
    { key: 'nik' as ColumnKey, label: 'NIK', width: 'min-w-[160px]', sortable: false },
    { key: 'email' as ColumnKey, label: 'Email', width: 'min-w-[220px]', sortable: false },
    { key: 'no_hp' as ColumnKey, label: 'No. Telepon', width: 'min-w-[140px]', sortable: false },
  ];

  const extendedColumns = [
    { key: 'no_kartu_keluarga' as ColumnKey, label: 'No. KK', width: 'min-w-[160px]', sortable: false },
    { key: 'nisn' as ColumnKey, label: 'NISN', width: 'min-w-[130px]', sortable: false },
    { key: 'status_dtks' as ColumnKey, label: 'Status DTKS', width: 'min-w-[120px]', sortable: true },
    { key: 'jenis_kelamin' as ColumnKey, label: 'Jenis Kelamin', width: 'min-w-[120px]', sortable: true },
    { key: 'penghasilan_ayah' as ColumnKey, label: 'Penghasilan Ayah', width: 'min-w-[170px]', isNumber: true, sortable: true },
    { key: 'penghasilan_ibu' as ColumnKey, label: 'Penghasilan Ibu', width: 'min-w-[170px]', isNumber: true, sortable: true },
    { key: 'jumlah_tanggungan' as ColumnKey, label: 'Tanggungan', width: 'min-w-[120px]', sortable: true },
    { key: 'rekomendasi' as ColumnKey, label: 'Rekomendasi', width: 'min-w-[180px]', sortable: true },
    { key: 'pewawancara' as ColumnKey, label: 'Pewawancara', width: 'min-w-[160px]', sortable: false },
  ];

  const displayColumns = showAllColumns ? [...basicColumns, ...extendedColumns] : basicColumns;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Get cell value with formatting
  const getCellValue = (row: any, key: string, isNumber?: boolean) => {
    const value = row[key];
    
    if (!value || value === '' || value === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-error italic text-[11px] font-medium">
          <span className="material-symbols-outlined text-[14px]">error</span>
          Data Kosong
        </span>
      );
    }
    
    if (isNumber && typeof value === 'number') {
      return <span className="font-semibold text-on-surface">{formatCurrency(value)}</span>;
    }
    
    return value;
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      'Sudah': { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-white', icon: 'check_circle' },
      'Belum': { bg: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-white', icon: 'pending' },
      'Lolos': { bg: 'bg-gradient-to-r from-blue-500 to-cyan-500', text: 'text-white', icon: 'verified' },
      'Tidak Lolos': { bg: 'bg-gradient-to-r from-red-500 to-rose-500', text: 'text-white', icon: 'cancel' },
    };

    const badge = badges[status] || { bg: 'bg-surface-container-high', text: 'text-on-surface', icon: 'label' };

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${badge.bg} ${badge.text} shadow-sm`}>
        <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
        {status}
      </span>
    );
  };

  // Search & filter
  const filteredData = useMemo(() => {
    let result = data;

    // Search
    if (searchQuery.trim()) {
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Sort
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return result;
  }, [data, searchQuery, sortColumn, sortDirection]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pageData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Handle sort
  const handleSort = (column: ColumnKey) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : sortDirection === 'desc' ? null : 'asc');
      if (sortDirection === 'desc') setSortColumn(null);
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const errorCount = data.filter(d => d.hasErrors).length;
  const validCount = data.length - errorCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Modern Card Container with Glassmorphism */}
      <div className="bg-gradient-to-br from-surface-container-lowest via-surface-container-low to-surface-container rounded-2xl shadow-2xl shadow-primary/5 overflow-hidden border border-outline-variant/20 backdrop-blur-xl">
        
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-primary/5 via-tertiary/5 to-transparent px-6 py-5 border-b border-outline-variant/30">
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-50"></div>
          
          <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-tertiary flex items-center justify-center shadow-lg shadow-primary/30">
                  <span className="material-symbols-outlined text-white text-xl">table_chart</span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface font-headline tracking-tight">
                    Data Preview
                  </h4>
                  <p className="text-[11px] text-on-surface-variant font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    {fileName}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-sm">dataset</span>
                  <span className="text-xs font-bold text-primary">{data.length} Rows</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                  <span className="text-xs font-bold text-green-700">{validCount} Valid</span>
                </div>
                {errorCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-error/10 rounded-lg border border-error/20">
                    <span className="material-symbols-outlined text-error text-sm">error</span>
                    <span className="text-xs font-bold text-error">{errorCount} Incomplete</span>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowAllColumns(!showAllColumns)}
                className="group px-4 py-2.5 bg-primary from-primary to-tertiary text-white text-xs font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center gap-2 active:scale-95"
              >
                <span className="material-symbols-outlined text-sm group-hover:rotate-12 transition-transform">
                  {showAllColumns ? 'visibility_off' : 'visibility'}
                </span>
                {showAllColumns ? 'Kolom Dasar' : 'Semua Kolom'}
              </button>

              <button
                onClick={onSave}
                disabled={!hasData || saveStatus === "saving" || saveStatus === "saved"}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95 ${
                  saveStatus === "saved" ? "bg-emerald-500 text-white" :
                  saveStatus === "saving" ? "bg-primary/70 text-white cursor-wait" :
                  saveStatus === "error" ? "bg-red-500 text-white" :
                  hasData ? "bg-primary text-white hover:shadow-lg hover:shadow-primary/30" :
                  "bg-surface-container-high text-on-surface-variant cursor-not-allowed border border-outline-variant/30"
                }`}
              >
                {saveStatus === "saving"
                  ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <span className="material-symbols-outlined text-sm">{saveStatus === "saved" ? "check_circle" : saveStatus === "error" ? "error" : "save"}</span>
                }
                {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : saveStatus === "error" ? "Gagal" : "Simpan ke Database"}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4"
          >
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama, NIM, prodi, atau data lainnya..."
                className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest/80 backdrop-blur-sm border border-outline-variant/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-error/10 hover:bg-error/20 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-error text-sm">close</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-surface-container-low to-surface-container border-b-2 border-primary/10">
                {displayColumns.map((col) => (
                  <th
                    key={String(col.key)}
                    className={`px-6 py-4 text-left ${col.width}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="group flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant hover:text-primary transition-colors"
                      >
                        {col.label}
                        <span className={`material-symbols-outlined text-sm transition-all ${
                          sortColumn === col.key
                            ? 'text-primary opacity-100'
                            : 'opacity-0 group-hover:opacity-50'
                        }`}>
                          {sortColumn === col.key && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                        {col.label}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-outline-variant/20">
                {pageData.map((row, idx) => (
                  <tr
                    key={row.no || idx}
                    className={`transition-colors ${
                      row.hasErrors
                        ? 'bg-error/5 hover:bg-error/10 border-l-4 border-error'
                        : 'hover:bg-primary/5 border-l-4 border-transparent hover:border-primary/30'
                    }`}
                  >
                    {/* Columns */}
                    {displayColumns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={`px-6 py-4 text-sm ${
                          col.key === 'no' ? 'font-bold text-primary' : ''
                        } ${
                          col.key === 'nama' ? 'font-bold text-on-surface' : ''
                        } ${
                          col.key === 'nik' ? 'text-on-surface-variant font-mono text-xs' : ''
                        }`}
                      >
                        {col.key === 'rekomendasi' ? (
                          getStatusBadge(row[col.key] as string)
                        ) : col.key === 'no' ? (
                          <div className="flex items-center gap-2">
                            {row.hasErrors && (
                              <span className="material-symbols-outlined text-error text-sm animate-pulse">
                                warning
                              </span>
                            )}
                            {row.no}
                          </div>
                        ) : (
                          getCellValue(row, String(col.key), (col as any).isNumber)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-surface-container-low to-surface-container px-6 py-4 border-t border-outline-variant/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-on-surface-variant font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">info</span>
              Menampilkan{' '}
              <span className="font-bold text-primary">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredData.length)}</span>
              {' '}dari{' '}
              <span className="font-bold text-primary">{filteredData.length}</span> baris
              {searchQuery && ' (terfilter)'}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">first_page</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>

                <span className="px-3 py-1 text-xs font-bold text-primary bg-primary/10 rounded-lg">
                  {page} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-primary/10 disabled:opacity-30 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">last_page</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Hint */}
      {errorCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl flex items-start gap-3"
        >
          <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">lightbulb</span>
          <div>
            <h5 className="text-sm font-bold text-amber-900 mb-1">Perhatian: Data Tidak Lengkap</h5>
            <p className="text-xs text-amber-800">
              Terdapat <span className="font-bold">{errorCount} data</span> yang belum lengkap. 
              Anda masih bisa menyimpan, namun data tersebut akan ditandai untuk verifikasi manual.
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}