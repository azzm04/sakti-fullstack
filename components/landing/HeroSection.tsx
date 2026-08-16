"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap"; // Pastikan import gsap secara statis di atas

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Menggunakan gsap.context agar pembersihan (cleanup) lebih aman
    const ctx = gsap.context(() => {
      const chars = titleRef.current?.querySelectorAll(".char");
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (chars && chars.length > 0) {
        if (prefersReducedMotion) {
          // Langsung tampilkan tanpa animasi untuk pengguna reduced-motion
          gsap.set(chars, { x: 0, opacity: 1 });
        } else {
          // Menggunakan fromTo lebih stabil di React Strict Mode & Next.js Navigation
          gsap.fromTo(
            chars,
            {
              x: 100, // Mulai dari geser kanan 100px
              opacity: 0, // Transparan
            },
            {
              x: 0, // Berakhir di posisi asli
              opacity: 1, // Muncul penuh
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.03, // Jeda per huruf sedikit dipercepat agar lebih mulus
              delay: 0.1, // Beri sedikit jeda saat halaman baru dimuat
            }
          );
        }
      }
    }, titleRef); // Scope context ke titleRef

    return () => {
      // Membersihkan animasi saat komponen di-unmount (pindah halaman)
      ctx.revert();
    };
  }, []); // Kosong array dependency agar hanya jalan sekali saat mount

  const headingLines = ["Sistem Asisten KIPK", "Terpadu & Interaktif"];

  const renderSplitText = (text: string) =>
    text.split("").map((char, index) => (
      <span
        key={`${text}-${index}`}
        // Tambahkan inline-block dan opacity-0 sebagai default agar tidak berkedip
        className="inline-block char opacity-0"
        style={{ whiteSpace: "pre" }} // Memastikan spasi tidak diabaikan
      >
        {char}
      </span>
    ));

  return (
    <section
      id="beranda"
      className="relative pt-28 pb-32 md:pt-32 md:pb-40 bg-primary text-white selection:bg-white/30 selection:text-white overflow-hidden flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,18,71,0.82), rgba(11,18,71,0.72)), url('/widyapuraya.jpeg')",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center px-4 sm:px-6">
        <span className="inline-block px-4 py-1.5 bg-white/15 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full mb-6 backdrop-blur-sm border border-white/20">
          Universitas Diponegoro
        </span>

        <h1
          ref={titleRef}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight"
        >
          {headingLines.map((line, index) => (
            <span key={index} className="block overflow-hidden pb-2">
              {renderSplitText(line)}
              {index === 0 && <br className="hidden md:block" />}
            </span>
          ))}
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl text-white max-w-2xl mb-10 font-light hover:text-white">
          Platform pendukung tata kelola beasiswa KIP-Kuliah — dilengkapi
          Asisten Virtual AI, sistem pelaporan evaluasi, dan kanal pengaduan
          resmi.
        </p>

        <Link href="/login">
          <button className="bg-white text-primary px-6 sm:px-8 py-3.5 rounded-full font-bold text-base shadow-lg hover:bg-slate-100 hover:scale-105 active:scale-95 transition-[transform,background-color] duration-200 ease-out">
            Masuk ke SAKTI
          </button>
        </Link>
      </div>

      <div className="absolute bottom-[-2px] left-0 w-full leading-none z-20">
        <svg
          viewBox="0 0 1440 180"
          className="block w-full h-[80px] md:h-[160px] text-[#F8FAFC] fill-current"
          preserveAspectRatio="none"
        >
          <path d="M0,100 C360,180 1080,180 1440,100 L1440,180 L0,180 Z"></path>
        </svg>
      </div>
    </section>
  );
}