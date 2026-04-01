"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function FaqBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="mt-24 p-12 bg-primary text-on-primary rounded-[2rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
    >
      <div className="relative z-10 max-w-xl">
        <h3 className="font-headline text-3xl font-bold mb-4">Butuh jawaban cepat?</h3>
        <p className="opacity-80 text-lg">
          Cek pusat bantuan kami untuk pertanyaan yang sering diajukan mengenai pendaftaran, pencairan dana, dan verifikasi data SAKTI.
        </p>
      </div>
      <div className="relative z-10">
        <Link href="/panduan" className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-surface-container-lowest transition-colors whitespace-nowrap inline-block">
          Kunjungi Pusat Bantuan
        </Link>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary-container opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2" />
    </motion.div>
  );
}
