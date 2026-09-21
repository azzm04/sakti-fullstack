"use client";

import { motion } from "framer-motion";
import { ServiceCarousel, type Service } from "@/components/ui/services-card";

const layanan: Service[] = [
  {
    number: "001",
    title: "Layanan Informasi berbasis Kecerdasan Buatan",
    description:
      "Asisten virtual AI yang siap menjawab pertanyaan seputar beasiswa KIP-Kuliah secara cepat dan akurat.",
    image: "/layanan/informasi-ai.png",
    gradient:
      "from-sky-100 to-sky-200 dark:from-sky-900/50 dark:to-sky-800/50",
  },
  {
    number: "002",
    title: "Monitoring & Evaluasi",
    description:
      "Pantau progres pelaporan dan evaluasi penerima beasiswa secara transparan dan terukur.",
    image: "/layanan/monitoring-evaluasi.png",
    gradient:
      "from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50",
  },
  {
    number: "003",
    title: "Sistem Pengaduan",
    description:
      "Kanal pengaduan resmi dan aman untuk melaporkan permasalahan terkait penyaluran beasiswa.",
    image: "/layanan/sistem-pengaduan.png",
    gradient:
      "from-rose-100 to-rose-200 dark:from-rose-900/50 dark:to-rose-800/50",
  },
];

export default function LayananSection() {
  return (
    <section
      id="layanan"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#F8FAFC] overflow-hidden"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-bold tracking-widest uppercase rounded-full mb-4">
          Akses Cepat & Transparan
        </span>

        <h2 className="text-3xl font-bold text-primary mb-4">
          Layanan Terpadu SAKTI
        </h2>

        <p className="text-slate-500 max-w-2xl mx-auto">
          Mempermudah akses informasi, pelaporan evaluasi, dan menjaga
          transparansi distribusi beasiswa di lingkungan kampus.
        </p>
      </motion.div>

      {/* Carousel */}
      <ServiceCarousel services={layanan} />
    </section>
  );
}
