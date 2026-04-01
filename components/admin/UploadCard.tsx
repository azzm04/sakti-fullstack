"use client";

import { motion, AnimatePresence } from "motion/react";
import { FileUpload } from "@/components/ui/file-upload";
import { Download, Sparkles, CheckCircle2, FileSpreadsheet } from "lucide-react";

interface Props {
  uploadedFile: File | null;
  onFileChange: (file: File) => void;
}

const REQUIRED_COLS = ["Nama", "NIM", "IPK", "Penghasilan OT", "Tanggungan", "Jarak", "Prestasi"];

export default function UploadCard({ uploadedFile, onFileChange }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="lg:col-span-3 bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="px-6 pt-6 pb-4 border-b border-border flex items-center gap-2">
        <FileSpreadsheet size={18} className="text-primary" />
        <h2 className="font-headline font-bold text-foreground text-base">Upload Data Pendaftar</h2>
      </div>

      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 p-6 flex flex-col justify-between gap-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Unggah berkas <span className="font-semibold text-foreground">.xlsx</span> dari portal kampus yang memuat data akademik dan ekonomi pendaftar KIP-Kuliah.
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kolom yang diperlukan:</p>
            <div className="flex flex-wrap gap-1.5">
              {REQUIRED_COLS.map((col, i) => (
                <motion.span
                  key={col}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.04 }}
                  className="px-2 py-0.5 bg-muted rounded-md text-xs font-medium text-muted-foreground"
                >
                  {col}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Download size={14} className="rotate-180" />
              Unduh Template
            </motion.button>
            <AnimatePresence>
              {uploadedFile && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Sparkles size={14} />
                  Proses TOPSIS
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl ring-1 ring-emerald-200"
              >
                <CheckCircle2 size={13} />
                <span className="font-medium truncate">{uploadedFile.name}</span>
                <span className="text-emerald-600 shrink-0">siap diproses</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="sm:w-56 border-t sm:border-t-0 sm:border-l border-border bg-muted/20 flex items-center justify-center">
          <FileUpload onChange={(files) => { if (files[0]) onFileChange(files[0]); }} />
        </div>
      </div>
    </motion.div>
  );
}
