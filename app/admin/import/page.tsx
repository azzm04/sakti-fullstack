"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronRight, EyeOff, Eye, LayoutTemplate, DatabaseBackup,
} from "lucide-react"

import { type CandidateData, type ValidationSummary } from "@/schemas"
import UploadZone from "@/components/admin/import/UploadZone"
import DataPreviewTable from "@/components/admin/import/DataPreviewTable"
import TahunSeleksiInput from "@/components/admin/import/TahunSeleksiInput"
import JalurMasukPicker from "@/components/admin/import/JalurMasukPicker"
import ImportStatusBadge from "@/components/admin/import/ImportStatusBadge"
import ImportSuccessBanner from "@/components/admin/import/ImportSuccessBanner"

// ── Shared constants & types (re-exported for other modules) ─────────────────
export type SaveStatus = "idle" | "saving" | "saved" | "error"

export const JALUR_OPTIONS = [
  { value: "SNBP Eligible",     label: "SNBP Eligible" },
  { value: "SNBP Non Eligible", label: "SNBP Non Eligible" },
  { value: "SNBT Eligible",     label: "SNBT Eligible" },
  { value: "SNBT Non Eligible", label: "SNBT Non Eligible" },
  { value: "UM",                label: "UM (Ujian Mandiri)" },
] as const

export type JalurMasuk = typeof JALUR_OPTIONS[number]["value"]

interface ChunkResponse {
  batchId?: string
  error?: string
}

const CHUNK_SIZE = 50

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ImportDataPage() {
  const currentYear = new Date().getFullYear()

  const [uploadedData, setUploadedData] = useState<CandidateData[]>([])
  const [validation, setValidation]     = useState<ValidationSummary>({
    valid: 0, incomplete: 0, duplicates: 0, total: 0,
  })
  const [fileName, setFileName]         = useState("")
  const [saveStatus, setSaveStatus]     = useState<SaveStatus>("idle")
  const [saveProgress, setSaveProgress] = useState(0)
  const [showUpload, setShowUpload]     = useState(true)
  const [jalurMasuk, setJalurMasuk]     = useState<JalurMasuk | "">("")
  const [tahunSeleksi, setTahunSeleksi] = useState(String(currentYear))

  // ── Derived state ──────────────────────────────────────────────────────────
  const hasData   = uploadedData.length > 0
  const isSaved   = saveStatus === "saved"
  const tahunValid =
    /^\d{4}$/.test(tahunSeleksi) &&
    parseInt(tahunSeleksi) >= 2020 &&
    parseInt(tahunSeleksi) <= 2099
  const canSave = hasData && !isSaved && !!jalurMasuk && tahunValid

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleDataUploaded(data: CandidateData[], stats: ValidationSummary, filename: string) {
    setUploadedData(data)
    setValidation(stats)
    setFileName(filename)
    setSaveStatus("idle")
    setSaveProgress(0)
  }

  async function handleSave() {
    if (!canSave) return

    setSaveStatus("saving")
    setSaveProgress(0)

    try {
      const { CandidateDataSchema, ValidationSummarySchema } = await import("@/schemas")

      const validatedRows = uploadedData.map((row) => {
        const rowWithJalur = { ...row, jalur_masuk: jalurMasuk }
        const result = CandidateDataSchema.safeParse(rowWithJalur)
        if (!result.success) {
          const issues = result.error.issues.map((e) => e.path.join("."))
          return {
            ...rowWithJalur,
            hasErrors: true,
            missingFields: Array.from(new Set([...(row.missingFields ?? []), ...issues])),
          }
        }
        return result.data
      })

      const validationResult = ValidationSummarySchema.safeParse(validation)
      if (!validationResult.success) {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
        return
      }

      const total = validatedRows.length
      let batchId: string | null = null

      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk    = validatedRows.slice(i, i + CHUNK_SIZE)
        const isFirst  = i === 0
        const progress = Math.round(((i + chunk.length) / total) * 100)

        const res = await fetch("/api/kandidat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName,
            jalurMasuk,
            tahunSeleksi:  parseInt(tahunSeleksi),
            validation:    isFirst ? validationResult.data : null,
            batchId:       batchId ?? null,
            chunkIndex:    i,
            data:          chunk,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string }
          console.error(`Save error chunk ${i}:`, err)
          setSaveStatus("error")
          setTimeout(() => setSaveStatus("idle"), 3000)
          return
        }

        const json = await res.json() as ChunkResponse
        if (isFirst && json.batchId) batchId = json.batchId
        setSaveProgress(progress)
      }

      setSaveStatus("saved")
      setSaveProgress(100)
    } catch (err) {
      console.error("Network / System error:", err)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    }
  }

  const previewData: CandidateData[] = uploadedData.map((row) => ({
    ...row,
    jalur_masuk: jalurMasuk || row.jalur_masuk,
  }))

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-screen-2xl mx-auto p-4 md:p-8 space-y-8">

        {/* Header */}
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

              <ImportStatusBadge
                saveStatus={saveStatus}
                saveProgress={saveProgress}
                validation={validation}
                jalurMasuk={jalurMasuk}
                tahunSeleksi={tahunSeleksi}
              />
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">

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
                className="w-full min-h-[400px] bg-tertiary rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center p-12"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5">
                  <LayoutTemplate size={32} className="text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-2">Belum Ada Data</h3>
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
  )
}
