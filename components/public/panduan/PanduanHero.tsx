"use client";

import Image from "next/image";
import { Play, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function PanduanHero() {
  return (
    <section className="relative bg-white py-20 px-8 overflow-hidden border-b border-slate-200">
      <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
          <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
            Official Resources 2026
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-primary leading-[1.1] font-headline tracking-tight">
            Panduan Pendaftaran KIP-Kuliah 2026
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
            Akses resmi panduan langkah demi langkah program bantuan pendidikan nasional. Berdasarkan sumber terverifikasi dari Kemdikbudristek.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <a href="#tutorial">
              <button className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 shadow-lg active:scale-95 transition-all">
                <Play className="w-5 h-5 fill-current" /> Lihat Tutorial
              </button>
            </a>
            <a href="#syarat">
              <button className="flex items-center gap-2 bg-white text-slate-600 px-8 py-4 rounded-xl font-bold border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all">
                Pelajari Syarat
              </button>
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="relative hidden md:block h-[28rem]">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden z-10">
            <Image alt="Academic Focus" src="https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2000&auto=format&fit=crop" fill style={{ objectFit: "cover" }} priority />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
          </div>
          <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl z-20 flex items-center gap-4 border border-slate-100">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <BadgeCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-bold text-primary">Informasi Resmi</div>
              <div className="text-xs text-slate-500 font-medium">Update: Jan 2026</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
