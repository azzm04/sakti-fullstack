"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDeleteModalProps {
    open: boolean;
    title?: string;
    description?: string;
    loading?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function ConfirmDeleteModal({
    open,
    title = "Hapus percakapan?",
    description = "Apakah Anda yakin ingin menghapus riwayat percakapan ini?",
    loading = false,
    onCancel,
    onConfirm,
}: ConfirmDeleteModalProps) {
    // Tutup modal dengan tombol Esc
    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onCancel();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [open, onCancel]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={onCancel}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-md rounded-2xl border border-white/10 bg-[#262624] p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-base font-semibold text-white">{title}</h2>
                <p className="mt-2 text-sm text-gray-400">{description}</p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/20 disabled:opacity-60"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading ? "Menghapus..." : "Hapus"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}