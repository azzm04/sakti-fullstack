"use client";

import { useState } from "react";
import Link from "next/link";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatCanvas from "@/components/chat/ChatCanvas";
import SidebarMahasiswa from "@/components/layout/SidebarMahasiswa";
import { History, Plus, LayoutDashboard, Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";
import { UserProvider } from "@/components/providers/UserProvider";

// ==========================================
// PEMBUNGKUS HALAMAN
// ==========================================
export default function ChatbotPageWrapper() {
  return (
    <UserProvider>
      <ChatbotPage />
    </UserProvider>
  );
}

// ==========================================
// KOMPONEN UTAMA SAKABOT
// ==========================================
function ChatbotPage() {
  const { user, loading } = useCurrentUser();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newChatKey, setNewChatKey] = useState(0);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#f7f9fb]">
        <div className="flex flex-col items-center gap-3 text-[#000352]">
          <Loader2 className="w-10 h-10 animate-spin" />

          <p className="text-sm font-semibold text-slate-600">
            Memverifikasi sesi SAKTI Anda...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // AKSES DITOLAK
  // ==========================================
  if (!user || !user.id) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#f7f9fb]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Akses Ditolak
          </h2>

          <p className="text-sm font-medium text-slate-500 mb-4">
            Sesi Anda telah berakhir. Silakan login kembali untuk menggunakan
            SAKABOT.
          </p>

          <Link
            href="/login"
            className="px-6 py-2.5 bg-[#000352] text-white rounded-lg text-sm font-medium hover:bg-[#151965] transition-colors"
          >
            Kembali ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setNewChatKey((key) => key + 1);
    setIsSidebarOpen(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleMessageSent = (newSessionId: string) => {
    if (!currentSessionId && newSessionId) {
      setCurrentSessionId(newSessionId);
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  // ==========================================
  // MAIN LAYOUT
  //
  // Sidebar utama dan area chat; riwayat dibuka sebagai dialog.
  // ==========================================
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F8FAFC] font-[Roboto,sans-serif] text-[#334155] relative">
      {/* ==========================================
          SIDEBAR UTAMA MAHASISWA (desktop)
          Sama dengan sidebar di halaman dashboard
      ========================================== */}
      <SidebarMahasiswa />

      <ChatSidebar
        userId={user.id}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshTrigger={refreshTrigger}
      />

      {/* ==========================================
          CONTENT AREA

          min-h-0 + overflow-hidden
          mencegah BODY ikut scrolling
      ========================================== */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative">
        {/* ==========================================
            HEADER
        ========================================== */}
        <header className="h-20 shrink-0 flex justify-between items-center gap-3 px-3 sm:px-4 md:px-8 bg-white z-10 border-b border-[#E2E8F0]">
          <h1 className="min-w-0 text-lg sm:text-xl font-bold tracking-tight text-[#0B1536]">SAKABOT</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/mahasiswa/dashboard" aria-label="Kembali ke dashboard" title="Kembali ke dashboard" className="md:hidden flex size-11 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#000352] hover:bg-slate-50">
              <LayoutDashboard size={18} />
            </Link>
            <button
              id="chat-history-trigger"
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka riwayat percakapan"
              aria-haspopup="dialog"
              aria-expanded={isSidebarOpen}
              aria-controls={isSidebarOpen ? "chat-history" : undefined}
              title="Riwayat percakapan"
              className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] px-3 text-sm font-medium text-[#334155] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]/25"
            >
              <History size={18} />
              <span className="hidden sm:inline">Riwayat</span>
            </button>
            <button type="button" onClick={handleNewChat} aria-label="Percakapan baru" title="Percakapan baru" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#000352] px-3 sm:px-4 text-sm font-medium text-white hover:bg-[#151965] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]/25 focus-visible:ring-offset-2">
              <Plus size={18} />
              <span className="hidden sm:inline">Percakapan baru</span>
            </button>
          </div>

        </header>

        {/* ==========================================
            CHAT CANVAS
            Scroll hanya terjadi di dalam ChatCanvas.
        ========================================== */}
        <ChatCanvas
          key={newChatKey}
          userId={user.id}
          currentSessionId={currentSessionId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}