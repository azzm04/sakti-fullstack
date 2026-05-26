"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

interface LockedAlertProps {
  locked: boolean;
  jatahSelesai: number;
  jatahTotal: number;
}

/**
 * Alert yang muncul saat fitur terkunci (jatah belum selesai).
 */
export function LockedAlert({ locked, jatahSelesai, jatahTotal }: LockedAlertProps) {
  return (
    <AnimatePresence>
      {locked && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800">Fitur Terkunci</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Selesaikan semua wawancara jatahmu terlebih dahulu sebelum bisa melihat mahasiswa lain.
            </p>
            <p className="text-xs text-amber-600 mt-1 font-semibold">
              Progress: {jatahSelesai} / {jatahTotal} selesai
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
