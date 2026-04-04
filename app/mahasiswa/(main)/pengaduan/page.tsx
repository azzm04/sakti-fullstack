'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PengaduanHero from '@/components/public/pengaduan/PengaduanHero';
import KlasifikasiSection from '@/components/public/pengaduan/KlasifikasiSection';
import ProsedurSection from '@/components/public/pengaduan/ProsedurSection';
import JaminanSection from '@/components/public/pengaduan/JaminanSection';
import { motion } from 'framer-motion';
import ChatWidget from '@/components/chat/ChatWidget';

export default function PengaduanPage() {
  return (
    <div className="bg-white font-body text-slate-800">
      <Navbar />

      <main className="pt-20">
        <PengaduanHero />
        <KlasifikasiSection />
        <ProsedurSection />
        <JaminanSection />

        {/* CTA Bottom */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="pb-24 px-8 max-w-7xl mx-auto text-center"
        >
          <h2 className="text-2xl font-headline font-bold text-slate-800 mb-8">
            Siap Membantu Menjaga Amanah?
          </h2>
          <a
            href="https://forms.gle"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-5 bg-primary text-white font-bold rounded-2xl shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all active:scale-95 group"
          >
            Mulai Lapor Sekarang
            <span className="material-symbols-outlined ml-3 group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </a>
        </motion.section>
      </main>
      
      <ChatWidget />
      <Footer />
    </div>
  );
}
