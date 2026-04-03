"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname(); 

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getMenuClass = (path: string) => {
    const isActive = pathname === path;

    return isActive
      ? "text-primary font-bold border-b-2 border-primary py-1 transition-colors" 
      : "text-secondary font-medium hover:text-primary transition-colors py-1 border-b-2 border-transparent"; 
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 flex justify-center pointer-events-none px-4 sm:px-8 transition-all duration-300">
      <nav
        className={`pointer-events-auto flex justify-between items-center transition-all duration-500 ease-in-out ${
          isScrolled
            ? "mt-4 w-full max-w-4xl h-16 bg-white/30 backdrop-blur-lg shadow-lg rounded-full px-6 border border-white/40"
            : "mt-0 w-full max-w-full h-20 bg-white/90 backdrop-blur-md px-8 border-b border-slate-200"
        }`}
      >
        {/* LOGO */}
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-primary font-headline"
        >
          SAKTI
        </Link>

        <div className="hidden md:flex items-center space-x-10 font-label">
          <Link href="/" className={getMenuClass("/")}>
            Beranda
          </Link>
          <Link href="/panduan" className={getMenuClass("/panduan")}>
            Panduan
          </Link>
          <Link href="/pengaduan" className={getMenuClass("/pengaduan")}>
            Pengaduan
          </Link>
          <Link href="/kontak" className={getMenuClass("/kontak")}>
            Kontak
          </Link>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          <Link href="/dashboard/student">
            <button className="bg-primary text-white px-6 lg:px-8 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-primary/90 hover:shadow-lg active:scale-95 transition-all">
              Masuk
            </button>
          </Link>
        </div>
      </nav>
    </div>
  );
}
