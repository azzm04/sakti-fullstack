"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  Bot,
  Menu,
  X,
  LogOut,
  BookMarked,
} from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

export default function Topbar() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menutup menu jika user klik di luar area dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 1. Fungsi Logout yang sama dengan Sidebar
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  // 2. Inisial avatar yang sama dengan Sidebar
  const initials =
    user?.nama
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() ?? "?";

  // 3. Daftar Menu yang disamakan dengan Sidebar
  const menuItems = [
    { href: "/mahasiswa/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/mahasiswa/chatbot", icon: Bot, label: "SAKABOT" },
    { href: "/mahasiswa/monev", icon: BookMarked, label: "Evaluasi" },
  ];

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
      <div className="flex items-center justify-between h-full px-4 md:px-8">
        {/* Kiri: Judul Halaman */}
        <div className="flex flex-col">
          <span className="text-[10px] md:text-xs uppercase tracking-widest font-bold text-slate-400">
            Status Akademik
          </span>
          <h1 className="font-headline text-lg md:text-xl font-extrabold text-primary">
            Beranda Mahasiswa
          </h1>
        </div>

        {/* Kanan: Actions & Profile */}
        <div
          className="flex items-center gap-3 md:gap-4 relative"
          ref={menuRef}
        >
          {/* Tombol Notifikasi */}
          <button
            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-full transition-colors relative"
            title="Notifikasi"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full border border-white"></span>
          </button>

          <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>

          {/* Info User (Desktop Only) */}
          <div className="hidden sm:flex items-center gap-3 text-right">
            {loading ? (
              <div className="flex flex-col gap-1 items-end">
                <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                <div className="h-2 w-16 bg-slate-200 rounded animate-pulse" />
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {user?.nama ?? "-"}
                </p>
                <p className="text-[10px] font-medium text-slate-500">
                  Mahasiswa SAKTI
                </p>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              {loading ? "?" : initials}
            </div>
          </div>

          {/* Hamburger Menu Toggle (Mobile/Tablet Only) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          {/* ── Dropdown Menu Kanan Atas (Mobile Only) ── */}
          {isMobileMenuOpen && (
            <div className="absolute top-14 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 flex flex-col sm:hidden z-50 transition-all duration-200">
              {/* User Info Header di Mobile Menu */}
              <div className="px-4 py-3 border-b border-slate-100 mb-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {loading ? "?" : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {user?.nama ?? "Memuat..."}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Mahasiswa SAKTI
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items Dinamis dari Array */}
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:text-primary hover:bg-blue-50 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-slate-400" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              <div className="h-[1px] bg-slate-100 my-1"></div>

              {/* Tombol Logout memanggil fungsi handleLogout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-5 h-5 text-red-400" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
