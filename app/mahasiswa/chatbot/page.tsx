import Link from 'next/link';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatCanvas from '@/components/chat/ChatCanvas';

// Mobile bottom nav — static, no interactivity needed
function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-white border-t border-slate-100 z-50">
      <Link href="/mahasiswa/dashboard" className="flex flex-col items-center justify-center text-slate-400">
        <span className="material-symbols-outlined">home</span>
        <span className="text-[10px] font-bold mt-1">Home</span>
      </Link>
      <Link href="/mahasiswa/chatbot" className="flex flex-col items-center justify-center bg-blue-100 text-blue-900 rounded-2xl px-6 py-2">
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        <span className="text-[10px] font-bold mt-1">Bot</span>
      </Link>
      <Link href="#" className="flex flex-col items-center justify-center text-slate-400">
        <span className="material-symbols-outlined">assignment_turned_in</span>
        <span className="text-[10px] font-bold mt-1">Status</span>
      </Link>
      <Link href="#" className="flex flex-col items-center justify-center text-slate-400">
        <span className="material-symbols-outlined">person</span>
        <span className="text-[10px] font-bold mt-1">Profil</span>
      </Link>
    </nav>
  );
}

export default function ChatbotPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f9fb] font-body">
      <ChatSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — static server-rendered */}
        <header className="h-20 flex justify-between items-center px-8 bg-[#f7f9fb]/80 backdrop-blur-md z-10 border-b border-slate-200/40 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interaksi Aktif</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight leading-none mt-0.5">SAKABOT AI</h2>
          </div>
          <Link
            href="/mahasiswa/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-200/70 text-slate-700 text-sm font-semibold hover:bg-slate-300/70 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Kembali ke Dashboard
          </Link>
        </header>

        {/* All interactive chat logic lives here */}
        <ChatCanvas />
      </div>

      <MobileNav />
    </div>
  );
}
