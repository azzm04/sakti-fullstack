"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CandidateData } from "@/schemas";

interface Props {
  data: CandidateData[];
  fileName: string;
  isSaved?: boolean;
}

const PAGE_SIZE = 100;

const BASIC_COLS = [
  { key: "no",                  label: "No",                   mono: false },
  { key: "no_pendaftaran_kipk", label: "No. Pendaftaran KIPK", mono: true  },
  { key: "nama",                label: "Nama",                 mono: false },
  { key: "prodi",               label: "Prodi",                mono: false },
  { key: "nik",                 label: "NIK",                  mono: true  },
  { key: "no_hp",               label: "No. Telp",             mono: true  },
  { key: "email",               label: "Alamat Email",         mono: false },
];

const EXTENDED_COLS = [
  { key: "no_kartu_keluarga",          label: "No. Kartu Keluarga",        mono: true  },
  { key: "nik_kepala_keluarga",        label: "NIK Kepala Keluarga",       mono: true  },
  { key: "nisn",                       label: "NISN",                      mono: true  },
  { key: "status_dtks",                label: "Status DTKS",               mono: false },
  { key: "validasi_dtks",              label: "Validasi DTKS",             mono: false },
  { key: "status_p3ke",                label: "Status P3KE",               mono: false },
  { key: "validasi_p3ke",              label: "Validasi P3KE",             mono: false },
  { key: "no_kip",                     label: "No. KIP",                   mono: true  },
  { key: "validasi_kip",               label: "Validasi KIP",              mono: false },
  { key: "no_kks",                     label: "No. KKS",                   mono: true  },
  { key: "asal_sekolah",               label: "Asal Sekolah",              mono: false },
  { key: "kab_kota_sekolah",           label: "Kab/Kota Sekolah",          mono: false },
  { key: "provinsi_sekolah",           label: "Provinsi Sekolah",          mono: false },
  { key: "tempat_lahir",               label: "Tempat Lahir",              mono: false },
  { key: "tanggal_lahir",              label: "Tanggal Lahir",             mono: false },
  { key: "jenis_kelamin",              label: "Jenis Kelamin",             mono: false },
  { key: "alamat_tinggal",             label: "Alamat Tinggal",            mono: false },
  { key: "sosial_media",               label: "IG/Twitter/TikTok",         mono: false },
  { key: "nama_ayah",                  label: "Nama Ayah",                 mono: false },
  { key: "pekerjaan_ayah",             label: "Pekerjaan Ayah",            mono: false },
  { key: "ket_pekerjaan_ayah",         label: "Ket. Pekerjaan Ayah",       mono: false },
  { key: "penghasilan_ayah",           label: "Penghasilan Ayah",          mono: false, isCurrency: true },
  { key: "ket_penghasilan_ayah",       label: "Ket. Penghasilan Ayah/bln", mono: false },
  { key: "status_ayah",                label: "Status Ayah",               mono: false },
  { key: "nama_ibu",                   label: "Nama Ibu",                  mono: false },
  { key: "pekerjaan_ibu",              label: "Pekerjaan Ibu",             mono: false },
  { key: "ket_pekerjaan_ibu",          label: "Ket. Pekerjaan Ibu",        mono: false },
  { key: "penghasilan_ibu",            label: "Penghasilan Ibu",           mono: false, isCurrency: true },
  { key: "ket_penghasilan_ibu",        label: "Ket. Penghasilan Ibu/bln",  mono: false },
  { key: "status_ibu",                 label: "Status Ibu",                mono: false },
  { key: "wali",                       label: "Wali (jika ada)",           mono: false },
  { key: "penghasilan_lain",           label: "Penghasilan Lain/bln",      mono: false, isCurrency: true },
  { key: "jumlah_tanggungan",          label: "Jumlah Tanggungan",         mono: false },
  { key: "jml_tanggungan_sebenarnya",  label: "Jml Tanggungan Sebenarnya", mono: false },
  { key: "nominal_per_kapita",         label: "Nominal per Kapita",        mono: false, isCurrency: true },
  { key: "kepemilikan_rumah",          label: "Kepemilikan Rumah",         mono: false },
  { key: "tahun_perolehan",            label: "Tahun Perolehan",           mono: false },
  { key: "sumber_listrik",             label: "Sumber Listrik",            mono: false },
  { key: "luas_tanah",                 label: "Luas Tanah",                mono: false },
  { key: "luas_bangunan",              label: "Luas Bangunan",             mono: false },
  { key: "sumber_air",                 label: "Sumber Air",                mono: false },
  { key: "mck",                        label: "MCK",                       mono: false },
  { key: "kondisi_rumah",              label: "Kondisi Rumah",             mono: false },
  { key: "jarak_pusat_kota",           label: "Jarak Pusat Kota (KM)",     mono: false },
  { key: "prestasi",                   label: "Prestasi",                  mono: false },
  { key: "rekomendasi",                label: "Rekomendasi",               mono: false },
  { key: "alasan",                     label: "Alasan",                    mono: false },
  { key: "pewawancara",                label: "Nama Pewawancara",          mono: false },
];

