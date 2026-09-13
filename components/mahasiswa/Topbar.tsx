"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Bot, Menu, X, LogOut, BookMarked, Award, ChevronDown } from "lucide-react";
import { useCurrentUser } from "@/hook/useCurrentUser";

const mobileMenuItems = [
  { href: "/mahasiswa/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/mahasiswa/chatbot",   icon: Bot,             label: "SAKABOT"   },
  { href: "/mahasiswa/monev",     icon: BookMarked,      label: "Evaluasi"  },
  { href: "/mahasiswa/prestasi",  icon: Award,           label: "Prestasi"  },
];

function roleLabel(role: string) {
  if (role === "MAHASISWA_KIPK") return "Mahasiswa KIP-K";
  return role;
}

export default function Topbar() {
  const { user, loading } = useCurrentUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const mobileRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const displayInitials = user?.nama
    ? user.nama.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "–";

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
      <div className="flex items-center h-full px-4 gap-3">

        <div className="md:hidden flex items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-[5px] bg-[#0D1F4E] flex items-center justify-center">
            <span className="text-white font-extrabold text-[13px] leading-none">S</span>
          </div>
          <span className="font-extrabold text-[14px] text-[#0D1F4E] tracking-tight">SAKTI</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">

          <div className="relative hidden md:block" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 h-8 px-2.5 rounded-[6px] hover:bg-slate-100 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#0D1F4E]/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-[#0D1F4E] leading-none">
                  {loading ? "–" : displayInitials}
                </span>
              </div>
              {loading ? (
                <div className="w-20 h-2.5 bg-slate-200 rounded animate-pulse" />
              ) : (
                <div className="text-left">
                  <p className="text-[12.5px] font-semibold text-slate-800 leading-none whitespace-nowrap">
                    {user?.nama ?? "—"}
                  </p>
                  <p className="text-[10.5px] text-slate-400 leading-none mt-0.5 whitespace-nowrap">
                    {user?.role ? roleLabel(user.role) : "Mahasiswa"}
                  </p>
                </div>
              )}
              <ChevronDown
                size={13}
                strokeWidth={2}
                className={`text-slate-400 shrink-0 transition-transform duration-150 ${profileOpen ? "rotate-180" : ""}`}
              />
            </button>

            {profileOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 w-44 bg-white border border-slate-200 rounded-[8px] shadow-md py-1 z-50">
                <button
                  onClick={() => { setProfileOpen(false); handleLogout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut size={14} strokeWidth={1.8} className="shrink-0" />
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative md:hidden" ref={mobileRef}>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-[6px] text-slate-500 hover:bg-slate-100 transition-colors"
            >
              {mobileOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
            </button>

            {mobileOpen && (
              <div className="absolute top-[calc(100%+6px)] right-0 w-52 bg-white border border-slate-200 rounded-[8px] shadow-lg py-1 flex flex-col z-50">
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#0D1F4E]/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-[#0D1F4E]">{loading ? "–" : displayInitials}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{user?.nama ?? "—"}</p>
                      <p className="text-[10.5px] text-slate-400">{user?.role ? roleLabel(user.role) : "Mahasiswa"}</p>
                    </div>
                  </div>
                </div>

                {mobileMenuItems.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-[13px] text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Icon size={15} strokeWidth={1.8} className="text-slate-400 shrink-0" />
                    <span className="font-medium">{label}</span>
                  </Link>
                ))}

                <div className="h-px bg-slate-100 my-1" />

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut size={15} strokeWidth={1.8} className="shrink-0" />
                  <span className="font-medium">Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
