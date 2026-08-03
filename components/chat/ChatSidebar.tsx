"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus } from "lucide-react";
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

  useEffect(() => {
    async function fetchSessions() {
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
    }

    fetchSessions();
  }, [userId, currentSessionId, refreshTrigger]);

  return (
    <aside className={twMerge(
      "w-64 bg-white border-r border-slate-200 h-full flex flex-col transition-all z-50 fixed md:relative",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
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
          Riwayat Terakhir (Maks. 3)
        </h3>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 italic px-2">Belum ada riwayat percakapan.</p>
        ) : (
          history.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSelectSession?.(session.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={twMerge(
                "flex items-center gap-3 w-full text-left px-3 py-3 rounded-xl transition-all text-sm",
                currentSessionId === session.id
                  ? "bg-indigo-50/50 text-indigo-700 font-semibold border border-indigo-100 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              )}
            >
              <MessageSquare size={16} className={currentSessionId === session.id ? "text-indigo-600" : "text-slate-400"} />
              <span className="truncate w-full">{session.judul || session.title || "Percakapan Baru..."}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}