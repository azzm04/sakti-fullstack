"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { motion, AnimatePresence, type Variants } from "motion/react"
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Upload,
  UserCheck,
  ClipboardList,
  BookMarked,
  BarChart2,
  MessageSquareWarning,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/import", label: "Import Data", icon: Upload },
  { href: "/admin/wawancara", label: "Wawancara", icon: UserCheck },
  { href: "/admin/evaluasi", label: "Evaluasi Hasil Wawancara", icon: ClipboardList },
  { href: "/admin/kalkulasi", label: "Kalkulasi", icon: ClipboardList },
  { href: "/admin/monev", label: "Monev", icon: BookMarked },
  { href: "/admin/analitik", label: "Analitik Seleksi", icon: BarChart2 },
  { href: "/admin/aduan", label: "Pengaduan", icon: MessageSquareWarning },
]

const sidebarVariants: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0, 0, 1] },
  },
}

const drawerVariants: Variants = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

interface AdminNavigationProps {
  adminName?: string
}

export default function AdminNavigation({ adminName = "Admin" }: AdminNavigationProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/admin-login"
  }

  const initials = adminName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const SidebarContent = () => (
    <div className="flex flex-col h-full font-body">
      {/* Brand Logo */}
      <div className="text-2xl font-black tracking-tight text-primary px-6 py-6 font-headline">
        SAKTI
      </div>

      {/* Profile Card Mini */}
      <div className="px-4 mb-6">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary truncate">{adminName}</p>
            <p className="text-[10px] font-medium text-slate-500">Admin</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? "bg-blue-50 text-primary font-bold shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-primary font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-4 py-4 mt-auto space-y-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="hidden md:flex sticky top-0 h-screen w-60 flex-col bg-white border-r border-border shrink-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-border">
        <span className="text-xl font-extrabold font-headline text-primary">
          SAKTI
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <Menu size={20} className="text-foreground" />
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
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-64 bg-white h-full shadow-xl flex flex-col"
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X size={18} className="text-muted-foreground" />
              </motion.button>
              <SidebarContent />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
