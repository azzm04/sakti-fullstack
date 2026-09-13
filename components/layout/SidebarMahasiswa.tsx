"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Bot, BookMarked, Award, PanelLeftClose, PanelLeftOpen, LogOut } from "lucide-react";

const EXPANDED  = 248;
const COLLAPSED = 64;
const EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];
const T      = { duration: 0.22, ease: EASE };
const T_FADE = { duration: 0.14, ease: EASE };
const BG        = "#0D1E4A";
const BG_ACTIVE = "rgba(255,255,255,0.14)";
const BG_HOVER  = "rgba(255,255,255,0.06)";

const menuItems = [
  { href: "/mahasiswa/dashboard",       icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/mahasiswa/chatbot",         icon: Bot,             label: "SAKABOT"       },
  { href: "/mahasiswa/monev",           icon: BookMarked,      label: "Evaluasi"      },
  { href: "/mahasiswa/prestasi",        icon: Award,           label: "Prestasi"      },
  { href: "/mahasiswa/pengunduran-diri",icon: LogOut,          label: "Undur Diri"    },
];

export default function SidebarMahasiswa() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.aside
      animate={{ width: expanded ? EXPANDED : COLLAPSED }}
      transition={T}
      style={{ background: BG }}
      className="hidden md:flex flex-col h-screen sticky top-0 z-40 shrink-0 overflow-hidden select-none"
    >
      <div
        onClick={() => setExpanded((v) => !v)}
        title={expanded ? "Tutup sidebar" : "Buka sidebar"}
        className="h-14 shrink-0 flex items-center cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors border-b border-white/[0.07] overflow-hidden group"
      >
        <div className="relative w-[64px] h-14 flex items-center justify-center shrink-0">
          <img
            src="/Logo UNDIP.png"
            alt="Logo UNDIP"
            width={40}
            height={40}
            className={`w-18 h-18 object-contain shrink-0 transition-all duration-200 ${!expanded ? "group-hover:opacity-0" : ""}`}
          />
          {!expanded && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white/70">
              <PanelLeftOpen size={17} strokeWidth={1.8} />
            </div>
          )}
        </div>

        <div className="flex-1 flex items-center justify-between pr-4 overflow-hidden min-w-0">
          <motion.div
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={T_FADE}
            className="flex flex-col whitespace-nowrap"
          >
            <span className="block text-white font-bold text-[15px] leading-tight tracking-tight">
              SAKTI
            </span>
            <span className="block text-white/50 font-normal text-[10px] leading-snug mt-0.5">
              Sistem Asisten KIP-K Terpadu
            </span>
          </motion.div>

          <motion.div
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={T_FADE}
            className="text-white/30 shrink-0 ml-2"
          >
            <PanelLeftClose size={15} strokeWidth={1.8} />
          </motion.div>
        </div>
      </div>

      <div className="h-8 shrink-0 flex items-end px-4 pb-1 mt-2">
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={T_FADE}
          className="text-[9px] font-semibold tracking-[0.16em] uppercase text-white/30 whitespace-nowrap leading-none"
        >
          Menu
        </motion.span>
      </div>

      <nav className="flex-1 px-2 flex flex-col gap-0.5 overflow-hidden mt-0.5">
        {menuItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              title={!expanded ? label : undefined}
              style={{ background: isActive ? BG_ACTIVE : "transparent" }}
              className="flex items-center h-10 rounded-[6px] shrink-0 px-3 gap-3 transition-colors"
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = BG_HOVER;
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              <Icon
                size={16}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? "text-white shrink-0" : "text-white/55 shrink-0"}
              />
              <div className="overflow-hidden flex-1">
                <motion.span
                  animate={{ opacity: expanded ? 1 : 0 }}
                  transition={T_FADE}
                  className={[
                    "block text-[13px] whitespace-nowrap leading-none",
                    isActive ? "font-semibold text-white" : "font-medium text-white/65",
                  ].join(" ")}
                >
                  {label}
                </motion.span>
              </div>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
