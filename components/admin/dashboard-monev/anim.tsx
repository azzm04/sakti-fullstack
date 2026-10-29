"use client";

import type { ReactNode } from "react";

/** Angka langsung menampilkan nilai akhir agar ringkasan terbaca sejak render pertama. */
export function Angka({ value, format = (n: number) => Math.round(n).toLocaleString("id-ID"), className }: {
  value: number; format?: (n: number) => string; className?: string;
}) {
  return <span className={`tabular-nums ${className ?? ""}`}>{format(value)}</span>;
}

/** Pembungkus konten dashboard; tanpa animasi masuk yang menunda pembacaan data. */
export function Muncul({ children, className }: { children: ReactNode; urutan?: number; className?: string }) {
  return <div className={className}>{children}</div>;
}