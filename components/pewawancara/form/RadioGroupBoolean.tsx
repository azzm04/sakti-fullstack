"use client";

const OPT_ADA_TIDAK = [
  { label: "Ada", value: true },
  { label: "Tidak Ada", value: false },
];

interface RadioGroupBooleanProps {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  required?: boolean;
}

/**
 * Radio group untuk pilihan boolean (Ada / Tidak Ada).
 */
export function RadioGroupBoolean({ label, value, onChange, required }: RadioGroupBooleanProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {OPT_ADA_TIDAK.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt.value
                ? opt.value
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-destructive/10 text-destructive border-destructive/20 shadow-sm"
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
