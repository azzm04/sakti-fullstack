"use client";

import { motion } from "framer-motion";
import { CreditCard, Users, TrendingDown, Home, Banknote, BookOpen, Award } from "lucide-react";

const ELIGIBILITY = [
  { icon: <CreditCard className="w-6 h-6" />, title: "Pemegang KIP / PIP", description: "Siswa SMA/SMK sederajat yang memiliki Kartu Indonesia Pintar." },
  { icon: <Users className="w-6 h-6" />, title: "Keluarga PKH / KKS", description: "Berasal dari keluarga peserta Program Keluarga Harapan atau pemegang KKS." },
  { icon: <TrendingDown className="w-6 h-6" />, title: "Desil 1 - 4 DTKS", description: "Masuk dalam kelompok masyarakat miskin/rentan miskin maksimal pada desil 4.", highlighted: true },
];

const DOCUMENTS = [
  { icon: <Home className="w-8 h-8" />, title: "Foto Rumah", subtitle: "Tampak depan & ruang keluarga" },
  { icon: <Banknote className="w-8 h-8" />, title: "Slip Gaji", subtitle: "Atau surat keterangan penghasilan" },
  { icon: <BookOpen className="w-8 h-8" />, title: "Raport", subtitle: "Semester 1 s/d 5 dilegalisir" },
  { icon: <Award className="w-8 h-8" />, title: "Sertifikat", subtitle: "Prestasi akademik/non-akademik" },
];

export default function EligibilitySection() {
  return (
    <section className="py-24 px-8 bg-slate-50" id="syarat">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Syarat */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Syarat Penerima</h2>
              <p className="text-slate-500 text-lg">Prioritas diberikan kepada siswa yang memenuhi salah satu kriteria berikut:</p>
            </div>
            <div className="space-y-4">
              {ELIGIBILITY.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex gap-5 p-6 bg-white rounded-2xl border shadow-sm ${item.highlighted ? "border-l-4 border-l-primary border-y-slate-100 border-r-slate-100" : "border-slate-100"}`}
                >
                  <div className={`p-3 rounded-xl h-fit ${item.highlighted ? "bg-blue-50 text-primary" : "bg-slate-50 text-slate-500"}`}>
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-primary mb-1 text-lg">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Dokumen */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">Dokumen Pendukung</h2>
              <p className="text-slate-500 text-lg">Siapkan file digital dalam format JPG/PDF dengan ukuran maksimal 300KB per file.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCUMENTS.map((doc, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-primary/30 hover:shadow-md transition-all group"
                >
                  <div className="text-slate-400 group-hover:text-primary transition-colors duration-300">{doc.icon}</div>
                  <div>
                    <div className="text-base font-bold text-primary mb-1">{doc.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{doc.subtitle}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
