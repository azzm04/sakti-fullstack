"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { judulPeriode, tanggalWib, type PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";

export default function KepalaPeriode({ periode: p, contoh }: { periode: PeriodeRuangKerja; periods: { id: string; label: string }[]; contoh: boolean }) {
  const params = useSearchParams();
  const jadwal = params.get("langkah") === "jadwal";
  const nomor = p.label.match(/semester\s+(\d+)\b/i)?.[1];
  const jadwalTerkunci = contoh || !!p.ditutup_at || !!p.difinalisasi_at;
  const judul = jadwal ? (jadwalTerkunci ? "Jadwal periode" : "Ubah jadwal periode") : `${p.fase === "FINAL" ? "Hasil evaluasi ekonomi" : "Evaluasi ekonomi"}${nomor ? ` Semester ${nomor}` : ""}`;
  return <header>
    <nav aria-label="Navigasi evaluasi" className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1">
      <Link href={`/admin/monev${contoh ? "?demo=1" : ""}`} className="inline-flex min-h-9 items-center gap-2 text-[12px] text-[#64748B] hover:text-[#000352]"><ArrowLeft size={14} aria-hidden />Kembali ke periode evaluasi</Link>
      {!jadwal && <Link href={`/admin?tab=monev&demo=${contoh ? 1 : 0}&periode=${encodeURIComponent(p.id)}`} className="inline-flex min-h-9 items-center text-[12px] text-[#64748B] hover:text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]">Dashboard Monev</Link>}
    </nav>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold leading-8 text-[#000352] lg:text-[32px] lg:leading-10">{judul}</h1>
        <p className="mt-2 text-[13px] leading-6 text-[#64748B]">{judulPeriode(p)}{!jadwal && (p.fase === "FINAL" ? " · Hasil final, baca-saja" : p.ditutup_at ? " · Pengisian ditutup" : ` · Batas pengisian ${tanggalWib(p.deadline)} WIB`)}</p>
        {contoh && <p className="mt-1 text-[12px] text-[#64748B]">Data contoh</p>}
      </div>
    </div>
  </header>;
}
