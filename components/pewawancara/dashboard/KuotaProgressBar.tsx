"use client";

import { motion } from "framer-motion";

interface KuotaItem {
  kuota_ke: number;
  pewawancara?: { nama?: string } | null;
}

interface KuotaProgressBarProps {
  kuota: number;
  kuotaTerisi: number;
  kuotaList: KuotaItem[];
  myKuotaKe?: number | null;
}

/**
 * Progress bar visual status kuota pewawancara.
 */
export function KuotaProgressBar({ kuota, kuotaTerisi, kuotaList, myKuotaKe }: KuotaProgressBarProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-foreground">Status Kuota</p>
        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
          {kuotaTerisi} / {kuota}
        </span>
      </div>

      <div className="w-full h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${(kuotaTerisi / kuota) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-1.5">
        {Array.from({ length: kuota }, (_, i) => {
          const kuotaKe = i + 1;
          const kuotaItem = kuotaList.find((s) => s.kuota_ke === kuotaKe);
          const isMine = myKuotaKe === kuotaKe;

          return (
            <div
              key={kuotaKe}
              title={
                kuotaItem
                  ? isMine
                    ? "Kuota kamu"
                    : (kuotaItem.pewawancara?.nama ?? "Terisi")
                  : `Kuota ${kuotaKe} — tersedia`
              }
              className={`h-2.5 sm:h-3 w-full rounded-full transition-all duration-300 ${
                isMine
                  ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                  : kuotaItem
                    ? "bg-primary/40"
                    : "bg-muted border border-border/50"
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground font-medium">
        <span>Kuota 1</span>
        <span>Kuota {kuota}</span>
      </div>
    </div>
  );
}
