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
      className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-3xl shadow-sm"
    >
      <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center shrink-0 shadow-sm text-primary">
        <Info size={20} />
      </div>
      <div>
        <h4 className="text-base font-bold text-foreground mb-1">
          Data Berhasil Diunggah!
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <b className="text-foreground">{total} kandidat</b> jalur{" "}
          <b className="text-foreground">{jalurMasuk}</b> tahun{" "}
          <b className="text-foreground">{tahunSeleksi}</b> tersimpan di database.
          Lanjutkan ke <b className="text-foreground">Plotting Wawancara</b>.
        </p>
      </div>
    </motion.div>
  )
}
