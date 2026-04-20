"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function HeroSection() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let animation: gsap.core.Tween | undefined;
    let ctx: gsap.Context | undefined;

    async function animateTitle() {
      const { gsap } = await import("gsap");

      ctx = gsap.context(() => {
        const chars = titleRef.current?.querySelectorAll(".char");

        if (chars?.length) {
          animation = gsap.from(chars, {
            x: 150,
            opacity: 0,
            duration: 0.8,
            ease: "power4.out",
            stagger: 0.04,
          });
        }
      }, titleRef);
    }

    animateTitle();

    return () => {
      animation?.kill();
      ctx?.revert();
    };
  }, []);

  const headingLines = ["Sistem Asisten KIPK", "Terpadu & Interaktif"];

  const renderSplitText = (text: string) =>
    text.split("").map((char, index) => (
      <span key={`${text}-${index}`} className="inline-block char">
        {char === " " ? "\u00A0" : char}
      </span>
    ));

  return (
    <section
      id="beranda"
      className="relative pt-28 pb-32 md:pt-32 md:pb-40 bg-primary text-white overflow-hidden flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,18,71,0.82), rgba(11,18,71,0.72)), url('/widyapuraya.jpeg')",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center px-4 sm:px-6">
        <h1
          ref={titleRef}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight"
        >
          {headingLines.map((line, index) => (
            <span key={index} className="block">
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
          <button className="bg-white text-primary px-6 sm:px-8 py-3.5 rounded-full font-bold text-base shadow-lg hover:bg-slate-100 hover:scale-105 transition-all">
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