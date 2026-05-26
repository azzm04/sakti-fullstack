"use client";

interface TextInputProps {
  label: string;
  value: string | number | null;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

/**
 * Input teks dengan label untuk form pewawancara.
 */
export function TextInput({ label, value, onChange, placeholder, required, type = "text" }: TextInputProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-secondary mb-2">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm font-medium border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted transition-all placeholder:font-normal"
      />
    </div>
  );
}
