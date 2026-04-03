'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '1',
    title: 'Identifikasi',
    desc: 'Pastikan indikasi pelanggaran didasarkan pada fakta objektif, bukan asumsi pribadi.',
    isPrimary: false,
  },
  {
    number: '2',
    title: 'Siapkan Bukti',
    desc: 'Kumpulkan bukti pendukung seperti foto, tangkapan layar, atau dokumen yang memperkuat laporan Anda.',
    isPrimary: false,
  },
  {
    number: '3',
    title: 'Isi Form',
    desc: 'Lengkapi formulir pengaduan secara detail melalui kanal resmi yang telah disediakan.',
    isPrimary: true,
  },
];

export default function ProsedurSection() {
  return (
    <section id="prosedur" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2 block">
            ALUR KERJA
          </span>
          <h2 className="text-3xl font-headline font-extrabold text-primary">Prosedur Pelaporan</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-0.5 border-t-2 border-dashed border-slate-200" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.12 }}
              className="relative text-center"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 ${
                step.isPrimary
                  ? 'bg-primary shadow-lg shadow-primary/30'
                  : 'bg-white shadow-sm border border-slate-200'
              }`}>
                {step.isPrimary
                  ? <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  : <span className="text-2xl font-bold text-primary">{step.number}</span>
                }
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-3">{step.title}</h3>
              <p className="text-slate-500 text-sm px-4 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
