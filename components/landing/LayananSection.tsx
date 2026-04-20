"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileCheck, ShieldCheck } from "lucide-react";

export default function LayananSection() {
  return (
    <section
      id="layanan"
      className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#F8FAFC]"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-16"
      >
        <h2 className="text-3xl font-bold text-primary mb-4">
          Layanan Terpadu SAKTI
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Mempermudah akses informasi, pelaporan evaluasi, dan menjaga
          transparansi distribusi beasiswa di lingkungan kampus.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={{
          visible: {
            transition: { staggerChildren: 0.18 },
          },
        }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
      >
        {/* Card 1 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">
            Asisten Virtual Cerdas
          </h3>
          <p className="text-slate-500 text-sm">
            Tanya jawab seputar regulasi dan panduan KIP-K 24/7 melalui Chatbot
            AI yang bersumber langsung dari pedoman KIPK kemdiktisaintek.
          </p>
        </motion.div>

        {/* Card 2 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">
            Monitoring & Evaluasi
          </h3>
          <p className="text-slate-500 text-sm">
            Unggah berkas Monitoring Evaluasi Ekonomi Setiap Semester.
            Dilengkapi sistem pengingat via Telegram agar tidak terlewat.
          </p>
        </motion.div>

        {/* Card 3 */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mx-auto mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-3">
            Sistem Pengaduan
          </h3>
          <p className="text-slate-500 text-sm">
            Kanal aman dan rahasia (Whistleblowing System) untuk melaporkan
            indikasi penyalahgunaan atau salah sasaran dana beasiswa.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}