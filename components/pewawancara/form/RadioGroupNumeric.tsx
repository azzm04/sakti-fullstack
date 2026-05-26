"use client";

interface RadioGroupNumericProps {
  label: string;
  value: number | null;
  options: { label: string; value: number }[];
  onChange: (v: number) => void;
  required?: boolean;
}

/**
 * Radio group untuk pilihan numerik.
 */
export function RadioGroupNumeric({ label, value, options, onChange, required }: RadioGroupNumericProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt.value
                ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                : "bg-tertiary text-muted-foreground border-border hover:border-secondary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
