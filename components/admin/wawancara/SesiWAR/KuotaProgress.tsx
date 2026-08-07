"use client";

import { motion } from "framer-motion";
import type { Sesi, KuotaItem } from "@/types/wawancara";

interface KuotaProgressProps {
  sesi: Sesi;
  kuotaList: KuotaItem[];
}

export default function KuotaProgress({ sesi, kuotaList }: KuotaProgressProps) {
  const kuotaPenuh = kuotaList.length >= sesi.kuota_pewawancara;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm">Kuota Pewawancara</h3>
        <span className="text-xs font-bold text-primary">
          {kuotaList.length} / {sesi.kuota_pewawancara} terisi
        </span>
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className={`h-full rounded-full ${kuotaPenuh ? "bg-emerald-500" : "bg-primary"}`}
          initial={{ width: 0 }}
          animate={{ width: `${(kuotaList.length / sesi.kuota_pewawancara) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
        {Array.from({ length: sesi.kuota_pewawancara }, (_, i) => {
          const kuotaItem = kuotaList.find((s) => s.kuota_ke === i + 1);
          return (
            <div
              key={i}
              title={
                kuotaItem
                  ? `${kuotaItem.pewawancara?.nama ?? "—"} (${new Date(
                      kuotaItem.claimed_at,
                    ).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`
                  : `Kuota ${i + 1} — kosong`
              }
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-default ${
                kuotaItem ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-300"
              }`}
            >
              <span>{i + 1}</span>
              {kuotaItem && (
                <span className="text-[8px] font-normal opacity-80 truncate w-full text-center px-1">
                  {kuotaItem.pewawancara?.nama?.split(" ")[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
