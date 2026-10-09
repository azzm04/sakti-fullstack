"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { twMerge } from "tailwind-merge";
import * as Dialog from "@radix-ui/react-dialog";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

interface ChatSidebarProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  currentSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
  refreshTrigger?: number;
}

export default function ChatSidebar({
  userId,
  isOpen,
  onClose,
  currentSessionId,
  onSelectSession,
  onNewChat,
  refreshTrigger,
}: ChatSidebarProps) {
  const [history, setHistory] = useState<any[]>([]);

  // State untuk mengelola mode edit
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Fungsi untuk mengambil data sesi
  const fetchSessions = async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/chat/sessions?userId=${userId}`);
      if (!res.ok) throw new Error("Gagal mengambil data");

      const data = await res.json();
      if (data.sessions) {
        setHistory(data.sessions);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat chat:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId, currentSessionId, refreshTrigger]);

  // Fungsi untuk menyimpan perubahan judul (PATCH)
  const handleUpdateTitle = async (sessionId: string) => {
    if (!editedTitle.trim()) {
      setEditingSessionId(null);
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul: editedTitle }),
      });

      if (!res.ok) throw new Error("Gagal memperbarui judul");

      // Perbarui state lokal secara langsung agar UI cepat merespons
      setHistory((prev) =>
        prev.map((item) =>
          item.id === sessionId ? { ...item, judul: editedTitle, title: editedTitle } : item
        )
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error("Error updating title:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menghapus riwayat chat (DELETE)
  // Hanya membuka modal, belum menghapus
  const requestDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
  };

  // Dijalankan saat tombol "Hapus" di modal ditekan
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const sessionId = sessionToDelete;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus riwayat");

      setHistory((prev) => prev.filter((item) => item.id !== sessionId));

      if (currentSessionId === sessionId) {
        onNewChat?.();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    } finally {
      setIsLoading(false);
      setSessionToDelete(null);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-slate-900/25 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <Dialog.Content
          id="chat-history"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("chat-history-trigger")?.focus();
          }}
          className="fixed inset-y-0 right-0 z-[80] flex w-[380px] max-w-[calc(100vw-24px)] flex-col border-l border-[#E2E8F0] bg-white font-[Roboto,sans-serif] shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-200 motion-reduce:animate-none"
        >
      <div className="h-20 shrink-0 border-b border-[#E2E8F0] px-6 flex items-center justify-between">
          <div>
            <Dialog.Title className="text-base font-semibold text-[#0B1536]">Riwayat percakapan</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-[#64748B]">Lanjutkan percakapan sebelumnya.</Dialog.Description>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup riwayat percakapan" className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="shrink-0 px-4 pt-4 pb-2">
        <button
          onClick={() => {
            onNewChat?.();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 bg-[#000352] text-white min-h-11 py-2.5 rounded-lg hover:bg-[#151965] transition-colors font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]/25 focus-visible:ring-offset-2"
        >
          <Plus size={18} />
          Percakapan Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <h3 className="text-xs font-medium text-[#64748B] mb-2 px-2">
          Riwayat Terakhir
        </h3>

        {history.length === 0 ? (
          <p className="text-sm leading-relaxed text-[#64748B] px-2">Belum ada riwayat percakapan.</p>
        ) : (
          history.map((session) => {
            const isEditing = editingSessionId === session.id;
            const currentTitle = session.judul || session.title || "Percakapan Baru...";

            return (
              <div
                key={session.id}
                onClick={() => {
                  if (!isEditing) {
                    onSelectSession?.(session.id);
                    onClose();
                  }
                }}
                className={twMerge(
                  "group relative flex items-center justify-between w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                  currentSessionId === session.id
                    ? "bg-[#EEF3FB] text-[#000352] font-medium border border-[#DCE4F0]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3 truncate flex-1 mr-1">
                  <MessageSquare
                    size={16}
                    className={
                      currentSessionId === session.id
                        ? "text-[#000352] flex-shrink-0"
                        : "text-slate-400 flex-shrink-0"
                    }
                  />

                  {isEditing ? (
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdateTitle(session.id);
                        if (e.key === "Escape") setEditingSessionId(null);
                      }}
                      autoFocus
                      className="w-full bg-white border border-[#94A3B8] rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#000352]"
                    />
                  ) : (
                    <button type="button" title={currentTitle} aria-current={currentSessionId === session.id ? "true" : undefined} className="line-clamp-2 w-full text-left py-1 focus-visible:outline-none focus-visible:underline">{currentTitle}</button>
                  )}
                </div>

                {/* Tombol Aksi (Edit & Hapus) */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity flex-shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        title="Simpan"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateTitle(session.id);
                        }}
                        disabled={isLoading}
                        className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        title="Batal"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(null);
                        }}
                        className="p-1 hover:bg-rose-100 text-rose-600 rounded transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        title="Ubah Judul"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditedTitle(currentTitle);
                        }}
                        className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        title="Hapus Riwayat"
                        onClick={(e) => requestDeleteSession(session.id, e)}
                        disabled={isLoading}
                        className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      <ConfirmDeleteModal
        open={sessionToDelete !== null}
        loading={isLoading}
        onCancel={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
      />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}