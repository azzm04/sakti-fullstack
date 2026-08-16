"use client";

import type { Sesi, KuotaItem } from "@/types/wawancara";

interface KuotaTableProps {
  sesi: Sesi;
  kuotaList: KuotaItem[];
  offset: number;
}

export default function KuotaTable({ sesi, kuotaList, offset }: KuotaTableProps) {
  if (kuotaList.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-admin-border-soft shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-admin-border-soft">
        <h3 className="font-admin-heading font-bold text-admin-text text-sm">Detail Kuota Terisi</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-admin-surface-soft border-b border-admin-border-soft">
            {["No.", "Pewawancara", "Email", "Waktu Klaim", "Mahasiswa (urutan)"].map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-admin-text-5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-surface-soft">
          {kuotaList.map((s) => {
            const step = sesi.kuota_pewawancara;
            const urutan = Array.from(
              { length: Math.ceil(sesi.kuota_mahasiswa / step) },
              (_, i) => offset + s.kuota_ke + i * step,
            ).filter((n) => n <= offset + sesi.kuota_mahasiswa);

            return (
              <tr key={s.id} className="hover:bg-admin-surface-soft/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-admin-accent text-white flex items-center justify-center text-xs font-bold">
                    {s.kuota_ke}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-admin-text">
                  {s.pewawancara?.nama ?? "—"}
                </td>
                <td className="px-4 py-3 text-xs text-admin-text-5">{s.pewawancara?.email}</td>
                <td className="px-4 py-3 text-xs text-admin-text-4">
                  {new Date(s.claimed_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {urutan.slice(0, 6).map((n) => (
                      <span
                        key={n}
                        className="text-[10px] font-bold px-1.5 py-0.5 bg-admin-border-soft text-admin-text-3 rounded"
                      >
                        #{n}
                      </span>
                    ))}
                    {urutan.length > 6 && (
                      <span className="text-[10px] text-admin-text-5">+{urutan.length - 6} lagi</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
