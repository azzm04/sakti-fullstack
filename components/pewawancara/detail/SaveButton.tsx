"use client";

import { Save, CheckCircle2, Loader2 } from "lucide-react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveButtonProps {
  status: SaveStatus;
  onSave: () => void;
  className?: string;
}

export function SaveButton({ status, onSave, className = "" }: SaveButtonProps) {
  return (
    <button
      onClick={onSave}
      disabled={status === "saving"}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50 ${
        status === "saved"
          ? "bg-emerald-500 text-white"
          : status === "error"
            ? "bg-destructive text-white"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
      } ${className}`}
    >
      {status === "saving" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : status === "saved" ? (
        <CheckCircle2 size={16} />
      ) : (
        <Save size={16} />
      )}
      {status === "saving"
        ? "Menyimpan..."
        : status === "saved"
          ? "Tersimpan"
          : "Simpan Laporan"}
    </button>
  );
}
