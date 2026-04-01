"use client";

import { motion } from "framer-motion";
import { IconMail, IconPhone, IconMapPin } from "@tabler/icons-react";

export default function ContactInfo() {
  return (
    <div className="lg:col-span-5 space-y-8">
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-lg flex gap-6 items-start"
      >
        <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
          <IconMapPin className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-xl mb-2">Direktorat Kemahasiswaan Undip</h3>
          <p className="text-on-surface-variant leading-relaxed">
            Jl. Prof. Sudarto, SH, Tembalang, Semarang, Jawa Tengah 50275
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-high cursor-default"
        >
          <IconMail className="w-6 h-6 text-primary mb-3" />
          <div className="text-sm font-label uppercase tracking-tighter text-on-surface-variant mb-1">Email Resmi</div>
          <div className="font-bold">dirmawa@live.undip.ac.id</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-high cursor-default"
        >
          <IconPhone className="w-6 h-6 text-primary mb-3" />
          <div className="text-sm font-label uppercase tracking-tighter text-on-surface-variant mb-1">Telepon</div>
          <div className="font-bold">(024) 7460024</div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
        className="relative group h-64 rounded-[2rem] overflow-hidden shadow-inner bg-surface-container-high"
      >
        <img
          className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
          src="/undip-map.jpg" alt="Undip Location"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2">
          <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
          <span className="text-xs font-bold text-primary">KAMPUS UNDIP</span>
        </div>
      </motion.div>
    </div>
  );
}
