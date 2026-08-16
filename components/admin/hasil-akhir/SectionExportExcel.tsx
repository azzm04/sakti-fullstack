"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Download,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Jalur options (sesuai dokumen pengumuman UNDIP) ───────────────────────────
const JALUR_OPTIONS = [
  {
    key: "SNBP_ELIGIBLE",
    label: "SNBP Eligible",
    color: "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25",
  },
  {
    key: "SNBP_NON_ELIGIBLE",
    label: "SNBP Non-Eligible",
    color: "bg-admin-accent/10 text-admin-accent border-admin-accent/25",
  },
  {
    key: "SNBT_ELIGIBLE",
    label: "SNBT Eligible",
    color: "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25",
  },
  {
    key: "SNBT_NON_ELIGIBLE",
    label: "SNBT Non-Eligible",
    color: "bg-admin-accent/10 text-admin-accent border-admin-accent/25",
  },
  {
    key: "UM",
    label: "Ujian Mandiri (UM)",
    color: "bg-admin-warn-bg-2 text-admin-warn-text border-admin-warn-border",
  },
  {
    key: "SBUB",
    label: "SBUB",
    color: "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25",
  },
] as const;

type JalurKey = (typeof JALUR_OPTIONS)[number]["key"];

type KandidatRow = {
  no: number;
  nama: string;
  nisn: string;
  prodi: string;
  jalur_masuk: string;
  lolos: boolean; 
};

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function SectionExportExcel() {
  const [selected, setSelected] = useState<Set<JalurKey>>(
    new Set(["SNBP_ELIGIBLE"]),
  );
  
  // State untuk Tahun Seleksi
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggleJalur(key: JalurKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setStatus("idle");
  }

  function toggleAll() {
    if (selected.size === JALUR_OPTIONS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(JALUR_OPTIONS.map((j) => j.key)));
    }
    setStatus("idle");
  }

  async function handleExport() {
    if (selected.size === 0) {
      setErrorMsg("Pilih minimal satu jalur masuk.");
      setStatus("error");
      return;
    }
    if (!tahun || tahun < 2000) {
      setErrorMsg("Tahun seleksi tidak valid.");
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");

    try {
      // Fetch data dari API — filter by jalur & tahun
      const jalurParam = Array.from(selected).join(",");
      const res = await fetch(
        `/api/admin/hasil-akhir/export?jalur=${encodeURIComponent(jalurParam)}&tahun=${tahun}`,
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Gagal mengambil data dari server");
      }

      const json: { data: KandidatRow[] } = await res.json();
      const rawRows = json.data ?? [];

      const rows = rawRows.filter((r) => r.lolos === true);

      if (rows.length === 0) {
        throw new Error(`Tidak ada data penerima yang Lolos untuk jalur terpilih pada tahun ${tahun}.`);
      }

      // Build Excel dengan XLSX
      const wb = XLSX.utils.book_new();

      if (selected.size === 1) {
        // Single sheet
        const jalurLabel =
          JALUR_OPTIONS.find((j) => j.key === Array.from(selected)[0])?.label ??
          "Data";
        const ws = XLSX.utils.json_to_sheet(
          rows.map((r, i) => ({
            No: i + 1,
            "Nama Siswa": r.nama,
            NISN: r.nisn, 
            Prodi: r.prodi,
          })),
        );
        styleSheet(ws);
        XLSX.utils.book_append_sheet(wb, ws, jalurLabel.slice(0, 31));
      } else {
        // Multi sheet — mapping string jalur database yang benar
        const JALUR_STRING_MAP: Record<string, string[]> = {
          SNBP_ELIGIBLE:     ["SNBP", "SNBP Eligible", "SNBP_ELIGIBLE"], 
          SNBP_NON_ELIGIBLE: ["SNBP non-eligible", "SNBP Non-Eligible"],
          SNBT_ELIGIBLE:     ["SNBT", "SNBT Eligible", "SNBT_ELIGIBLE"],
          SNBT_NON_ELIGIBLE: ["SNBT non-eligible", "SNBT Non-Eligible"],
          UM:                ["UM", "Ujian Mandiri"],
          SBUB:              ["SBUB"],
        };

        for (const key of selected) {
          const jalurLabel = JALUR_OPTIONS.find((j) => j.key === key)?.label ?? key;
          const allowedValues = JALUR_STRING_MAP[key] ?? [];
          
          // Filter berdasarkan kecocokan string di database
          const filtered = rows.filter((r) => allowedValues.includes(r.jalur_masuk));
          
          if (filtered.length > 0) {
            const ws = XLSX.utils.json_to_sheet(
              filtered.map((r, i) => ({
                No: i + 1,
                "Nama Siswa": r.nama,
                NISN: r.nisn,
                Prodi: r.prodi,
              })),
            );
            styleSheet(ws);
            XLSX.utils.book_append_sheet(wb, ws, jalurLabel.slice(0, 31));
          }
        }
      }

      // Penamaan file dinamis menggunakan state tahun
      XLSX.writeFile(wb, `Penerima_KIPK_${tahun}.xlsx`);
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-admin-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-admin-accent/10 text-admin-accent flex items-center justify-center">
          <FileSpreadsheet size={17} />
        </div>
        <div>
          <h2 className="font-admin-heading font-bold text-admin-text text-base">
            Export Data Penerima (Lolos) ke Excel
          </h2>
          <p className="text-xs text-admin-text-3 mt-0.5">
            Hanya mengekspor kandidat yang lolos (Diusulkan). Format: No | Nama Siswa | NISN | Prodi
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Pilih Tahun Seleksi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-admin-surface-soft/50 p-4 rounded-xl border border-admin-border">
          <div>
            <label className="text-sm font-semibold text-admin-text block">Tahun Seleksi</label>
            <p className="text-xs text-admin-text-3 mt-0.5">Filter data penerima KIP-K berdasarkan tahun.</p>
          </div>
          <div className="w-full md:w-32">
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="w-full px-4 py-2.5 text-sm font-semibold border border-admin-border rounded-lg bg-white focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 transition-all"
            />
          </div>
        </div>

        {/* Pilih Jalur */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-admin-text">
              Pilih Jalur Masuk
            </p>
            <button
              onClick={toggleAll}
              className="text-xs font-semibold text-admin-accent hover:underline underline-offset-2"
            >
              {selected.size === JALUR_OPTIONS.length
                ? "Batal Semua"
                : "Pilih Semua"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {JALUR_OPTIONS.map(({ key, label, color }) => {
              const isSelected = selected.has(key);
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => toggleJalur(key)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                    isSelected
                      ? `${color} shadow-sm`
                      : "bg-admin-surface-soft border-admin-border text-admin-text-3 hover:border-admin-text-6"
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={15} className="shrink-0" />
                  ) : (
                    <Square size={15} className="shrink-0" />
                  )}
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 px-4 py-2.5 bg-admin-accent/5 border border-admin-accent/15 rounded-xl text-sm text-admin-accent font-medium"
          >
            <CheckCircle2 size={14} />
            {selected.size} jalur dipilih ·{" "}
            {Array.from(selected)
              .map((k) => JALUR_OPTIONS.find((j) => j.key === k)?.label)
              .join(", ")}
          </motion.div>
        )}

        {/* Status feedback */}
        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-admin-accent/10 border border-admin-accent/25 rounded-xl text-sm font-semibold text-admin-accent-ink"
            >
              <CheckCircle2 size={15} /> File Excel berhasil diunduh!
            </motion.div>
          )}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 px-4 py-3 bg-admin-danger-bg border border-admin-danger-border rounded-xl text-sm font-semibold text-admin-danger-text"
            >
              <AlertCircle size={15} /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action */}
        <motion.button
          whileHover={{ scale: selected.size > 0 && !loading ? 1.01 : 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          disabled={loading || selected.size === 0}
          className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-admin-accent text-white rounded-xl text-sm font-semibold hover:bg-admin-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Menyiapkan file...
            </>
          ) : (
            <>
              <Download size={15} /> Download Excel
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ── Helper: set column widths ─────────────────────────────────────────────────
function styleSheet(ws: XLSX.WorkSheet) {
  ws["!cols"] = [
    { wch: 5 }, // No
    { wch: 40 }, // Nama
    { wch: 18 }, // NISN
    { wch: 35 }, // Prodi
  ];
}