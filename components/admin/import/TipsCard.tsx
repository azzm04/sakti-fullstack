"use client";

import { motion } from "framer-motion";

export default function TipsCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-primary-fixed-dim/10 p-5 rounded-xl flex gap-4 items-start border border-primary/5"
    >
      <span className="material-symbols-outlined text-primary shrink-0">
        info
      </span>
      <div>
        <h5 className="text-xs font-bold text-primary mb-1 font-headline">
          Tips Import Data
        </h5>
        <p className="text-[11px] text-primary/80 leading-relaxed">
          Sistem akan secara otomatis memisahkan data yang tidak lengkap. Anda
          dapat memperbaiki data "Incomplete" secara manual di tahap berikutnya
          atau melakukan unggah ulang file yang telah diperbaiki.
        </p>
      </div>
    </motion.div>
  );
}
