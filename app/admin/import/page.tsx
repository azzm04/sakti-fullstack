"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type CandidateData, type ValidationSummary } from "@/schemas";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";
import ValidationStats from "@/components/admin/import/ValidationStats";
import TipsCard from "@/components/admin/import/TipsCard";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ImportDataPage() {
  const [uploadedData, setUploadedData] = useState<CandidateData[]>([]);
  const [validation, setValidation]     = useState<ValidationSummary>({
    valid: 0, incomplete: 0, duplicates: 0, total: 0,
  });
  const [fileName, setFileName]     = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showUpload, setShowUpload] = useState(true);

  const hasData  = uploadedData.length > 0;
  const isSaved  = saveStatus === "saved";

  const handleDataUploaded = (
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) => {
    setUploadedData(data);
    setValidation(stats);
    setFileName(filename);
    setSaveStatus("idle"); // reset jika upload ulang
  };

  const handleSave = async () => {
    if (!hasData || isSaved) return;
    setSaveStatus("saving");

    try {
      const { CandidateDataSchema, ValidationSummarySchema } = await import("@/schemas");

      // Parse every row — rows that fail are still included but flagged
      const validatedRows = uploadedData.map((row) => {
        const result = CandidateDataSchema.safeParse(row);
        if (!result.success) {
          const issues = result.error.issues.map((e) => e.path.join("."));
          return {
            ...row,
            hasErrors: true,
            missingFields: Array.from(new Set([...row.missingFields, ...issues])),
          };
        }
        return result.data;
      });

      const validationResult = ValidationSummarySchema.safeParse(validation);
      if (!validationResult.success) {
        console.error("Validation summary invalid:", validationResult.error.flatten());
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return;
      }

      const res = await fetch("/api/kandidat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName,
          validation: validationResult.data,
          data: validatedRows,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Save error:", err);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
        return;
      }

      setSaveStatus("saved");
    } catch (err) {
      console.error("Network / System error:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface-variant">
            Dashboard
          </span>
          <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
            Import Data
          </span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
              Import Data Pendaftar
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Unggah file Excel untuk memulai kalkulasi seleksi beasiswa KIPK.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {hasData && (
              <button
                onClick={() => setShowUpload((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
                title={showUpload ? "Sembunyikan panel upload" : "Tampilkan panel upload"}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {showUpload ? "hide_source" : "upload_file"}
                </span>
                {showUpload ? "Sembunyikan Upload" : "Tampilkan Upload"}
              </button>
            )}
            <AnimatePresence mode="wait">
            {isSaved && (
              <motion.div
                key="saved-badge"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl"
              >
                <span className="material-symbols-outlined text-emerald-600 text-sm">check_circle</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {validation.total} baris tersimpan
                </span>
                <span className="text-xs text-emerald-600">
                  · Tersimpan ke database
                </span>
              </motion.div>
            )}
            {hasData && !isSaved && saveStatus !== "saving" && (
              <motion.div
                key="pending-badge"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl"
              >
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span className="text-sm font-semibold text-primary">
                  {validation.total} baris dimuat
                </span>
                <span className="text-xs text-on-surface-variant">
                  · {validation.valid} valid · {validation.incomplete} perlu perbaikan
                </span>
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">

        {/* Left: Upload */}
        <AnimatePresence initial={false}>
          {showUpload && (
            <motion.div
              key="upload-panel"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="col-span-12 lg:col-span-4 overflow-hidden"
            >
              <UploadZone
                onDataUploaded={handleDataUploaded}
                onSave={handleSave}
                hasData={hasData}
                saveStatus={saveStatus}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right: Preview */}
        <div className={`col-span-12 space-y-5 transition-all duration-300 ${showUpload ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {hasData ? (
            <>
              <ValidationStats stats={validation} />
              <DataPreviewTable
                data={uploadedData}
                fileName={fileName}
                isSaved={isSaved}
              />
              {!isSaved && <TipsCard />}

              {/* Info setelah saved */}
              {isSaved && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl"
                >
                  <span className="material-symbols-outlined text-primary text-xl shrink-0">info</span>
                  <div>
                    <p className="text-sm font-bold text-primary mb-0.5">Data berhasil disimpan ke database</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Semua baris telah tersimpan. Lanjutkan ke tahap Plotting Wawancara untuk mengisi data verifikator.
                    </p>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full min-h-[320px] bg-surface-container-lowest rounded-2xl flex flex-col items-center justify-center text-center border-2 border-dashed border-outline-variant p-12"
            >
              <span className="material-symbols-outlined text-5xl text-outline mb-4 block">
                table_chart
              </span>
              <h3 className="text-base font-bold text-on-surface mb-1 font-headline">
                Belum Ada Data
              </h3>
              <p className="text-sm text-on-surface-variant">
                Upload file Excel untuk melihat preview data di sini
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
