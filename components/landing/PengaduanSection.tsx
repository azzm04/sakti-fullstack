"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

export default function PengaduanSection() {
  return (
    <section
      id="pengaduan"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC] relative overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-6xl mx-auto"
      >
        <div className="bg-gradient-to-r from-[#005B96] to-primary rounded-3xl p-8 md:p-14 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-10 md:gap-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="inline-block px-4 py-1.5 bg-white/20 text-white text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full mb-4 sm:mb-6 backdrop-blur-sm"
            >
              INTEGRITAS PENDIDIKAN
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-brolimo text-white leading-tight mb-4 sm:mb-6"
            >
              Layanan Pengaduan KIP-K
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-blue-50 leading-relaxed mb-8 max-w-xl"
            >
              Membantu menjaga amanah negara dalam pendistribusian beasiswa.
              Laporkan indikasi penyalahgunaan bantuan KIP-Kuliah untuk
              memastikan bantuan tepat sasaran kepada mereka yang benar-benar
              membutuhkan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full flex justify-center md:justify-start"
            >
              <a
                href="https://forms.gle/LINK_GFORM_ANDA"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3.5 sm:py-4 bg-white text-primary font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Buka Form Pelaporan
                <ExternalLink className="w-5 h-5 ml-2 shrink-0" />
              </a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10 hidden md:block md:w-1/2 w-full aspect-[4/3] md:aspect-[5/4] rounded-2xl overflow-hidden shadow-2xl"
          >
            <Image
              src="/Pengaduan.jpg"
              alt="Integritas Pendidikan KIPK"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent pointer-events-none"></div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}