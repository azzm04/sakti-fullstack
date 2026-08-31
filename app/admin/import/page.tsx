"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  EyeOff,
  Eye,
  LayoutTemplate,
} from "lucide-react";

import { type CandidateData, type ValidationSummary } from "@/schemas";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";
import TahunSeleksiInput from "@/components/admin/import/TahunSeleksiInput";
import JalurMasukPicker from "@/components/admin/import/JalurMasukPicker";
import ImportStatusBadge from "@/components/admin/import/ImportStatusBadge";
import ImportSuccessBanner from "@/components/admin/import/ImportSuccessBanner";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { KpiCard } from "@/components/admin/ui/KpiCard";
import { JALUR_VALUE_OPTIONS } from "@/lib/jalur";

// ── Shared constants & types (re-exported for other modules) ─────────────────
export type SaveStatus = "idle" | "saving" | "saved" | "error";

// Sumber tunggal ada di lib/jalur.ts — re-export di sini supaya komponen lama
// (JalurMasukPicker, dsb) tidak perlu ganti import path sekaligus.
export const JALUR_OPTIONS = JALUR_VALUE_OPTIONS;

export type JalurMasuk = (typeof JALUR_OPTIONS)[number]["value"];

interface ChunkResponse {
  batchId?: string;
  error?: string;
}

