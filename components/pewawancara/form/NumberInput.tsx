"use client";

interface NumberInputProps {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  required?: boolean;
}

/**
 * Input angka dengan label untuk form pewawancara.
 */
export function NumberInput({ label, value, onChange, required }: NumberInputProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type="number"
        value={value === null ? "" : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 text-sm font-medium border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted transition-all"
        title="Input"
      />
    </div>
  );
}
