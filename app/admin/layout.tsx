"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import {
  LayoutDashboard,
  BotMessageSquare,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
];

const sidebarVariants: Variants = {
  hidden:  { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0, 0, 1] } },
};

const drawerVariants: Variants = {
  hidden:  { x: "-100%" },
  visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  exit:    { x: "-100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

const overlayVariants: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-8 pb-1">
        <span className="text-2xl font-extrabold font-headline text-primary">SAKTI</span>
      </div>
      <div className="px-6 pb-6 pt-1">
        <p className="font-headline font-bold text-primary text-sm leading-tight">Administrator SAKTI</p>
        <p className="text-xs text-muted-foreground mt-0.5">Puslapdik Kemendikbud</p>
      </div>

      <div className="mx-4 h-px bg-border mb-3" />

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6 pt-4 space-y-1">
        <div className="mx-1 h-px bg-border mb-3" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <BotMessageSquare size={16} />
          Aktivasi Telegram
        </motion.button>
        <motion.button
          whileHover={{ x: 2 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut size={16} />
          Keluar
        </motion.button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
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
        <span className="text-xl font-extrabold font-headline text-primary">SAKTI</span>
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

      {/* Main */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  );
}
