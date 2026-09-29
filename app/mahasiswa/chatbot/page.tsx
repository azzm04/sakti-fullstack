"use client";

import { useState } from "react";
import Link from "next/link";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatCanvas from "@/components/chat/ChatCanvas";
import SidebarMahasiswa from "@/components/layout/SidebarMahasiswa";
import { Menu, LayoutDashboard, Loader2 } from "lucide-react";
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

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#f7f9fb]">
        <div className="flex flex-col items-center gap-3 text-indigo-600">
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
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
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
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
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
  // [ SidebarMahasiswa ][ Riwayat Chat ][ Area Chat ]
  // ==========================================
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#f7f9fb] font-body relative">
      {/* ==========================================
          SIDEBAR UTAMA MAHASISWA (desktop)
          Sama dengan sidebar di halaman dashboard
      ========================================== */}
      <SidebarMahasiswa />

      {/* ==========================================
          MOBILE SIDEBAR OVERLAY (riwayat chat)
      ========================================== */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ==========================================
          SIDEBAR RIWAYAT CHAT
      ========================================== */}
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
        <header className="h-20 shrink-0 flex justify-between items-center px-4 md:px-8 bg-[#f7f9fb]/80 backdrop-blur-md z-10 border-b border-slate-200/40">
          {/* LEFT */}
          <div className="flex items-center gap-3 md:gap-0">
            {/* MOBILE MENU (riwayat chat) */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
              title="Buka Riwayat Chat"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h2 className="font-headline font-extrabold text-lg md:text-xl text-primary tracking-tight leading-none mt-0.5">
              SAKABOT AI
            </h2>
          </div>

          {/* RIGHT — hanya tampil di mobile, karena
              SidebarMahasiswa tersembunyi di layar kecil */}
          <Link
            href="/mahasiswa/dashboard"
            className="md:hidden flex items-center gap-2 px-3 py-2 rounded-full bg-slate-200/70 text-slate-700 text-xs font-semibold hover:bg-slate-300/70 transition-colors active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </header>

        {/* ==========================================
            CHAT CANVAS
            Scroll hanya terjadi di dalam ChatCanvas.
        ========================================== */}
        <ChatCanvas
          userId={user.id}
          currentSessionId={currentSessionId}
          onMessageSent={handleMessageSent}
        />
      </div>
    </div>
  );
}