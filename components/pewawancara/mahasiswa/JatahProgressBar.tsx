"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface JatahProgressBarProps {
  jatahSelesai: number;
  jatahTotal: number;
  jatahSudahSelesai: boolean;
}

/**
 * Progress bar jatah wawancara pewawancara.
 */
export function JatahProgressBar({ jatahSelesai, jatahTotal, jatahSudahSelesai }: JatahProgressBarProps) {
  if (jatahTotal <= 0) return null;

  const progressPct = Math.round((jatahSelesai / jatahTotal) * 100);

  return (
    <div className="bg-tertiary rounded-2xl border border-border shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground">Progress Jatah Saya</p>
        <span className={`text-xs font-bold ${jatahSudahSelesai ? "text-emerald-600" : "text-primary"}`}>
          {progressPct}%
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${jatahSudahSelesai ? "bg-emerald-500" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {jatahSudahSelesai && (
        <p className="text-[11px] text-emerald-600 mt-2 flex items-center gap-1">
          <CheckCircle2 size={11} />
          Semua jatah selesai — kamu bisa membantu wawancara mahasiswa lain
        </p>
      )}
    </div>
  );
}