const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

export default function DataPreviewTable({ data, fileName, isSaved = false }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [page, setPage]       = useState(1);

  // Setelah saved, otomatis tampilkan semua kolom (termasuk kolom pewawancara yang baru)
  const effectiveShowAll = isSaved || showAll;
  const cols       = effectiveShowAll ? [...BASIC_COLS, ...EXTENDED_COLS] : BASIC_COLS;
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const pageData   = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasErrors  = data.some((d) => d.hasErrors);

  const cellValue = (row: any, key: string, isCurrency?: boolean) => {
    if (key === "no") return row.no;
    const val = row[key];
    if (val === undefined || val === null || val === "" || val === 0) return null;
    if (isCurrency && typeof val === "number") return fmt.format(val);
    return String(val);
  };

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 border-b border-slate-200">
        <div>
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            Data Preview
            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-md text-[11px] font-mono font-bold">
              {data.length} Baris
            </span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[250px] sm:max-w-md" title={fileName}>
            {fileName}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasErrors && (
            <span className="px-2.5 py-1 bg-red-50 text-red-600 text-[11px] font-semibold rounded-md border border-red-100 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Perlu Verifikasi
            </span>
          )}
          <button
            onClick={() => setShowAll(!showAll)}
            disabled={isSaved}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all border ${
              effectiveShowAll
                ? "bg-slate-700 text-white border-slate-700 hover:bg-slate-800 shadow-sm"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 shadow-sm"
            } ${isSaved ? "opacity-60 cursor-default" : ""}`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {effectiveShowAll ? "view_column_2" : "view_week"}
            </span>
            {isSaved ? "Semua Kolom Aktif" : effectiveShowAll ? "Tampilan Ringkas" : "Tampilkan Semua Kolom"}
          </button>
        </div>
      </div>

      {/* Table — Excel style with sticky header + sticky No column */}
      <div className="overflow-auto max-h-[1000px] w-full bg-white custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap text-[12px]">
          <thead className="sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100",
                    "border-b border-slate-300 border-r border-slate-200 last:border-r-0",
                    col.key === "no"
                      ? "text-center w-12 sticky left-0 z-30 bg-slate-200 shadow-[1px_0_0_rgba(0,0,0,0.1)]"
                      : "",
                    (col as any).isCurrency ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {pageData.map((row, idx) => (
                <motion.tr
                  key={row.no ?? idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  className={[
                    "group transition-colors",
                    row.hasErrors
                      ? "bg-red-50/40 hover:bg-red-50/80"
                      : "even:bg-slate-50/50 hover:bg-blue-50/40",
                  ].join(" ")}
                >
                  {cols.map((col) => {
                    const val      = cellValue(row, col.key, (col as any).isCurrency);
                    const isEmpty  = val === null;
                    const isNoCol  = col.key === "no";
                    const isCurr   = (col as any).isCurrency;

                    return (
                      <td
                        key={col.key}
                        title={!isEmpty ? String(val) : "Data Kosong"}
                        className={[
                          "px-3 py-1.5 border-b border-slate-100 border-r border-slate-100 last:border-r-0",
                          "truncate max-w-[200px] xl:max-w-[300px]",
                          isNoCol
                            ? "sticky left-0 z-10 border-r-slate-200 shadow-[1px_0_0_rgba(0,0,0,0.03)] text-center font-medium " +
                              (row.hasErrors
                                ? "bg-red-50 font-bold text-red-600"
                                : "bg-white group-even:bg-slate-50 text-slate-400")
                            : "",
                          col.key === "nama" ? "font-semibold text-slate-800" : "",
                          col.mono ? "font-mono text-[11px] text-slate-600 tracking-tight" : "",
                          isCurr ? "text-right font-medium text-slate-700" : "text-slate-600",
                        ].join(" ")}
                      >
                        {isEmpty ? (
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[10px] italic rounded border border-slate-200 leading-none">
                            -
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Menampilkan baris{" "}
            <span className="font-semibold text-slate-700">{(page - 1) * PAGE_SIZE + 1}</span>
            {" "}hingga{" "}
            <span className="font-semibold text-slate-700">{Math.min(page * PAGE_SIZE, data.length)}</span>
          </p>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button onClick={() => goTo(1)} disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Awal">
              <span className="material-symbols-outlined text-[18px]">first_page</span>
            </button>
            <button onClick={() => goTo(page - 1)} disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div className="flex items-center px-2 border-x border-slate-100">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="w-7 h-7 flex items-center justify-center text-xs text-slate-400">…</span>
                  ) : (
                    <button key={p} onClick={() => goTo(p as number)}
                      className={`w-7 h-7 mx-0.5 flex items-center justify-center rounded text-[11px] font-semibold transition-colors ${
                        page === p ? "bg-slate-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                      }`}>
                      {p}
                    </button>
                  )
                )}
            </div>

            <button onClick={() => goTo(page + 1)} disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <button onClick={() => goTo(totalPages)} disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors" title="Akhir">
              <span className="material-symbols-outlined text-[18px]">last_page</span>
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
