"use client"

import { motion } from "framer-motion"
import { Info } from "lucide-react"

interface Props {
  total: number
  jalurMasuk: string
  tahunSeleksi: string
}

export default function ImportSuccessBanner({ total, jalurMasuk, tahunSeleksi }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-4 p-5 bg-admin-accent/5 border border-admin-accent/20 rounded-2xl shadow-sm"
    >
      <div className="w-10 h-10 rounded-full bg-admin-surface flex items-center justify-center shrink-0 shadow-sm text-admin-accent">
        <Info size={20} />
      </div>
      <div>
        <h4 className="font-admin-heading text-base font-bold text-admin-text mb-1">
          Data Berhasil Diunggah!
        </h4>
        <p className="text-sm text-admin-text-3 leading-relaxed">
          <b className="text-admin-text">{total} kandidat</b> jalur{" "}
          <b className="text-admin-text">{jalurMasuk}</b> tahun{" "}
          <b className="text-admin-text">{tahunSeleksi}</b> tersimpan di database.
          Lanjutkan ke <b className="text-admin-text">Evaluasi Wawancara</b>.
        </p>
      </div>
    </motion.div>
  )
}
