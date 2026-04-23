"use client";

import { useState } from "react";
import Link from "next/link";
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatCanvas from '@/components/chat/ChatCanvas';
import { Menu, LayoutDashboard } from "lucide-react"; // Menggunakan lucide-react untuk konsistensi dengan halaman lain

export default function ChatbotPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9fb] font-body relative">
      
      {/* ── Overlay untuk Mobile (Gelap di belakang sidebar) ── */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar Component ── */}
      <ChatSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* ── Area Chat Utama ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Header */}
        <header className="h-20 flex justify-between items-center px-4 md:px-8 bg-[#f7f9fb]/80 backdrop-blur-md z-10 border-b border-slate-200/40 shrink-0">
          
          <div className="flex items-center gap-3 md:gap-0">
            {/* Tombol Hamburger (Hanya Mobile) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
              title="Buka Modal"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div>
              <h2 className="font-headline font-extrabold text-lg md:text-xl text-primary tracking-tight leading-none mt-0.5">
                SAKABOT AI
              </h2>
            </div>
          </div>

          {/* Tombol Kembali (Responsif) */}
          <Link
            href="/mahasiswa/dashboard"
            className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-slate-200/70 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-300/70 transition-colors active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline-block">Kembali ke Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        </header>

        {/* Area Konten Chat */}
        <ChatCanvas />
        
      </div>
    </div>
  );
}