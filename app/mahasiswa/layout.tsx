import Link from "next/link";
import { Bell, Home, GraduationCap, ClipboardCheck, User } from "lucide-react";
// Sesuaikan path import ini dengan lokasi file SidebarMahasiswa.tsx milikmu!
import SidebarMahasiswa from "@/components/layout/SidebarMahasiswa";

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-body text-slate-600">
      {/* ================= SIDEBAR (DESKTOP) ================= */}
      <SidebarMahasiswa />

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 border-b border-slate-200">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
              Status Akademik
            </span>
            <h1 className="font-headline text-xl font-extrabold text-primary">
              Beranda Mahasiswa
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors relative"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700">Andi Pratama</p>
                <p className="text-[10px] font-medium text-slate-500">
                  S1 Teknik Informatika
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content (Diisi oleh page.tsx yang sedang aktif) */}
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* ================= BOTTOM NAVIGATION (MOBILE ONLY) ================= */}
      {/* Catatan: Untuk MVP, navigasi mobile ini bisa diubah menjadi komponen terpisah juga nantinya */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <Link
          href="/mahasiswa/dashboard"
          className="flex flex-col items-center justify-center text-primary active:scale-95 transition-transform"
        >
          <div className="bg-blue-50 px-5 py-1 rounded-full mb-1">
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary active:scale-95 transition-transform"
        >
          <div className="px-5 py-1 mb-1">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Beasiswa</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary active:scale-95 transition-transform"
        >
          <div className="px-5 py-1 mb-1">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Status</span>
        </Link>
        <Link
          href="#"
          className="flex flex-col items-center justify-center text-slate-400 hover:text-primary active:scale-95 transition-transform"
        >
          <div className="px-5 py-1 mb-1">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
