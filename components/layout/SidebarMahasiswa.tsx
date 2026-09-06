"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Bell, Bot, Send, LogOut, BookMarked } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

export default function SidebarMahasiswa() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading} = useCurrentUser();

  const menuItems = [
    { href: "/mahasiswa/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/mahasiswa/chatbot", icon: Bot, label: "SAKABOT" },
    { href: "/mahasiswa/monev", icon: BookMarked, label: "Evaluasi" },
  ];

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login";
  }
  
  const initials = user?.nama
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "?"

  return (
    <aside className="hidden md:flex flex-col h-screen bg-white border-r border-slate-200 py-4 space-y-2 sticky top-0 font-body group overflow-hidden transition-all duration-300 ease-in-out w-[88px] lg:w-72 hover:w-72 z-40 shrink-0">
      
      {/* Brand Logo */}
      <div className="flex items-center h-12 px-6 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-white font-black text-xl">S</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-primary font-headline ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-300">
          SAKTI
        </span>
      </div>

      {/* Profile Card Mini */}
      <div className="px-4 mb-6">
        <div className="flex items-center p-2 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden w-[240px] md:w-auto lg:w-[240px] group-hover:w-[240px] transition-all duration-300">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
          <div className="ml-3 min-w-0 opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            {loading ? (
              <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-sm font-bold text-primary truncate">{user?.nama ?? "-"}</p>
                <p className="text-[10px] font-medium text-slate-500">Mahasiswa SAKTI</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 overflow-hidden ${
                isActive
                  ? "bg-blue-50 text-primary font-bold shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary font-medium"
              }`}
            >
              <Icon className="w-[22px] h-[22px] shrink-0" />
              <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-300">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-3.5 w-full text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all overflow-hidden"
        >
          <LogOut className="w-[22px] h-[22px] shrink-0" />
          <span className="ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 lg:opacity-100 transition-opacity duration-300">
            Keluar
          </span>
        </button>
      </div>
    </aside>
  );
}
