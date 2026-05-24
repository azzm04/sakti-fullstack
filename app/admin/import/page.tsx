"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, UploadCloud, CheckCircle2, 
  Info, EyeOff, Eye, LayoutTemplate, FileSpreadsheet,
  DatabaseBackup
} from "lucide-react";

import { type CandidateData, type ValidationSummary } from "@/schemas";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";

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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* ── Header ── */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
            <span>Dashboard</span>
            <ChevronRight size={14} className="text-slate-300" />
            <span className="text-slate-900">Import Data</span>
          </nav>
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <DatabaseBackup size={24} />
                </div>
                Import Data Pendaftar
              </h1>
              <p className="text-slate-500 text-sm mt-2 max-w-2xl">
                Unggah file Excel/CSV data pendaftar untuk memasukkannya ke dalam sistem.
              </p>
            </div>

            {/* Status & Actions Badge */}
            <div className="flex items-center gap-3 flex-wrap">
              {hasData && (
                <button
                  onClick={() => setShowUpload((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-sm focus:ring-4 focus:ring-slate-100"
                >
                  {showUpload ? <EyeOff size={16} className="text-slate-400" /> : <Eye size={16} className="text-slate-400" />}
                  {showUpload ? "Sembunyikan Upload" : "Tampilkan Upload"}
                </button>
              )}

              <AnimatePresence mode="popLayout">
                {isSaved && (
                  <motion.div
                    key="saved-badge"
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
                        Tersinkronisasi dengan Database
                      </span>
                    </div>
                  </motion.div>
                )}

                {hasData && !isSaved && saveStatus !== "saving" && (
                  <motion.div
                    key="pending-badge"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2.5 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm"
                  >
                    <FileSpreadsheet size={18} className="text-indigo-600" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-800 leading-none">
                        {validation.total} baris dimuat
                      </span>
                      <span className="text-[10px] font-medium text-indigo-600 mt-0.5">
                        {validation.valid} Valid · {validation.incomplete} Perbaikan
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Main Layout (Upload & Preview) ── */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

          {/* Left: Upload Zone */}
          <AnimatePresence initial={false}>
            {showUpload && (
              <motion.div
                key="upload-panel"
                initial={{ opacity: 0, width: 0, paddingRight: 0 }}
                animate={{ opacity: 1, width: "auto", paddingRight: "0px" }}
                exit={{ opacity: 0, width: 0, paddingRight: 0, overflow: "hidden" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="w-full xl:w-[400px] 2xl:w-[450px] shrink-0"
              >
                {/* Asumsi komponen <UploadZone /> sudah memiliki styling internal, 
                    kita cukup membungkusnya agar rapi */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2">
                  <UploadZone
                    onDataUploaded={handleDataUploaded}
                    onSave={handleSave}
                    hasData={hasData}
                    saveStatus={saveStatus}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right: Preview Area */}
          <motion.div 
            layout
            className="flex-1 w-full space-y-6"
          >
            {hasData ? (
              <div className="space-y-6">
                <DataPreviewTable
                  data={uploadedData}
                  fileName={fileName}
                  onSave={handleSave}
                  saveStatus={saveStatus}
                  hasData={hasData}
                />
                
                {!isSaved}

                {/* Info Alert setelah Saved */}
                {isSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-4 p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-3xl shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-indigo-900 mb-1">
                        Data Berhasil Diunggah ke Sistem!
                      </h4>
                      <p className="text-sm text-indigo-700/80 leading-relaxed">
                        Semua baris data kandidat telah aman tersimpan di database. Anda sekarang dapat melanjutkan ke tahap <b>Plotting Wawancara</b> untuk mendistribusikan kandidat ini kepada para pewawancara lapangan.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Empty State Modern */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full min-h-[400px] bg-white rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5">
                  <LayoutTemplate size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  Belum Ada Data Ditemukan
                </h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Silakan *drag & drop* atau klik area unggah di sebelah kiri untuk memasukkan file Excel (.xlsx) atau CSV yang berisi data pendaftar KIPK.
                </p>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
}