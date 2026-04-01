"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import ContactInfo from "@/components/public/kontak/ContactInfo";
import ContactForm from "@/components/public/kontak/ContactForm";
import FaqBanner from "@/components/public/kontak/FaqBanner";

export default function KontakPage() {
  return (
    <div className="bg-surface font-body text-on-surface">
      <Navbar />
      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest block mb-2">HUBUNGI KAMI</span>
          <h1 className="font-headline text-5xl font-extrabold text-primary tracking-tight mb-4">Layanan Bantuan Terpadu</h1>
          <p className="max-w-2xl text-lg text-on-surface-variant font-body">
            Kami siap membantu Anda dalam proses administrasi beasiswa dan layanan akademik SAKTI di lingkungan Universitas Diponegoro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <ContactInfo />
          <ContactForm />
        </div>

        <FaqBanner />
      </main>
      <Footer />
    </div>
  );
}
