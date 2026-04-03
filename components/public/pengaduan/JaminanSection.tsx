'use client';

import { motion } from 'framer-motion';

const PROTECTIONS = [
  {
    icon: 'encrypted',
    title: 'Whistleblower Protection',
    desc: 'Identitas pelapor akan dijaga kerahasiaannya dan tidak akan dipublikasikan kepada pihak manapun.',
  },
  {
    icon: 'verified_user',
    title: 'Proses Investigasi Adil',
    desc: 'Setiap laporan akan diverifikasi secara profesional oleh tim khusus sebelum diambil tindakan lebih lanjut.',
  },
];

export default function JaminanSection() {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="bg-white rounded-[2rem] p-12 shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden relative border border-slate-100"
      >
        <div className="absolute -right-24 -bottom-24 w-64 h-64 bg-blue-50 rounded-full" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <div>
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
            </div>
            <h2 className="text-3xl font-headline font-extrabold text-primary mb-6">
              Jaminan Kerahasiaan & Perlindungan
            </h2>
            <div className="space-y-6">
              {PROTECTIONS.map(({ icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">{icon}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Catatan Penting</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Sistem Pengaduan Pelanggaran (Whistleblowing System) adalah aplikasi yang disediakan
              bagi Anda yang memiliki informasi dan ingin melaporkan suatu perbuatan berindikasi
              pelanggaran yang terjadi di lingkungan penerima bantuan KIP-Kuliah.
            </p>
            <div className="p-4 bg-white rounded-xl text-xs text-slate-400 italic border border-slate-100 leading-relaxed">
              "Kejujuran Anda adalah kunci masa depan pendidikan Indonesia yang lebih baik."
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
