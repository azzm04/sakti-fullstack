"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Input pencarian mahasiswa.
 */
export function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative mb-4 max-w-md">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari nama atau no. pendaftaran..."
        className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-tertiary focus:outline-none focus:border-primary transition-all"
      />
    </div>
  );
}
