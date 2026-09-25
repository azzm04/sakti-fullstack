"use client";

import type { JalurFilterOption } from "@/schemas";

interface JalurFilterProps {
  options: JalurFilterOption[];
  value: string;
  onChange: (value: string) => void;
}

/**
 * Filter jalur masuk — muncul kalau pewawancara punya kandidat dari >1 jalur.
 */
export function JalurFilter({ options, value, onChange }: JalurFilterProps) {
  if (options.length <= 1) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1.5 text-xs font-semibold border border-border rounded-lg bg-tertiary text-muted-foreground hover:border-primary/50 focus:outline-none focus:border-primary transition-all"
    >
      <option value="">Semua Jalur</option>
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
