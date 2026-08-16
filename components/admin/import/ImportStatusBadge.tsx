"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileSpreadsheet, AlertTriangle } from "lucide-react"
import type { SaveStatus } from "@/app/admin/import/page"
import type { ValidationSummary } from "@/schemas"

interface Props {
  saveStatus: SaveStatus
  saveProgress: number
  saveError?: string | null
  validation: ValidationSummary
  jalurMasuk: string
  tahunSeleksi: string
}

export default function ImportStatusBadge({
  saveStatus,
  saveProgress,
  saveError,
  validation,
  jalurMasuk,
  tahunSeleksi,
}: Props) {
  const isSaved = saveStatus === "saved"

  return (
    <AnimatePresence mode="popLayout">
      {isSaved && (
        <motion.div
          key="saved"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex items-center gap-2.5 px-4 py-2 bg-admin-accent/10 border border-admin-accent/25 rounded-xl shadow-sm"
        >
          <CheckCircle2 size={18} className="text-admin-accent" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-admin-accent-ink leading-none">
              {validation.total} baris tersimpan
            </span>
            <span className="text-[10px] font-medium text-admin-accent mt-0.5">
              {tahunSeleksi} · {jalurMasuk}
            </span>
          </div>
        </motion.div>
      )}

      {validation.total > 0 && !isSaved && saveStatus !== "saving" && (
        <motion.div
          key="pending"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-center gap-2.5 px-4 py-2 bg-admin-accent/8 border border-admin-accent/20 rounded-xl shadow-sm"
        >
          <FileSpreadsheet size={18} className="text-admin-accent" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-admin-text leading-none">
              {validation.total} baris dimuat
            </span>
            <span className="text-[10px] font-medium text-admin-accent mt-0.5">
              {validation.valid} Valid · {validation.incomplete} Perbaikan
              {jalurMasuk ? ` · ${jalurMasuk}` : " · Pilih jalur ↑"}
            </span>
          </div>
        </motion.div>
      )}

      {saveStatus === "error" && (
        <motion.div
          key="error"
          role="alert"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex items-start gap-2.5 px-4 py-2 bg-admin-danger-bg border border-admin-danger-border rounded-xl shadow-sm max-w-sm"
        >
          <AlertTriangle size={18} className="text-admin-danger-text shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-admin-danger-text leading-none">
              Gagal menyimpan data
            </span>
            <span className="text-xs text-admin-danger-text/80 mt-1 leading-snug">
              {saveError ?? "Terjadi kesalahan yang tidak diketahui."}
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
          className="flex items-center gap-2.5 px-4 py-2 bg-admin-accent/8 border border-admin-accent/20 rounded-xl shadow-sm min-w-[160px]"
        >
          <div className="w-4 h-4 border-2 border-admin-accent border-t-transparent rounded-full animate-spin shrink-0" />
          <div className="flex flex-col flex-1">
            <span className="text-xs font-bold text-admin-text leading-none mb-1">
              Menyimpan... {saveProgress}%
            </span>
            <div className="h-1 bg-admin-grid rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-admin-accent rounded-full"
                animate={{ width: `${saveProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
