"use client";

import { useCurrentUser } from "@/hook/useCurrentUser";
import { MessageSquare, Plus, HelpCircle, X, Bot } from "lucide-react"; // Menggunakan Lucide

const MOCK_HISTORY = [
  { id: "1", title: "Syarat KIP-Kuliah 2024", active: true },
  { id: "2", title: "Status Pencairan UKT", active: false },
  { id: "3", title: "Kendala Login SIM KIPK", active: false },
];

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const { user, loading, initials } = useCurrentUser();

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        flex flex-col h-full w-72 bg-[#f2f4f6] border-r border-slate-200/60 shrink-0
        ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      `}
    >
      <div className="px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white shadow-lg shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold text-primary tracking-tight">SAKABOT</h1>
              <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Puslapdik Assistant</p>
            </div>
          </div>
          
          {/* Tombol Tutup (Hanya di Mobile) */}
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all text-sm">
          <Plus className="w-5 h-5" />
          Percakapan Baru
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-4">
        <div className="px-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Terakhir</span>
        </div>
        <div className="space-y-1">
          {MOCK_HISTORY.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                // Tambahkan logika pindah chat di sini jika ada
                onClose(); // Tutup sidebar di mobile setelah memilih chat
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                item.active
                  ? "bg-blue-50 text-blue-800 font-semibold border-r-4 border-blue-800"
                  : "text-slate-500 hover:bg-slate-200/60"
              }`}
            >
              <MessageSquare className={`w-4 h-4 shrink-0 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
              <span className="text-sm truncate leading-none mt-0.5">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 mt-auto space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-200/60 transition-all text-sm font-medium">
          <HelpCircle className="w-5 h-5 text-slate-400" />
          Pusat Bantuan
        </button>
        <div className="pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              {loading ? (
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-700 truncate">{user?.nama ?? "-"}</span>
                  <span className="text-[10px] text-slate-500">Mahasiswa SAKTI</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}