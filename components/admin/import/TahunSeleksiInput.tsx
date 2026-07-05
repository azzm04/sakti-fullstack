"use client"

import { Calendar } from "lucide-react"

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  currentYear: number
}

export default function TahunSeleksiInput({ value, onChange, disabled, currentYear }: Props) {
  const isValid =
    /^\d{4}$/.test(value) &&
    parseInt(value) >= 2020 &&
    parseInt(value) <= 2099

  const showError = !isValid && value !== ""

  return (
    <div className="bg-tertiary rounded-3xl border border-border shadow-sm p-5">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center shrink-0">
          0
        </span>
        Tahun Seleksi
      </p>

      <div className="relative">
        <Calendar
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="number"
          min={2020}
          max={2099}
          placeholder={String(currentYear)}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full pl-9 pr-4 py-3 text-sm font-bold rounded-xl bg-background text-foreground
            border focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
            ${showError ? "border-destructive bg-destructive/5" : "border-border"}`}
        />
      </div>

      {showError && (
        <p className="mt-1.5 text-[11px] text-destructive font-medium">
          Masukkan tahun antara 2020–2099
        </p>
      )}
    </div>
  )
}
