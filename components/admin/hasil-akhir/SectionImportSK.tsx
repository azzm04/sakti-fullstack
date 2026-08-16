"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  HardDrive,
  CheckSquare,
  Square,
  RefreshCw,
  Eye,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { JALUR_OPTIONS, type JalurKey } from "@/lib/jalur";

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

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

const SK_ENDPOINT = "/api/admin/hasil-akhir/sk-dokumen";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => (json.data ?? []) as SKDokumen[]);

export default function SectionImportSK() {
  // ── Cache store data SK (SWR) ──────────────────────────────────────────────
  const {
    data: skList = [],
    isLoading: loading,
    isValidating: refreshing,
    mutate,
  } = useSWR<SKDokumen[]>(SK_ENDPOINT, fetcher, {
    revalidateOnFocus: true, // sinkron lagi begitu tab difokuskan
  });

  // ── Realtime: begitu ada perubahan di tabel sk_dokumen (dari mana pun),
  //    langsung mutate() supaya list ter-refresh sendiri tanpa refresh manual ──
  useEffect(() => {
    const channel = supabaseBrowser
      .channel("sk_dokumen_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sk_dokumen" },
        () => {
          mutate();
        },
      )
      .subscribe();

    return () => {
      supabaseBrowser.removeChannel(channel);
    };
  }, [mutate]);

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

  // Delete state
  const [deleting, setDeleting] = useState<string | null>(null);

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

      // Revalidate cache langsung (tidak perlu tunggu event Realtime).
      // Realtime tetap jalan sebagai jaring pengaman untuk tab/sesi lain.
      mutate();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setUploadStatus("error");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus dokumen SK ini? Tindakan tidak bisa dibatalkan."))
      return;
    setDeleting(id);

    // Optimistic update: hilangkan dari list dulu di UI, revalidate di belakang
    const prevList = skList;
    mutate(
      prevList.filter((sk) => sk.id !== id),
      false,
    );

    try {
      const res = await fetch(`${SK_ENDPOINT}?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus SK");
      mutate(); // revalidate untuk memastikan sinkron dengan server
    } catch {
      // Rollback kalau gagal
      mutate(prevList, false);
    } finally {
      setDeleting(null);
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

      {/* ── Daftar SK tersimpan ── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-admin-text-3" />
            <h3 className="font-admin-heading font-bold text-admin-text text-sm">
              SK Tersimpan
              {!loading && (
                <span className="ml-2 text-xs font-semibold text-admin-text-3 bg-admin-surface-soft px-2 py-0.5 rounded-full">
                  {skList.length} file
                </span>
              )}
            </h3>
          </div>
          {/* Tombol ini sekarang cuma opsional "force sync", bukan satu-satunya cara refresh */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => mutate()}
            className="w-8 h-8 rounded-lg hover:bg-admin-surface-soft flex items-center justify-center text-admin-text-3 transition-colors"
            title="Sinkronkan ulang"
          >
            <RefreshCw
              size={14}
              className={loading || refreshing ? "animate-spin" : ""}
            />
          </motion.button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-admin-text-3 text-sm">
            <Loader2 size={15} className="animate-spin" /> Memuat...
          </div>
        ) : skList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <div className="w-12 h-12 bg-admin-surface-soft rounded-2xl flex items-center justify-center">
              <FileText size={22} className="text-admin-text-3" />
            </div>
            <div>
              <p className="text-sm font-semibold text-admin-text">
                Belum ada SK diupload
              </p>
              <p className="text-xs text-admin-text-3 mt-1">
                Upload file SK di atas untuk mulai
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-admin-border">
            {skList.map((sk) => (
              <motion.div
                key={sk.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ease }}
                className="flex items-start gap-4 px-6 py-4 hover:bg-admin-surface-soft/20 transition-colors"
              >
                {/* Icon */}
                <div className="w-9 h-9 rounded-xl bg-admin-danger-bg text-admin-danger-bar flex items-center justify-center shrink-0 mt-0.5">
                  <FileText size={16} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-admin-text truncate">
                    {sk.nama_file}
                  </p>
                  {sk.catatan && (
                    <p className="text-xs text-admin-text-3 mt-0.5 truncate">
                      {sk.catatan}
                    </p>
                  )}
                  {/* Jalur tags */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {sk.jalur_masuk.map((j) => (
                      <span
                        key={j}
                        className="text-[10px] font-bold px-2 py-0.5 bg-admin-accent/8 text-admin-accent rounded-full"
                      >
                        {JALUR_OPTIONS.find((o) => o.key === j)?.label ?? j}
                      </span>
                    ))}
                  </div>
                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-admin-text-3">
                    <span className="flex items-center gap-1 font-semibold text-admin-accent">
                      Tahun {sk.tahun}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(sk.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-3 hover:bg-admin-surface-soft hover:text-admin-accent transition-colors"
                    title="Preview PDF"
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    onClick={() => handleDelete(sk.id)}
                    disabled={deleting === sk.id}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-admin-text-3 hover:bg-admin-danger-bg hover:text-admin-danger-bar disabled:opacity-40 transition-colors"
                    title="Hapus SK"
                  >
                    {deleting === sk.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
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
