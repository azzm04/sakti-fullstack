"use client";

import { useState, useRef } from "react";
import { mutate as globalMutate } from "swr";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";
import { JALUR_OPTIONS, type JalurKey } from "@/lib/jalur";
import { SK_ENDPOINT } from "./SKTersimpanCard";

// ── Tahun options ─────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 2019 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export type SKDokumen = {
  id: string;
  created_at: string;
  nama_file: string;
  storage_path: string;
  jalur_masuk: JalurKey[];
  tahun: number;
  ukuran_kb: number;
  catatan: string;
};

export default function SectionImportSK() {
  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [tahun, setTahun] = useState(String(CURRENT_YEAR));
  const [jalurTerpilih, setJalurTerpilih] = useState<Set<JalurKey>>(new Set());
  const [catatan, setCatatan] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleJalur(key: JalurKey) {
    setJalurTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setUploadStatus("idle");
  }

  async function handleUpload() {
    if (!file) {
      setUploadError("Pilih file PDF terlebih dahulu.");
      setUploadStatus("error");
      return;
    }
    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(
        `Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE_MB} MB.`,
      );
      setUploadStatus("error");
      return;
    }
    if (jalurTerpilih.size === 0) {
      setUploadError("Pilih minimal satu jalur masuk.");
      setUploadStatus("error");
      return;
    }

    setUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tahun", tahun);
      formData.append("jalur_masuk", JSON.stringify(Array.from(jalurTerpilih)));
      formData.append("catatan", catatan);

      const res = await fetch(SK_ENDPOINT, { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload gagal");

      setUploadStatus("success");
      setFile(null);
      setTahun(String(CURRENT_YEAR));
      setJalurTerpilih(new Set());
      setCatatan("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Revalidate cache SK Tersimpan (kartu ini ada di kolom sebelah) —
      // key SWR sama, jadi cukup trigger lewat mutate global.
      // Realtime di SKTersimpanCard tetap jalan sebagai jaring pengaman.
      globalMutate(SK_ENDPOINT);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ── Upload Card ── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-admin-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-admin-accent/10 text-admin-accent flex items-center justify-center">
            <Upload size={17} />
          </div>
          <div>
            <h2 className="font-admin-heading font-bold text-admin-text text-base">
              Import Dokumen SK PDF
            </h2>
            <p className="text-xs text-admin-text-3 mt-0.5">
              Upload file SK yang sudah jadi — akan disimpan ke database & siap
              dilampirkan ke email
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* File picker */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              File PDF SK
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-5 py-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                file
                  ? "border-admin-accent/40 bg-admin-accent/3"
                  : "border-admin-border hover:border-admin-accent/40 hover:bg-admin-surface-soft/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setUploadStatus("idle");
                  }
                }}
              />
              {file ? (
                <>
                  <FileText size={28} className="text-admin-accent" />
                  <p className="text-sm font-semibold text-admin-accent">
                    {file.name}
                  </p>
                  <p className="text-xs text-admin-text-3">
                    {(file.size / 1024).toFixed(0)} KB · Klik untuk ganti file
                  </p>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-admin-text-3" />
                  <p className="text-sm font-semibold text-admin-text">
                    Klik untuk pilih file PDF
                  </p>
                  <p className="text-xs text-admin-text-3">
                    Hanya file .pdf
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Tahun Seleksi */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              Tahun Seleksi
            </label>
            <div className="relative max-w-40">
              <Calendar
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-3"
              />
              <select
                value={tahun}
                onChange={(e) => {
                  setTahun(e.target.value);
                  setUploadStatus("idle");
                }}
                className="w-full appearance-none rounded-xl border border-admin-border bg-admin-surface-soft py-2.5 pl-9 pr-4 text-sm font-semibold text-admin-text outline-none transition-all focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10"
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pilih Jalur */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              Berlaku untuk Jalur Masuk
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {JALUR_OPTIONS.map(({ key, label }) => {
                const sel = jalurTerpilih.has(key);
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleJalur(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      sel
                        ? "bg-admin-accent/8 border-admin-accent text-admin-accent"
                        : "bg-admin-surface-soft border-admin-border text-admin-text-3 hover:border-admin-text-6"
                    }`}
                  >
                    {sel ? <CheckSquare size={13} /> : <Square size={13} />}
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Catatan opsional */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              Catatan <span className="font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="cth: SK Penerima KIP-K Jalur SNBP 2025"
              className="w-full px-4 py-2.5 text-sm border border-admin-border rounded-xl bg-admin-surface-soft focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 transition-all"
            />
          </div>

          {/* Status feedback */}
          <AnimatePresence>
            {uploadStatus === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-admin-accent/10 border border-admin-accent/25 rounded-xl text-sm font-semibold text-admin-accent-ink"
              >
                <CheckCircle2 size={15} /> Dokumen SK berhasil diupload!
              </motion.div>
            )}
            {uploadStatus === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-admin-danger-bg border border-admin-danger-border rounded-xl text-sm font-semibold text-admin-danger-text"
              >
                <AlertCircle size={15} /> {uploadError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload button */}
          <motion.button
            whileTap={{ scale: !uploading ? 0.98 : 1 }}
            onClick={handleUpload}
            disabled={uploading || !file || jalurTerpilih.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-admin-accent text-white rounded-xl text-sm font-semibold hover:bg-admin-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Mengupload...
              </>
            ) : (
              <>
                <Upload size={14} /> Upload SK
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
