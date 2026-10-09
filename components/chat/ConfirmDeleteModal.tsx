"use client";

import * as Dialog from "@radix-ui/react-dialog";

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
    return (
      <Dialog.Root open={open} onOpenChange={(nextOpen) => { if (!nextOpen && !loading) onCancel(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40" />
          <Dialog.Content
            onEscapeKeyDown={(event) => { if (loading) event.preventDefault(); }}
            onPointerDownOutside={(event) => { if (loading) event.preventDefault(); }}
            className="fixed left-1/2 top-1/2 z-[110] w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[#E2E8F0] bg-white p-6 font-[Roboto,sans-serif] shadow-xl"
          >
            <Dialog.Title className="text-lg font-semibold text-[#0B1536]">{title}</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-relaxed text-[#64748B]">{description}</Dialog.Description>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-medium text-[#334155] transition-colors hover:bg-slate-50 disabled:opacity-60"
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
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
}