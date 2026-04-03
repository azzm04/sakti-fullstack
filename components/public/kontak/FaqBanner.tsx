'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function FaqBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mt-16 p-10 md:p-12 bg-primary rounded-[2rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-xl">
        <h3 className="font-headline text-2xl md:text-3xl font-bold text-white mb-3">
          Butuh jawaban cepat?
        </h3>
        <p className="text-white/70 text-base leading-relaxed">
          Cek pusat bantuan kami untuk pertanyaan yang sering diajukan mengenai pendaftaran,
          pencairan dana, dan verifikasi data SAKTI.
        </p>
      </div>

      <div className="relative z-10 shrink-0">
        <Link
          href="/panduan"
          className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-slate-50 transition-colors whitespace-nowrap inline-block shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
        >
          Kunjungi Pusat Bantuan
        </Link>
      </div>
    </motion.div>
  );
}
