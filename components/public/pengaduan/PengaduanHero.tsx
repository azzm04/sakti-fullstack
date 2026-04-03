'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function PengaduanHero() {
  return (
    <section className="relative overflow-hidden bg-primary py-24 md:py-32">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-3 py-1 bg-white/20 text-white text-[10px] font-bold tracking-widest uppercase rounded-full mb-6"
          >
            INTEGRITAS PENDIDIKAN
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-headline font-extrabold text-white leading-tight mb-6"
          >
            Layanan Pengaduan KIP-K
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-white/80 leading-relaxed mb-8 max-w-xl"
          >
            Membantu menjaga amanah negara dalam pendistribusian beasiswa. Laporkan indikasi
            penyalahgunaan bantuan KIP-Kuliah untuk memastikan bantuan tepat sasaran kepada
            mereka yang benar-benar membutuhkan.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a
              href="https://forms.gle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Buka Form Pelaporan
              <span className="material-symbols-outlined ml-2 text-base">open_in_new</span>
            </a>
            <Link
              href="#prosedur"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-medium rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Lihat Prosedur
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:block relative h-[400px]"
        >
          <img
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800&auto=format&fit=crop"
            alt="Layanan Pengaduan"
            className="w-full h-full object-cover rounded-3xl shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}
