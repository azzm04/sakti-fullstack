"use client";

import { Loader2, Trash2 } from "lucide-react";

interface ModalFooterProps {
  saving: boolean;
  saveLabel?: string;
  savingLabel?: string;
  onClose: () => void;
  onSave: () => void;
  /** Tombol hapus di kiri footer — hanya muncul kalau diisi. */
  onDelete?: () => void;
  deleteLabel?: string;
}

/** Footer modal form: [Hapus] ……… [Batal] [Simpan]. */
export default function ModalFooter({
  saving,
  saveLabel = "Simpan",
  savingLabel = "Menyimpan...",
  onClose,
  onSave,
  onDelete,
  deleteLabel = "Hapus",
}: ModalFooterProps) {
  return (
    <>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-admin-danger-bar px-3 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Trash2 size={14} /> {deleteLabel}
        </button>
      )}
      <div className="flex-1" />
      <button
        type="button"
        onClick={onClose}
        className="rounded-[8px] border border-admin-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-admin-surface-soft"
      >
        Batal
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="flex items-center justify-center gap-2 rounded-[8px] bg-admin-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-admin-accent/90 disabled:opacity-50"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? savingLabel : saveLabel}
      </button>
    </>
  );
}
