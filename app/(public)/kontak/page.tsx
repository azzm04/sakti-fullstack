'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { motion } from 'framer-motion';
import ContactInfo from '@/components/public/kontak/ContactInfo';
import FaqBanner from '@/components/public/kontak/FaqBanner';
import ChatWidget from '@/components/chat/ChatWidget';

export default function KontakPage() {
  return (
    <div className="bg-white font-body text-slate-800">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-2">
            HUBUNGI KAMI
          </span>
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary tracking-tight mb-4">
            Layanan Bantuan Terpadu
          </h1>
          <p className="max-w-2xl text-lg text-slate-500 leading-relaxed">
            Kami siap membantu Anda dalam proses administrasi beasiswa dan layanan akademik
            SAKTI di lingkungan Universitas Diponegoro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kiri: info + map */}
          <ContactInfo />

          {/* Kanan: info tambahan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Jam Operasional */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-slate-800">Jam Operasional</h3>
              </div>
              <div className="space-y-3">
                {[
                  { hari: 'Senin – Jumat', jam: '08.00 – 16.00 WIB', aktif: true },
                  { hari: 'Sabtu',         jam: '08.00 – 12.00 WIB', aktif: true },
                  { hari: 'Minggu & Libur Nasional', jam: 'Tutup', aktif: false },
                ].map(({ hari, jam, aktif }) => (
                  <div key={hari} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <span className="text-sm text-slate-600">{hari}</span>
                    <span className={`text-sm font-semibold ${aktif ? 'text-slate-800' : 'text-slate-400'}`}>{jam}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanal Bantuan */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
                </div>
                <h3 className="font-headline font-bold text-lg text-slate-800">Kanal Bantuan</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: 'chat',          label: 'SAKABOT AI',       desc: 'Tanya langsung via chatbot 24/7',       href: '/mahasiswa/chatbot',  cta: 'Buka Chat' },
                  { icon: 'send',          label: 'Telegram Bot',     desc: 'Notifikasi & info beasiswa otomatis',   href: 'https://t.me/SAKTIBot', cta: 'Buka Telegram' },
                  { icon: 'help_outline',  label: 'Panduan SAKTI',    desc: 'Dokumentasi lengkap penggunaan sistem', href: '/panduan',            cta: 'Lihat Panduan' },
                ].map(({ icon, label, desc, href, cta }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{label}</p>
                        <p className="text-xs text-slate-400">{desc}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      {cta}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            {/* <div className="bg-primary rounded-2xl p-8">
              <h3 className="font-headline font-bold text-lg text-white mb-2">Ikuti Kami</h3>
              <p className="text-white/70 text-sm mb-6">Dapatkan info terbaru seputar KIP-Kuliah dan beasiswa UNDIP.</p>
              <div className="flex gap-3">
                {[
                  { icon: 'language', label: 'Website Resmi', href: 'https://dirmawa.undip.ac.id' },
                  { icon: 'send',     label: 'Telegram',      href: 'https://t.me/SAKTIBot' },
                ].map(({ icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">{icon}</span>
                    {label}
                  </a>
                ))}
              </div>
            </div> */}
          </motion.div>
        </div>

        <FaqBanner />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
}
