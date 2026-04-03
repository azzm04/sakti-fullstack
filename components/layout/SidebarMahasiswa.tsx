"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bell, Bot, Send, LogOut } from "lucide-react";

export default function SidebarMahasiswa() {
  const pathname = usePathname();

  // Array menu agar kodenya lebih bersih (DRY - Don't Repeat Yourself)
  const menuItems = [
    { href: "/mahasiswa/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/mahasiswa/aktivasi-bot", icon: Bell, label: "Aktivasi Bot" },
    { href: "/mahasiswa/chatbot", icon: Bot, label: "SAKABOT" },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-72 bg-white border-r border-slate-200 py-4 space-y-2 sticky top-0 font-body">
      {/* Brand Logo */}
      <div className="text-2xl font-black tracking-tight text-primary px-6 py-6 font-headline">
        SAKTI
      </div>

      {/* Profile Card Mini */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <img
            alt="Andi Pratama"
            className="w-10 h-10 rounded-full object-cover loading=eager"
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop"
          />
          <div>
            <p className="text-sm font-bold text-primary">Andi Pratama</p>
            <p className="text-[10px] font-medium text-slate-500">
              Mahasiswa SAKTI
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          // Deteksi apakah URL saat ini sama dengan href menu
          // (Menggunakan startsWith agar jika ada sub-halaman, menu utamanya tetap menyala)
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-50 text-primary font-bold shadow-sm" // Style ketika Aktif (sesuai screenshot)
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary font-medium" // Style ketika Tidak Aktif
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-4 mt-auto space-y-3">
        <a
          href="https://t.me/SAKTI_Undip_Bot"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all"
        >
          <Send className="w-4 h-4" />
          Hubungkan Telegram
        </a>

        <Link href="/logout" className="w-full block">
          <button className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all w-full">
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </Link>
      </div>
    </aside>
  );
}