const CHUNK_SIZE = 50;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ImportDataPage() {
  const currentYear = new Date().getFullYear();

  const [uploadedData, setUploadedData] = useState<CandidateData[]>([]);
  const [validation, setValidation] = useState<ValidationSummary>({
    valid: 0,
    incomplete: 0,
    duplicates: 0,
    total: 0,
  });
  const [fileName, setFileName] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(true);
  const [jalurMasuk, setJalurMasuk] = useState<JalurMasuk | "">("");
  const [tahunSeleksi, setTahunSeleksi] = useState(String(currentYear));

  // ── Derived state ──────────────────────────────────────────────────────────
  const hasData = uploadedData.length > 0;
  const isSaved = saveStatus === "saved";
  const tahunValid =
    /^\d{4}$/.test(tahunSeleksi) &&
    parseInt(tahunSeleksi) >= 2020 &&
    parseInt(tahunSeleksi) <= 2099;
  const canSave = hasData && !isSaved && !!jalurMasuk && tahunValid;

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleDataUploaded(
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) {
    setUploadedData(data);
    setValidation(stats);
    setFileName(filename);
    setSaveStatus("idle");
    setSaveProgress(0);
    setSaveError(null);
  }

  async function handleSave() {
    if (!canSave) return;

    setSaveStatus("saving");
    setSaveProgress(0);
    setSaveError(null);

    try {
      const { CandidateDataSchema, ValidationSummarySchema } =
        await import("@/schemas");

      const validatedRows = uploadedData.map((row) => {
        const rowWithJalur = { ...row, jalur_masuk: jalurMasuk };
        const result = CandidateDataSchema.safeParse(rowWithJalur);
        if (!result.success) {
          const issues = result.error.issues.map((e) => e.path.join("."));
          return {
            ...rowWithJalur,
            hasErrors: true,
            missingFields: Array.from(
              new Set([...(row.missingFields ?? []), ...issues]),
            ),
          };
        }
        return result.data;
      });

      const validationResult = ValidationSummarySchema.safeParse(validation);
      if (!validationResult.success) {
        setSaveStatus("error");
        setSaveError(
          "Ringkasan validasi data tidak sesuai format. Coba unggah ulang file.",
        );
        return;
      }

      const total = validatedRows.length;
      let batchId: string | null = null;

      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = validatedRows.slice(i, i + CHUNK_SIZE);
        const isFirst = i === 0;
        const progress = Math.round(((i + chunk.length) / total) * 100);

        const res = await fetch("/api/kandidat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            jalurMasuk,
            tahunSeleksi: parseInt(tahunSeleksi),
            validation: isFirst ? validationResult.data : null,
            batchId: batchId ?? null,
            chunkIndex: i,
            data: chunk,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          let err;
          try {
            err = JSON.parse(errText);
          } catch {
            err = errText;
          }

          console.error(`Save error chunk ${i}:`, err); // Sekarang error aslinya akan terbaca
          setSaveStatus("error");
          setSaveError(
            typeof err === "string"
              ? err
              : err?.error || err?.message || `Gagal menyimpan pada baris ke-${i}.`,
          );
          return;
        }

        const json = (await res.json()) as ChunkResponse;
        if (isFirst && json.batchId) batchId = json.batchId;
        setSaveProgress(progress);
      }

      setSaveStatus("saved");
      setSaveProgress(100);
    } catch (err) {
      console.error("Network / System error:", err);
      setSaveStatus("error");
      setSaveError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan jaringan atau sistem saat menyimpan.",
      );
    }
  }

  const previewData: CandidateData[] = uploadedData.map((row) => ({
    ...row,
    jalur_masuk: jalurMasuk || row.jalur_masuk,
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        breadcrumb="Admin / Seleksi KIP-K / Import Data"
        title="Import Data Pendaftar"
        right={
          <>
            {hasData && (
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="flex items-center gap-2 px-[15px] py-[10px] text-[12.5px] font-semibold rounded-[11px] border border-admin-border bg-transparent hover:bg-admin-surface-soft text-admin-text transition-colors"
              >
                {showUpload ? (
                  <EyeOff size={15} className="text-admin-text-3" />
                ) : (
                  <Eye size={15} className="text-admin-text-3" />
                )}
                {showUpload ? "Sembunyikan Panel" : "Tampilkan Panel"}
              </button>
            )}
            <ImportStatusBadge
              saveStatus={saveStatus}
              saveProgress={saveProgress}
              saveError={saveError}
              validation={validation}
              jalurMasuk={jalurMasuk}
              tahunSeleksi={tahunSeleksi}
            />
          </>
        }
      />

      <div className="px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
        {hasData && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]">
            <KpiCard
              label="Baris Dimuat"
              code="IM-01"
              value={validation.total.toLocaleString("id-ID")}
              note="pratinjau sebelum disimpan"
              pct="100%"
            />
            <KpiCard
              label="Baris Valid"
              code="IM-02"
              value={validation.valid.toLocaleString("id-ID")}
              note="kolom wajib lengkap"
              pct={`${validation.total > 0 ? Math.round((validation.valid / validation.total) * 100) : 0}%`}
            />
            <KpiCard
              label="Perlu Perbaikan"
              code="IM-03"
              value={validation.incomplete.toLocaleString("id-ID")}
              note="kolom wajib tidak lengkap"
              pct={`${validation.total > 0 ? Math.round((validation.incomplete / validation.total) * 100) : 0}%`}
              barColor="var(--color-admin-warn-bar)"
              valueColor={validation.incomplete > 0 ? "var(--color-admin-warn-text)" : undefined}
            />
            <KpiCard
              label="Duplikat NIK"
              code="IM-04"
              value={validation.duplicates.toLocaleString("id-ID")}
              note="terdeteksi dalam berkas ini"
              pct={`${validation.total > 0 ? Math.round((validation.duplicates / validation.total) * 100) : 0}%`}
              barColor="var(--color-admin-danger-bar)"
              valueColor={validation.duplicates > 0 ? "var(--color-admin-danger-text)" : undefined}
            />
          </section>
        )}

        {/* Main layout */}
        <div className="flex flex-col xl:flex-row gap-[14px] items-start">
          {/* Left panel — step-by-step config */}
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
                <TahunSeleksiInput
                  value={tahunSeleksi}
                  onChange={setTahunSeleksi}
                  disabled={isSaved}
                  currentYear={currentYear}
                />

                <JalurMasukPicker
                  value={jalurMasuk}
                  onChange={setJalurMasuk}
                  disabled={isSaved}
                  showWarning={hasData && !jalurMasuk}
                />

                <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] p-5">
                  <p className="text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-admin-accent text-white text-[10px] font-black flex items-center justify-center shrink-0">
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

          {/* Right panel — data preview */}
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
                  <ImportSuccessBanner
                    total={validation.total}
                    jalurMasuk={jalurMasuk}
                    tahunSeleksi={tahunSeleksi}
                  />
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full min-h-[400px] bg-admin-surface rounded-2xl border-[1.5px] border-dashed border-admin-border flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-admin-surface-soft-2 rounded-full flex items-center justify-center mb-5">
                  <LayoutTemplate
                    size={32}
                    className="text-admin-text-5"
                  />
                </div>
                <h3 className="font-admin-heading text-xl font-extrabold text-admin-text mb-2">
                  Belum Ada Data
                </h3>
                <p className="text-sm text-admin-text-3 max-w-sm mx-auto">
                  Isi tahun seleksi, pilih jalur masuk, lalu unggah file
                  Excel/CSV data pendaftar KIP-K di panel kiri.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
