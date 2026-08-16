"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Upload,
  Zap,
  ClipboardCheck,
  BookMarked,
  BarChart3,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin",             label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/import",      label: "Import Data", icon: Upload          },
  { href: "/admin/wawancara",   label: "Wawancara",   icon: Zap             },
  { href: "/admin/evaluasi",    label: "Evaluasi",    icon: ClipboardCheck  },
  { href: "/admin/hasil-akhir", label: "Hasil Akhir", icon: Award           },
  { href: "/admin/monev",       label: "Monev",       icon: BookMarked      },
  { href: "/admin/analitik",    label: "Analitik",    icon: BarChart3       },
];

const sidebarVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0, 0, 1] },
  },
};

const drawerVariants: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** SAKTI medallion logo — accent circle, white ring, mortarboard, open book. */
function SaktiLogo({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0" role="img" aria-label="Logo SAKTI">
      <circle cx="24" cy="24" r="23.2" fill="var(--color-admin-accent)" />
      <circle cx="24" cy="24" r="19.4" fill="none" stroke="#FFFFFF" strokeWidth="1.7" />
      <path d="M24 8.6 35.4 13.1 24 17.6 12.6 13.1Z" fill="#FFFFFF" />
      <path d="M32.4 14.5c1.7 1.5 2.1 3.7 2 5.6" fill="none" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="34.4" cy="21.4" r="1.5" fill="#FFFFFF" />
      <text x="24" y="31.8" textAnchor="middle" fontFamily="'Source Serif 4',Georgia,serif" fontSize="16" fontWeight="700" fill="#FFFFFF">S</text>
      <path d="M12.8 34.1c3.3-2 8.1-2 10.7-.1v5.3c-2.6-1.9-7.4-1.9-10.7.1z" fill="#FFFFFF" />
      <path d="M35.2 34.1c-3.3-2-8.1-2-10.7-.1v5.3c2.6-1.9 7.4-1.9 10.7.1z" fill="#FFFFFF" />
    </svg>
  );
}

// Dipindahkan keluar supaya identitas komponen stabil antar render
function SidebarContent({
  pathname,
  adminName,
  initials,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  adminName: string;
  initials: string;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full font-admin-body text-admin-text">
      {/* Brand */}
      <div className="flex items-center gap-[11px] px-2 pb-[22px]">
        <SaktiLogo />
        <div>
          <div className="font-admin-heading text-[20px] font-bold leading-none tracking-[-0.01em]">
            SAKTI
          </div>
          <div className="text-[10.5px] tracking-[0.14em] uppercase text-admin-text-3 mt-1">
            Dashboard Admin
          </div>
        </div>
      </div>

      <div className="text-[10px] tracking-[0.16em] uppercase text-admin-placeholder px-2.5 pb-2">
        Alur Kerja
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-[11px] w-full px-[11px] py-[9.5px] rounded-[11px] text-[13.5px] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2",
                active
                  ? "bg-admin-accent/[0.15] text-admin-accent-active font-bold"
                  : "text-admin-text-2 font-medium hover:bg-admin-surface-soft"
              )}
            >
              <Icon className="w-[17px] h-[17px] shrink-0 opacity-85" strokeWidth={1.6} />
              <span className="flex-1 text-left">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-3.5">
        <div className="flex items-center gap-[11px] pt-2.5 border-t border-admin-border">
          <div className="w-[34px] h-[34px] rounded-[11px] bg-admin-accent/[0.16] text-admin-accent-ink flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold truncate m-0">{adminName}</p>
            <p className="text-[10.5px] tracking-[0.12em] uppercase text-admin-text-4 m-0">
              Administrator
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Keluar"
            className="border border-admin-border bg-transparent rounded-[9px] w-[30px] h-[30px] flex items-center justify-center text-admin-text-3 hover:bg-admin-surface-soft hover:text-admin-text transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2"
          >
            <LogOut className="w-[15px] h-[15px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminNavigationProps {
  adminName?: string;
}

export default function AdminNavigation({
  adminName = "Admin",
}: AdminNavigationProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin-login";
  }

  const initials = adminName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex sticky top-0 h-screen w-[250px] flex-col bg-admin-surface border-r border-admin-border shrink-0 py-[26px] px-[18px] pb-5"
      >
        <SidebarContent
          pathname={pathname}
          adminName={adminName}
          initials={initials}
          onNavigate={() => setMobileOpen(false)}
          onLogout={handleLogout}
        />
      </motion.aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3.5 bg-admin-surface border-b border-admin-border">
        <div className="flex items-center gap-2">
          <SaktiLogo size={28} />
          <span className="font-admin-heading font-bold text-[20px] leading-none text-admin-text">
            SAKTI
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
          className="w-11 h-11 grid place-items-center rounded-[11px] border border-admin-border text-admin-text hover:bg-admin-surface-soft transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2"
        >
          <Menu size={20} strokeWidth={1.6} />
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-admin-text/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-[270px] bg-admin-surface h-full border-r border-admin-border shadow-xl flex flex-col py-[26px] px-[18px] pb-5"
            >
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu navigasi"
                className="absolute top-4 right-4 w-11 h-11 grid place-items-center rounded-[11px] border border-admin-border text-admin-text-3 hover:bg-admin-surface-soft transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2"
              >
                <X size={18} strokeWidth={1.6} />
              </motion.button>
              <SidebarContent
                pathname={pathname}
                adminName={adminName}
                initials={initials}
                onNavigate={() => setMobileOpen(false)}
                onLogout={handleLogout}
              />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
