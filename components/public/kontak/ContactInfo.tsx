'use client';

import { motion } from 'framer-motion';
import { IconMail, IconPhone, IconMapPin } from '@tabler/icons-react';
import dynamic from 'next/dynamic';

// Leaflet harus di-load secara dynamic (SSR tidak support window/document)
const DirmawMap = dynamic(() => import('./DirmawMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 rounded-2xl bg-slate-100 animate-pulse flex items-center justify-center">
      <span className="text-xs text-slate-400">Memuat peta...</span>
    </div>
  ),
});

export default function ContactInfo() {
  return (
    <div className="lg:col-span-5 space-y-6 h-fit">
      {/* Address card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="bg-white border border-slate-100 p-8 rounded-2xl shadow-sm flex gap-5 items-start"
      >
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-primary shrink-0">
          <IconMapPin className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-headline font-bold text-lg text-slate-800 mb-1">Direktorat Kemahasiswaan Undip</h3>
          <p className="text-slate-500 text-sm leading-relaxed">
            Jl. Prof. Sudarto, SH, Tembalang, Semarang, Jawa Tengah 50275
          </p>
        </div>
      </motion.div>

      {/* Email & Phone */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <IconMail className="w-4 h-4 text-primary" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Resmi</div>
          <div className="font-bold text-slate-800 text-sm">dirmawa@live.undip.ac.id</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <IconPhone className="w-4 h-4 text-primary" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Telepon</div>
          <div className="font-bold text-slate-800 text-sm">(024) 7460024</div>
        </motion.div>
      </div>

      {/* Leaflet Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
      >
        <DirmawMap />
      </motion.div>
    </div>
  );
}
