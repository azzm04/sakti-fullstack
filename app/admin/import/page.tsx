"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, CheckCircle2,
  Info, EyeOff, Eye, LayoutTemplate, FileSpreadsheet,
  DatabaseBackup, AlertTriangle, Calendar,
} from "lucide-react";

import { type CandidateData, type ValidationSummary } from "@/schemas";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export const JALUR_OPTIONS = [
  { value: "SNBP Eligible",     label: "SNBP Eligible" },
  { value: "SNBP Non Eligible", label: "SNBP Non Eligible" },
  { value: "SNBT Eligible",     label: "SNBT Eligible" },
  { value: "SNBT Non Eligible", label: "SNBT Non Eligible" },
  { value: "UM",                label: "UM (Ujian Mandiri)" },
] as const;

export type JalurMasuk = typeof JALUR_OPTIONS[number]["value"];

export default function ImportDataPage() {
  const currentYear = new Date().getFullYear();

  const [uploadedData, setUploadedData] = useState<CandidateData[]>([]);
  const [validation, setValidation]     = useState<ValidationSummary>({
    valid: 0, incomplete: 0, duplicates: 0, total: 0,
  });
  const [fileName, setFileName]         = useState("");
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>("idle");
  const [saveProgress, setSaveProgress] = useState(0); // 0–100
  const [showUpload, setShowUpload]     = useState(true);
  const [jalurMasuk, setJalurMasuk]     = useState<JalurMasuk | "">("");
  const [tahunSeleksi, setTahunSeleksi] = useState<string>(String(currentYear));

  const hasData = uploadedData.length > 0;
  const isSaved = saveStatus === "saved";

  const tahunValid =
    /^\d{4}$/.test(tahunSeleksi) &&
    parseInt(tahunSeleksi) >= 2020 &&
    parseInt(tahunSeleksi) <= 2099;

  const canSave = hasData && !isSaved && !!jalurMasuk && tahunValid;

  const handleDataUploaded = (
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) => {
    setUploadedData(data);
    setValidation(stats);
    setFileName(filename);
    setSaveStatus("idle");
    setSaveProgress(0);
  };

  const handleSave = async () => {
    if (!canSave) return;

    setSaveStatus("saving");
    setSaveProgress(0);

    try {
      const { CandidateDataSchema, ValidationSummarySchema } = await import("@/schemas");

      const validatedRows = uploadedData.map((row) => {
        const rowWithJalur = { ...row, jalur_masuk: jalurMasuk };
        const result = CandidateDataSchema.safeParse(rowWithJalur);
        if (!result.success) {
          const issues = result.error.issues.map((e) => e.path.join("."));
          return {
            ...rowWithJalur,
            hasErrors: true,
            missingFields: Array.from(new Set([...(row.missingFields ?? []), ...issues])),
          };
        }
        return result.data;
      });

      const validationResult = ValidationSummarySchema.safeParse(validation);
      if (!validationResult.success) {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return;
      }

      // ── Kirim dalam chunk kecil (50 baris) agar tidak ECONNRESET ──────
      const CHUNK_SIZE = 50;
      const total      = validatedRows.length;
      let batchId: string | null = null;

      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk     = validatedRows.slice(i, i + CHUNK_SIZE);
        const isFirst   = i === 0;
        const progress  = Math.round(((i + chunk.length) / total) * 100);

        const res = await fetch("/api/kandidat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            fileName,
            jalurMasuk,
            tahunSeleksi: parseInt(tahunSeleksi),
            validation:   isFirst ? validationResult.data : null, // batch hanya dibuat sekali
            batchId:      batchId ?? null,                        // chunk 2+ pakai batchId yg sama
            chunkIndex:   i,
            data:         chunk,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(`Save error chunk ${i}:`, err);
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
          return;
        }

        const json = await res.json();
        if (isFirst && json.batchId) batchId = json.batchId;
        setSaveProgress(progress);
      }

      setSaveStatus("saved");
      setSaveProgress(100);
    } catch (err) {
      console.error("Network / System error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const previewData: CandidateData[] = uploadedData.map((row) => ({
    ...row,
    jalur_masuk: jalurMasuk || row.jalur_masuk,
  }));

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <span>Dashboard</span>
            <ChevronRight size={14} className="text-muted-foreground/50" />
            <span className="text-foreground">Import Data</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <DatabaseBackup size={24} />
                </div>
                Import Data Pendaftar
              </h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                Unggah file Excel/CSV, pilih tahun &amp; jalur masuk, lalu simpan ke database.
              </p>
            </div>

            {/* Status badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {hasData && (
                <button
                  onClick={() => setShowUpload((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-border bg-tertiary hover:bg-muted text-foreground transition-all shadow-sm"
                >
                  {showUpload
                    ? <EyeOff size={16} className="text-muted-foreground" />
                    : <Eye size={16} className="text-muted-foreground" />}
                  {showUpload ? "Sembunyikan Panel" : "Tampilkan Panel"}
                </button>
              )}

              <AnimatePresence mode="popLayout">
                {isSaved && (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm"
                  >
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-emerald-800 leading-none">
                        {validation.total} baris tersimpan
                      </span>
                      <span className="text-[10px] font-medium text-emerald-600 mt-0.5">
                        {tahunSeleksi} · {jalurMasuk}
                      </span>
                    </div>
                  </motion.div>
                )}

                {hasData && !isSaved && saveStatus !== "saving" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-primary/8 border border-primary/20 rounded-xl shadow-sm"
                  >
                    <FileSpreadsheet size={18} className="text-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground leading-none">
                        {validation.total} baris dimuat
                      </span>
                      <span className="text-[10px] font-medium text-primary mt-0.5">
                        {validation.valid} Valid · {validation.incomplete} Perbaikan
                        {jalurMasuk ? ` · ${jalurMasuk}` : " · Pilih jalur ↑"}
                      </span>
                    </div>
                  </motion.div>
                )}

                {saveStatus === "saving" && (
                  <motion.div
                    key="saving"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-primary/8 border border-primary/20 rounded-xl shadow-sm min-w-[160px]"
                  >
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="text-xs font-bold text-foreground leading-none mb-1">
                        Menyimpan... {saveProgress}%
                      </span>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          animate={{ width: `${saveProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* ── Left Panel ── */}
          <AnimatePresence initial={false}>
            {showUpload && (
              <motion.div
                key="upload-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0, overflow: "hidden" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="w-full xl:w-[400px] 2xl:w-[450px] shrink-0 space-y-4"
              >
                {/* ── Step 0: Tahun Seleksi ── */}
                <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">
                      0
                    </span>
                    Tahun Seleksi
                  </p>

                  <div className="relative">
                    <Calendar
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <input
                      type="number"
                      min={2020}
                      max={2099}
                      placeholder={String(currentYear)}
                      value={tahunSeleksi}
                      onChange={(e) => setTahunSeleksi(e.target.value)}
                      disabled={isSaved}
                      className={`w-full pl-9 pr-4 py-3 text-sm font-bold rounded-xl bg-background text-foreground
                        border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                        ${!tahunValid && tahunSeleksi !== ""
                          ? "border-destructive bg-destructive/5"
                          : "border-border"
                        }`}
                    />
                  </div>

                  {!tahunValid && tahunSeleksi !== "" && (
                    <p className="mt-1.5 text-[11px] text-destructive font-medium">
                      Masukkan tahun antara 2020–2099
                    </p>
                  )}
                </div>

                {/* ── Step 1: Jalur Masuk ── */}
                <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">
                      1
                    </span>
                    Pilih Jalur Masuk
                  </p>

                  <div className="grid grid-cols-1 gap-2">
                    {JALUR_OPTIONS.map((opt) => {
                      const isSelected = jalurMasuk === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setJalurMasuk(opt.value)}
                          disabled={isSaved}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all
                            ${isSelected
                              ? "bg-primary border-primary text-primary-foreground shadow-sm"
                              : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                            }
                            ${isSaved ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all
                              ${isSelected
                                ? "bg-primary-foreground border-primary-foreground"
                                : "border-muted-foreground bg-background"
                              }`}
                          />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {hasData && !jalurMasuk && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                    >
                      <AlertTriangle size={13} className="shrink-0" />
                      Wajib pilih jalur sebelum menyimpan
                    </motion.div>
                  )}
                </div>

                {/* ── Step 2: Upload File ── */}
                <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">
                      2
                    </span>
                    Unggah File
                  </p>
                  <UploadZone
                    onDataUploaded={handleDataUploaded}
                    onSave={handleSave}
                    hasData={hasData}
                    saveStatus={saveStatus}
                    jalurMasuk={jalurMasuk}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Right: Preview ── */}
          <motion.div layout className="flex-1 w-full space-y-6">
            {hasData ? (
              <div className="space-y-6">
                <DataPreviewTable
                  data={previewData}
                  fileName={fileName}
                  onSave={handleSave}
                  saveStatus={saveStatus}
                  hasData={hasData}
                  jalurMasuk={jalurMasuk}
                />

                {isSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-3xl shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center shrink-0 shadow-sm text-primary">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-foreground mb-1">
                        Data Berhasil Diunggah!
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        <b className="text-foreground">{validation.total} kandidat</b> jalur{" "}
                        <b className="text-foreground">{jalurMasuk}</b> tahun{" "}
                        <b className="text-foreground">{tahunSeleksi}</b> tersimpan di database.
                        Lanjutkan ke <b className="text-foreground">Plotting Wawancara</b>.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full min-h-[400px] bg-tertiary rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
                  <LayoutTemplate size={32} className="text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-2">
                  Belum Ada Data
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Isi tahun seleksi, pilih jalur masuk, lalu unggah file Excel/CSV
                  data pendaftar KIP-K di panel kiri.
                </p>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}
