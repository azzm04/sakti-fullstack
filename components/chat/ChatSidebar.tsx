"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

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
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah event klik memicu onSelectSession

    if (!confirm("Apakah Anda yakin ingin menghapus riwayat percakapan ini?")) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus riwayat");

      // Hapus dari state lokal
      setHistory((prev) => prev.filter((item) => item.id !== sessionId));

      // Jika sesi yang dihapus sedang aktif, buat chat baru atau kosongkan seleksi
      if (currentSessionId === sessionId) {
        onNewChat?.();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside
      className={twMerge(
        "w-64 bg-white border-r border-slate-200 h-full flex flex-col transition-all z-50 fixed md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="p-4 border-b border-slate-100 flex-shrink-0">
        <button
          onClick={() => {
            onNewChat?.();
            if (window.innerWidth < 768) onClose();
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-all font-semibold text-sm shadow-md"
        >
          <Plus size={18} />
          Percakapan Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
          Riwayat Terakhir
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2">Belum ada riwayat percakapan.</p>
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
                    if (window.innerWidth < 768) onClose();
                  }
                }}
                className={twMerge(
                  "group relative flex items-center justify-between w-full px-3 py-2.5 rounded-xl transition-all text-sm cursor-pointer",
                  currentSessionId === session.id
                    ? "bg-indigo-50/50 text-indigo-700 font-semibold border border-indigo-100 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                )}
              >
                <div className="flex items-center gap-3 truncate flex-1 mr-1">
                  <MessageSquare
                    size={16}
                    className={
                      currentSessionId === session.id
                        ? "text-indigo-600 flex-shrink-0"
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
                      className="w-full bg-white border border-indigo-300 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="truncate w-full">{currentTitle}</span>
                  )}
                </div>

                {/* Tombol Aksi (Edit & Hapus) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
                        onClick={(e) => handleDeleteSession(session.id, e)}
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
    </aside>
  );
}