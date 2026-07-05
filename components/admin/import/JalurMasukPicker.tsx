"use client"

import { motion } from "framer-motion"
import { AlertTriangle } from "lucide-react"
import { JALUR_OPTIONS, type JalurMasuk } from "@/app/admin/import/page"

interface Props {
  value: JalurMasuk | ""
  onChange: (v: JalurMasuk) => void
  disabled?: boolean
  showWarning?: boolean
}

export default function JalurMasukPicker({ value, onChange, disabled, showWarning }: Props) {
  return (
    <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">
          1
        </span>
        Pilih Jalur Masuk
      </p>

      <div className="grid grid-cols-1 gap-2">
        {JALUR_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all
                ${isSelected
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span
                className={`w-4 h-4 rounded-full border-2 shrink-0 transition-all
                  ${isSelected
                    ? "bg-primary-foreground border-primary-foreground"
                    : "border-muted-foreground bg-background"
                  }`}
              />
              {opt.label}
            </button>
          )
        })}
      </div>

      {showWarning && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
        >
          <AlertTriangle size={13} className="shrink-0" />
          Wajib pilih jalur sebelum menyimpan
        </motion.div>
      )}
    </div>
  )
}
