"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const layanan = [
  {
    image: "/layanan/informasi-ai.png",
    title: "Layanan Informasi berbasis Kecerdasan Buatan",
  },
  {
    image: "/layanan/monitoring-evaluasi.png",
    title: "Monitoring & Evaluasi",
  },
  {
    image: "/layanan/sistem-pengaduan.png",
    title: "Sistem Pengaduan",
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
      <div className="relative overflow-hidden">
        <motion.div
          className="flex gap-6 w-max"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            duration: 25,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* SET 1 */}
          {layanan.map((item, index) => (
            <LayananCard
              key={`first-${index}`}
              image={item.image}
              title={item.title}
            />
          ))}

          {/* SET 2 - DUPLIKAT UNTUK LOOP */}
          {layanan.map((item, index) => (
            <LayananCard
              key={`second-${index}`}
              image={item.image}
              title={item.title}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* =========================================================
   CARD
========================================================= */

function LayananCard({
  image,
  title,
}: {
  image: string;
  title: string;
}) {
  return (
    <div
      className="
        shrink-0
        w-[150px]
        sm:w-[220px]
        lg:w-[320px]
        bg-gradient-to-r from-[#005B96] to-primary
        rounded-2xl
        overflow-hidden
        shadow-xl
      "
    >
      <div className="p-4 flex flex-col items-center">

        {/* Gambar */}
        <div className="relative w-full h-[80px] sm:h-[90px] mb-3">
          <Image
            src={image}
            alt={title}
            fill
            sizes="320px"
            className="object-contain"
          />
        </div>

        {/* Judul */}
        <h3 className="text-xs sm:text-sm lg:text-base font-bold text-white text-center leading-snug">
          {title}
        </h3>

      </div>
    </div>
  );
}
