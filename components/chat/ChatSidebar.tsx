'use client';

import Link from 'next/link';
import { useCurrentUser } from '@/hook/useCurrentUser';

const MOCK_HISTORY = [
  { id: '1', title: 'Syarat KIP-Kuliah 2024', active: true },
  { id: '2', title: 'Status Pencairan UKT', active: false },
  { id: '3', title: 'Kendala Login SIM KIPK', active: false },
];

export default function ChatSidebar() {
  const { user, loading, initials } = useCurrentUser();

  return (
    <aside className="hidden md:flex flex-col h-full w-72 bg-[#f2f4f6] border-r border-slate-200/60 shrink-0">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white shadow-lg shrink-0">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold text-primary tracking-tight">SAKABOT</h1>
            <p className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">Puslapdik Assistant</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-white rounded-xl font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all text-sm">
          <span className="material-symbols-outlined text-xl">add</span>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                item.active
                  ? 'bg-blue-50 text-blue-800 font-semibold border-r-4 border-blue-800'
                  : 'text-slate-500 hover:bg-slate-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-lg">chat_bubble</span>
              <span className="text-sm truncate">{item.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 mt-auto space-y-2">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-200/60 transition-all text-sm font-medium">
          <span className="material-symbols-outlined text-xl">help</span>
          Pusat Bantuan
        </button>
        <div className="pt-4 border-t border-slate-200/60">
          <div className="flex items-center gap-3 px-4 py-2">
            {/* Avatar inisial — tidak pakai foto eksternal */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0">
              {loading ? (
                <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-xs font-bold text-slate-700 truncate">{user?.nama ?? '-'}</span>
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
