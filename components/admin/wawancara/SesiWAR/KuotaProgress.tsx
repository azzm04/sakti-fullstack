"use client";

import { motion } from "framer-motion";
import { UserRound } from "lucide-react";
import type { Sesi, KuotaItem } from "@/types/wawancara";

interface KuotaProgressProps {
  sesi: Sesi;
  kuotaList: KuotaItem[];
}

export default function KuotaProgress({ sesi, kuotaList }: KuotaProgressProps) {
  const terisi = kuotaList.length;
  const persen = sesi.kuota_pewawancara > 0 ? (terisi / sesi.kuota_pewawancara) * 100 : 0;

  return (
    <div className="rounded-2xl border border-admin-border-soft bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-admin-heading text-sm font-bold text-admin-text">Slot Urutan Pewawancara</h3>
          <p className="mt-0.5 text-xs text-admin-text-4">
            Setiap slot diklaim oleh satu pewawancara sesuai urutan klaim.
          </p>
        </div>
        <div className="flex min-w-[180px] flex-1 items-center gap-3 sm:max-w-[260px]">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-admin-border-soft">
            <motion.div
              className="h-full rounded-full bg-admin-accent"
              initial={{ width: 0 }}
              animate={{ width: `${persen}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="whitespace-nowrap text-xs font-semibold text-admin-text-2">
            {terisi} / {sesi.kuota_pewawancara} terisi
          </span>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: sesi.kuota_pewawancara }, (_, i) => {
          const kuotaItem = kuotaList.find((s) => s.kuota_ke === i + 1);

          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                kuotaItem
                  ? "border border-admin-border bg-white"
                  : "border border-dashed border-admin-border bg-admin-surface-soft"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  kuotaItem ? "bg-admin-accent text-white" : "bg-white text-admin-text-5 ring-1 ring-admin-border"
                }`}
              >
                {i + 1}
              </span>

              {kuotaItem ? (
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-admin-text">
                    {kuotaItem.pewawancara?.nama ?? "—"}
                  </p>
                  <p className="text-[11px] text-admin-text-4">
                    Klaim{" "}
                    {new Date(kuotaItem.claimed_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-admin-text-5">
                  <UserRound size={13} className="shrink-0" />
                  Belum diklaim
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
