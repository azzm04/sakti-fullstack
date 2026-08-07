"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload, FileText, Trash2, CheckCircle2, AlertCircle,
  Loader2, Calendar, HardDrive, CheckSquare, Square,
  RefreshCw, Eye,
} from "lucide-react";

// ── Jalur options ─────────────────────────────────────────────────────────────
const JALUR_OPTIONS = [
  { key: "SNBP_ELIGIBLE",     label: "SNBP Eligible"      },
  { key: "SNBP_NON_ELIGIBLE", label: "SNBP Non-Eligible"  },
  { key: "SNBT_ELIGIBLE",     label: "SNBT Eligible"      },
  { key: "SNBT_NON_ELIGIBLE", label: "SNBT Non-Eligible"  },
  { key: "UM",                label: "Ujian Mandiri (UM)" },
  { key: "SBUB",              label: "SBUB"               },
] as const;

type JalurKey = (typeof JALUR_OPTIONS)[number]["key"];

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

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function SectionImportSK() {
  const [skList, setSkList]     = useState<SKDokumen[]>([]);
  const [loading, setLoading]   = useState(true);

  // Upload state
  const [file, setFile]                   = useState<File | null>(null);
  const [jalurTerpilih, setJalurTerpilih] = useState<Set<JalurKey>>(new Set());
  const [catatan, setCatatan]             = useState("");
  const [uploading, setUploading]         = useState(false);
  const [uploadStatus, setUploadStatus]   = useState<"idle" | "success" | "error">("idle");
  const [uploadError, setUploadError]     = useState("");

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSK = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/hasil-akhir/sk-dokumen");
      const json = await res.json();
      setSkList(json.data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSK(); }, [fetchSK]);

  function toggleJalur(key: JalurKey) {
    setJalurTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setUploadStatus("idle");
  }

  async function handleUpload() {
    if (!file) { setUploadError("Pilih file PDF terlebih dahulu."); setUploadStatus("error"); return; }
    const MAX_FILE_SIZE_MB = 5;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`Ukuran file terlalu besar. Maksimal ${MAX_FILE_SIZE_MB} MB.`);
      setUploadStatus("error");
      return;
    }
    if (jalurTerpilih.size === 0) { setUploadError("Pilih minimal satu jalur masuk."); setUploadStatus("error"); return; }

    setUploading(true);
    setUploadStatus("idle");

    try {
      const formData = new FormData();
      formData.append("file",         file);
      formData.append("jalur_masuk",  JSON.stringify(Array.from(jalurTerpilih)));
      formData.append("catatan",      catatan);

      const res  = await fetch("/api/admin/hasil-akhir/sk-dokumen", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload gagal");

      setUploadStatus("success");
      setFile(null);
      setJalurTerpilih(new Set());
      setCatatan("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchSK();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen SK ini? Tindakan tidak bisa dibatalkan.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/hasil-akhir/sk-dokumen?id=${id}`, { method: "DELETE" });
      fetchSK();
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Upload Card ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Upload size={17} />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-base">Import Dokumen SK PDF</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload file SK yang sudah jadi — akan disimpan ke database & siap dilampirkan ke email
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* File picker */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              File PDF SK
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl px-5 py-6 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 text-center ${
                file ? "border-primary/40 bg-primary/3" : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setUploadStatus("idle"); }
                }}
              />
              {file ? (
                <>
                  <FileText size={28} className="text-primary" />
                  <p className="text-sm font-semibold text-primary">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB · Klik untuk ganti file
                  </p>
                </>
              ) : (
                <>
                  <Upload size={24} className="text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">Klik untuk pilih file PDF</p>
                  <p className="text-xs text-muted-foreground">Hanya file .pdf</p>
                </>
              )}
            </div>
          </div>

          {/* Pilih Jalur */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
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
                        ? "bg-primary/8 border-primary text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-slate-300"
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Catatan <span className="font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="cth: SK Penerima KIP-K Jalur SNBP 2025"
              className="w-full px-4 py-2.5 text-sm border border-border rounded-xl bg-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Status feedback */}
          <AnimatePresence>
            {uploadStatus === "success" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={15} /> Dokumen SK berhasil diupload!
              </motion.div>
            )}
            {uploadStatus === "error" && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
                <AlertCircle size={15} /> {uploadError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload button */}
          <motion.button
            whileTap={{ scale: !uploading ? 0.98 : 1 }}
            onClick={handleUpload}
            disabled={uploading || !file || jalurTerpilih.size === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {uploading ? <><Loader2 size={14} className="animate-spin" /> Mengupload...</> : <><Upload size={14} /> Upload SK</>}
          </motion.button>
        </div>
      </div>

      {/* ── Daftar SK tersimpan ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <h3 className="font-bold text-foreground text-sm">
              SK Tersimpan
              {!loading && (
                <span className="ml-2 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {skList.length} file
                </span>
              )}
            </h3>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={fetchSK}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground text-sm">
            <Loader2 size={15} className="animate-spin" /> Memuat...
          </div>
        ) : skList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center">
              <FileText size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Belum ada SK diupload</p>
              <p className="text-xs text-muted-foreground mt-1">Upload file SK di atas untuk mulai</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {skList.map((sk) => (
              <motion.div
                key={sk.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease }}
                className="flex items-start gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{sk.nama_file}</p>
                  {sk.catatan && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{sk.catatan}</p>
                  )}
                  {/* Jalur tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sk.jalur_masuk.map((j) => (
                      <span key={j} className="text-[10px] font-bold px-2 py-0.5 bg-primary/8 text-primary rounded-full">
                        {JALUR_OPTIONS.find((o) => o.key === j)?.label ?? j}
                      </span>
                    ))}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(sk.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive size={10} />
                      {sk.ukuran_kb} KB
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={`/api/admin/hasil-akhir/sk-dokumen/preview?id=${sk.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
                    title="Preview PDF"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(sk.id)}
                    disabled={deleting === sk.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:opacity-40 transition-colors"
                    title="Hapus SK"
                  >
                    {deleting === sk.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
