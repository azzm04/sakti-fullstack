"use client";

import { useState, useEffect, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // 👈 IMPORT DITAMBAHKAN
import { X, Menu } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/#beranda",   label: "Beranda" },
  { href: "/#panduan",   label: "Panduan" },
  { href: "/#pengaduan", label: "Pengaduan" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Panggil hook navigasi Next.js
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault(); // Kita ambil alih navigasi secara manual
    setMobileOpen(false);

    const targetPath = href.split("#")[0] || "/"; // Memisahkan rute utama (misal: "/")
    const sectionId = href.split("#")[1]; // Memisahkan ID (misal: "beranda")

    // LOGIKA PINTAR: Cek apakah user sedang berada di rute yang dituju
    if (pathname === targetPath) {
      // Jika SUDAH di Beranda, cukup gulir mulus ke bawah
      const section = document.getElementById(sectionId!);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
      }
    } else {
      // Jika SEDANG DI HALAMAN LAIN (Layanan Aduan), paksa pindah halaman!
      router.push(href);
    }
  };

  return (
    <>
      {/* ── Desktop / Tablet Navbar ── */}
      <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none transition-all duration-300">
        <nav
          className={`pointer-events-auto flex justify-between items-center transition-all duration-500 ease-in-out ${
            isScrolled
              ? "mt-4 w-[calc(100%-2rem)] lg:w-full max-w-4xl h-16 bg-primary/70 backdrop-blur-lg shadow-lg rounded-full px-5 md:px-8 border border-white/20"
              : "mt-0 w-full max-w-full h-20 bg-primary px-6 md:px-10 border-b border-white/10"
          }`}
        >
          <Link
            href="/#beranda"
            scroll={false}
            onClick={(event) => handleNavClick(event, "/#beranda")}
            className="text-2xl font-black tracking-tight text-white font-headline"
          >
            SAKTI
          </Link>

          {/* Desktop links — hidden on mobile */}
          <div className="hidden md:flex items-center space-x-10 font-label">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                scroll={false}
                onClick={(event) => handleNavClick(event, href)}
                className="text-blue-100 font-medium hover:text-white hover:border-b-2 hover:border-white py-1 transition-all border-b-2 border-transparent"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block">
              <button className="bg-white text-primary px-6 lg:px-8 py-2.5 rounded-full font-bold text-sm shadow hover:bg-slate-100 hover:shadow-md active:scale-95 transition-all">
                Masuk
              </button>
            </Link>

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>
      </div>

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
                  title="button"
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {NAV_LINKS.map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={href}
                      scroll={false}
                      onClick={(event) => handleNavClick(event, href)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* CTA */}
              <div className="px-6 py-6 border-t border-slate-100">
                <Link href="/login" className="block">
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