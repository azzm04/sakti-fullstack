"use client";

interface RadioGroupStringProps {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
}

/**
 * Radio group untuk pilihan string.
 */
export function RadioGroupString({ label, value, options, onChange, required }: RadioGroupStringProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt
                ? "bg-primary/10 text-primary border-primary/30 shadow-sm"
                : "bg-tertiary text-muted-foreground border-border hover:border-secondary/50"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
