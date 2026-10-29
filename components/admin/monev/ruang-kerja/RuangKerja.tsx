"use client";

import { useSearchParams } from "next/navigation";
import type { MonevDashboard as Dashboard } from "@/lib/dashboard-monev/data";
import type { LaporanEkonomi as Baris } from "@/lib/monev/laporan-ekonomi";
import type { PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";
import KepalaPeriode from "./KepalaPeriode";
import LangkahJadwal from "./LangkahJadwal";
import LaporanEkonomi from "./LaporanEkonomi";
import { halaman } from "./tampilan";

export default function RuangKerja({ periode, periods, dashboard, laporan }: {
  periode: PeriodeRuangKerja; periods: { id: string; label: string }[]; dashboard: Dashboard; laporan: Baris[];
}) {
  const params = useSearchParams();
  const jadwal = params.get("langkah") === "jadwal";
  const contoh = dashboard.contoh;
  const final = periode.fase === "FINAL";

  return <div className={halaman}>
    <div className="space-y-6">
      <KepalaPeriode periode={periode} periods={periods} contoh={contoh} />
      {jadwal ? <LangkahJadwal key={`${periode.id}-${periode.updated_at}`} periode={periode} contoh={contoh} /> : <>
        <LaporanEkonomi key={periode.id} rows={laporan} contoh={contoh} final={final} />
      </>}
    </div>
  </div>;
}
