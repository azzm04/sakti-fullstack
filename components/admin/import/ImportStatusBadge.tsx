"use client"

import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, FileSpreadsheet } from "lucide-react"
import type { SaveStatus } from "@/app/admin/import/page"
import type { ValidationSummary } from "@/schemas"

interface Props {
  saveStatus: SaveStatus
  saveProgress: number
  validation: ValidationSummary
  jalurMasuk: string
  tahunSeleksi: string
}

export default function ImportStatusBadge({
  saveStatus,
  saveProgress,
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

      {validation.total > 0 && !isSaved && saveStatus !== "saving" && (
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
  )
}
