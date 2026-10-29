"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Eye } from "lucide-react";

import { type CandidateData, type ValidationSummary } from "@/schemas";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";
import ImportSettingsCard from "@/components/admin/import/ImportSettingsCard";
import ImportStatusBadge from "@/components/admin/import/ImportStatusBadge";
import ImportSuccessBanner from "@/components/admin/import/ImportSuccessBanner";
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
    <div className="px-4 sm:px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center justify-end gap-3">
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
      </div>

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

        {/* Pengaturan import — Tahun Seleksi + Pilih Jalur Masuk digabung 1 card */}
        <AnimatePresence initial={false}>
          {showUpload && (
            <motion.div
              key="upload-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            >
              <ImportSettingsCard
                tahunSeleksi={tahunSeleksi}
                onChangeTahun={setTahunSeleksi}
                currentYear={currentYear}
                jalurMasuk={jalurMasuk}
                onChangeJalur={setJalurMasuk}
                disabled={isSaved}
                showJalurWarning={hasData && !jalurMasuk}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Pendaftar — 1 card yang sama: dropzone unggah saat kosong,
            tabel pratinjau begitu file sudah dibaca. Langsung di bawah card
            pengaturan di atas, selebar halaman. */}
        <motion.div layout className="w-full space-y-6">
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
              className="bg-admin-surface rounded-[8px] border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] p-5"
            >
              <p className="text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-3">
                Data Pendaftar
              </p>
              <UploadZone
                onDataUploaded={handleDataUploaded}
                jalurMasuk={jalurMasuk}
              />
            </motion.div>
          )}
        </motion.div>
    </div>
  );
}
