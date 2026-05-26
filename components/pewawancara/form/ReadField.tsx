"use client";

interface ReadFieldProps {
  label: string;
  value?: string | number | null;
}

/**
 * Menampilkan field read-only dengan label dan value.
 */
export function ReadField({ label, value }: ReadFieldProps) {
  const display =
    value !== undefined && value !== null && value !== "" ? String(value) : "—";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
        {label}
      </p>
      <p className="text-sm text-foreground font-semibold">{display}</p>
    </div>
  );
}
