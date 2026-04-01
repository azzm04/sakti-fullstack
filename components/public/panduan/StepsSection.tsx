"use client";

import { motion } from "framer-motion";

const STEPS = [
  { number: "01", title: "Pendaftaran Akun", description: "Siswa melakukan pendaftaran mandiri melalui portal KIP-K dengan NIK, NISN, dan NPSN yang valid." },
  { number: "02", title: "Pengisian Data", description: "Melengkapi data ekonomi, keluarga, dan dokumen pendukung sesuai kondisi yang sebenarnya." },
  { number: "03", title: "Pemilihan Seleksi", description: "Memilih jalur seleksi masuk perguruan tinggi (SNBP/SNBT/Mandiri) pada dashboard KIP-K." },
  { number: "04", title: "Penetapan Penerima", description: "Verifikasi dokumen dan kunjungan lapangan oleh perguruan tinggi sebelum penetapan resmi.", highlighted: true },
];

export default function StepsSection() {
  return (
    <section className="py-24 px-8 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Prosedur Utama</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-primary font-headline tracking-tight">Tahapan Pendaftaran</h2>
          </div>
          <p className="text-slate-500 max-w-md md:text-right text-lg">
            Ikuti empat langkah utama ini untuk memastikan aplikasi Anda diterima dan diproses oleh sistem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`bg-slate-50 p-8 rounded-3xl space-y-5 hover:shadow-lg transition-all border ${step.highlighted ? "border-primary shadow-md bg-blue-50/50" : "border-slate-100"}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${step.highlighted ? "bg-primary text-white shadow-md" : "bg-white text-primary border border-slate-200 shadow-sm"}`}>
                {step.number}
              </div>
              <h3 className="font-bold text-xl text-primary font-headline">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
