"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/",          label: "Beranda" },
  { href: "/panduan",   label: "Panduan" },
  { href: "/pengaduan", label: "Pengaduan" },
  { href: "/kontak",    label: "Kontak" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const desktopLinkClass = (path: string) =>
    pathname === path
      ? "text-primary font-bold border-b-2 border-primary py-1 transition-colors"
      : "text-secondary font-medium hover:text-primary transition-colors py-1 border-b-2 border-transparent";

  return (
    <>
      {/* ── Desktop / Tablet Navbar ── */}
      <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none px-4 sm:px-8 transition-all duration-300">
        <nav
          className={`pointer-events-auto flex justify-between items-center transition-all duration-500 ease-in-out ${
            isScrolled
              ? "mt-4 w-full max-w-4xl h-16 bg-white/30 backdrop-blur-lg shadow-lg rounded-full px-6 border border-white/40"
              : "mt-0 w-full max-w-full h-20 bg-white/90 backdrop-blur-md px-8 border-b border-slate-200"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="text-2xl font-black tracking-tight text-primary font-headline">
            SAKTI
          </Link>

          {/* Desktop links — hidden on mobile */}
          <div className="hidden md:flex items-center space-x-10 font-label">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={desktopLinkClass(href)}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/student" className="hidden md:block">
              <button className="bg-primary text-white px-6 lg:px-8 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-95 transition-all">
                Masuk
              </button>
            </Link>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-72 z-50 bg-white shadow-2xl flex flex-col md:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <span className="text-xl font-black tracking-tight text-primary font-headline">SAKTI</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_LINKS.map(({ href, label }, i) => {
                  const isActive = pathname === href;
                  return (
                    <motion.div
                      key={href}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                          isActive
                            ? "bg-blue-50 text-primary"
                            : "text-slate-600 hover:bg-slate-50 hover:text-primary"
                        }`}
                      >
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                        {label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* CTA */}
              <div className="px-6 py-6 border-t border-slate-100">
                <Link href="/dashboard/student" className="block">
                  <button className="w-full bg-primary text-white py-3 rounded-full font-bold text-sm shadow-md hover:bg-primary/90 active:scale-95 transition-all">
                    Masuk ke SAKTI
                  </button>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
