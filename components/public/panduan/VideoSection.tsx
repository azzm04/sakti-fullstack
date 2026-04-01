"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

export default function VideoSection() {
  return (
    <section className="py-24 px-8 bg-slate-50" id="tutorial">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Tutorial Pendaftaran KIP-Kuliah</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Tonton panduan visual lengkap yang memandu Anda melalui seluruh proses portal pendaftaran online.
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-2xl bg-slate-900 h-[300px] md:h-[500px]"
        >
          <Image
            alt="Video Placeholder"
            src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop"
            fill style={{ objectFit: "cover" }}
            className="opacity-60 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
            <div className="flex flex-col md:flex-row justify-between md:items-end text-white gap-4">
              <div>
                <p className="font-bold text-xl mb-1">Panduan Pengisian Data 2026</p>
                <p className="text-sm text-slate-300 font-medium">Durasi: 12:45 • @kemdikbud.ri</p>
              </div>
              <a className="text-sm font-bold hover:underline bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-center"
                href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                Buka di YouTube
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
