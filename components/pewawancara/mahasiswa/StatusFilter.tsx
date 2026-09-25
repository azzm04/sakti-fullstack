"use client";

export type StatusFilterValue = "semua" | "belum" | "sudah";

const STATUS_OPTIONS: { key: StatusFilterValue; label: string }[] = [
  { key: "semua", label: "Semua Status" },
  { key: "belum", label: "Belum Diwawancarai" },
  { key: "sudah", label: "Sudah Diwawancarai" },
];

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
}

/**
 * Filter status wawancara: semua / belum / sudah.
 */
export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {STATUS_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            value === key
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-tertiary text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
