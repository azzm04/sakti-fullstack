"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CandidateData } from "@/app/admin/import/page";

interface Props {
  data: CandidateData[];
  fileName: string;
}

export default function DataPreviewTable({ data, fileName }: Props) {
  // Show only first 8 rows for preview
  const previewData = data.slice(0, 8);
  const [showAllColumns, setShowAllColumns] = useState(false);

  // Define column groups
  const basicColumns = [
    { key: "no", label: "No", width: "w-16" },
    { key: "nama", label: "Nama", width: "min-w-[180px]" },
    { key: "nim", label: "NIM", width: "min-w-[120px]" },
    { key: "prodi", label: "Prodi", width: "min-w-[150px]" },
    { key: "fakultas", label: "Fakultas", width: "min-w-[150px]" },
    { key: "email", label: "Email", width: "min-w-[200px]" },
    { key: "no_hp", label: "No. Telp", width: "min-w-[120px]" },
  ];

  const extendedColumns = [
    { key: "verifikasi", label: "Verifikasi", width: "min-w-[100px]" },
    { key: "nik", label: "NIK", width: "min-w-[150px]" },
    { key: "golongan_ukt", label: "Gol. UKT", width: "min-w-[100px]" },
    {
      key: "penghasilan_bapak",
      label: "Penghasilan Ayah",
      width: "min-w-[150px]",
      isNumber: true,
    },
    {
      key: "penghasilan_ibu",
      label: "Penghasilan Ibu",
      width: "min-w-[150px]",
      isNumber: true,
    },
    {
      key: "jumlah_tanggungan_dalam_kk",
      label: "Tanggungan",
      width: "min-w-[100px]",
    },
    { key: "rekomendasi", label: "Rekomendasi", width: "min-w-[180px]" },
    { key: "pewawancara", label: "Pewawancara", width: "min-w-[150px]" },
  ];

  const displayColumns = showAllColumns
    ? [...basicColumns, ...extendedColumns]
    : basicColumns;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCellValue = (row: any, key: string, isNumber?: boolean) => {
    const value = row[key];

    if (!value || value === "" || value === 0) {
      return <span className="text-error italic text-[11px]">Data Kosong</span>;
    }

    if (isNumber && typeof value === "number") {
      return formatCurrency(value);
    }

    return value;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-lowest rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-surface-container-high flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h4 className="text-sm font-bold text-on-surface font-headline">
            Data Preview ({data.length} Rows Loaded)
          </h4>
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {fileName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data.some((d) => d.hasErrors) && (
            <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold rounded uppercase">
              Verifikasi Dibutuhkan
            </span>
          )}
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-xs">
              {showAllColumns ? "visibility_off" : "visibility"}
            </span>
            {showAllColumns ? "Sembunyikan" : "Tampilkan"} Semua Kolom
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low">
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {previewData.map((row, idx) => (
              <motion.tr
                key={row.no || idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`transition-colors ${
                  row.hasErrors
                    ? "bg-error-container/20 hover:bg-error-container/30"
                    : "hover:bg-surface-container-low"
                }`}
              >
                {displayColumns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-xs ${
                      col.key === "no" && row.hasErrors
                        ? "font-bold text-error"
                        : ""
                    } ${col.key === "nama" ? "font-semibold" : ""} ${
                      col.key === "nik" || col.key === "nim"
                        ? "text-on-surface-variant font-mono"
                        : ""
                    }`}
                  >
                    {col.key === "no"
                      ? row.no
                      : getCellValue(
                          row,
                          col.key,
                          col.key === "penghasilan_bapak" ||
                            col.key === "penghasilan_ibu",
                        )}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {data.length > 8 && (
        <div className="px-6 py-3 bg-surface-container-low text-center">
          <p className="text-[11px] text-on-surface-variant">
            Menampilkan 8 dari {data.length} baris data.
            <span className="text-primary font-semibold ml-1">
              Simpan untuk melihat semua data.
            </span>
          </p>
        </div>
      )}
    </motion.div>
  );
}
