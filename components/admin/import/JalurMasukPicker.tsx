"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { JALUR_VALUE_OPTIONS as JALUR_OPTIONS } from "@/lib/jalur"
import type { JalurMasuk } from "@/app/admin/import/page"
import { RadioRow } from "@/components/admin/ui/RadioRow"

interface Props {
  value: JalurMasuk | ""
  onChange: (v: JalurMasuk) => void
  disabled?: boolean
  showWarning?: boolean
}

export default function JalurMasukPicker({ value, onChange, disabled, showWarning }: Props) {
  return (
    <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] p-5">
      <p className="text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-admin-accent text-white text-[10px] font-black flex items-center justify-center shrink-0">
          1
        </span>
        Pilih Jalur Masuk
      </p>

      <div className="grid grid-cols-1 gap-2">
        {JALUR_OPTIONS.map((opt) => (
          <RadioRow
            key={opt.value}
            label={opt.label}
            selected={value === opt.value}
            onSelect={() => onChange(opt.value)}
            disabled={disabled}
          />
        ))}
      </div>

      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-admin-warn-text bg-admin-warn-bg-2 border border-admin-warn-border rounded-lg px-3 py-2"
        >
          <AlertTriangle size={13} className="shrink-0" />
          Wajib pilih jalur sebelum menyimpan
        </motion.div>
      )}
    </div>
  )
}
