"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { judulHalaman, deskripsiHalaman, tautanNavigasi } from "./tampilan";
import { judulPeriode, tanggalWib, type PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";

export default function KepalaPeriode({ periode: p, contoh }: { periode: PeriodeRuangKerja; periods: { id: string; label: string }[]; contoh: boolean }) {
  const params = useSearchParams();
  const jadwal = params.get("langkah") === "jadwal";
  const pengingat = params.get("langkah") === "pengingat";
  const nomor = p.label.match(/semester\s+(\d+)\b/i)?.[1];
  const jadwalTerkunci = contoh || !!p.ditutup_at || !!p.difinalisasi_at;
  const judul = pengingat ? "Pengingat pengisian" : jadwal ? (jadwalTerkunci ? "Jadwal periode" : "Ubah jadwal periode") : `${p.fase === "FINAL" ? "Hasil evaluasi ekonomi" : "Evaluasi ekonomi"}${nomor ? ` Semester ${nomor}` : ""}`;
  return <header>
    <nav aria-label="Navigasi evaluasi" className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1">
      <Link href={`/admin/monev${contoh ? "?demo=1" : ""}`} className={tautanNavigasi}><ArrowLeft size={14} aria-hidden />Kembali ke periode evaluasi</Link>
      {!jadwal && !pengingat && <Link href={`/admin?tab=monev&demo=${contoh ? 1 : 0}&periode=${encodeURIComponent(p.id)}`} className={`${tautanNavigasi} hover:underline`}>Dashboard Monev</Link>}
    </nav>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className={judulHalaman}>{judul}</h1>
        <p className={deskripsiHalaman}>{judulPeriode(p)}{!jadwal && (p.fase === "FINAL" ? " · Hasil final, baca-saja" : p.ditutup_at ? " · Pengisian ditutup" : ` · Batas pengisian ${tanggalWib(p.deadline)} WIB`)}</p>
        {contoh && <p className="mt-1 text-[12px] text-[#64748B]">Data contoh</p>}
      </div>
    </div>
  </header>;
}
