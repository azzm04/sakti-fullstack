"use client";


import type { Langkah, PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";
const tabs = [
  { id: "pemeriksaan", label: "Laporan ekonomi" },
  { id: "pengisian", label: "Ringkasan" },
  { id: "jadwal", label: "Jadwal" },
  { id: "finalisasi", label: "Hasil evaluasi" },
] as const;

/** Navigasi bagian, bukan wizard: admin dapat berpindah tanpa kehilangan periode. */
export default function Stepper({ active, onChange }: { periode: PeriodeRuangKerja; active: Langkah; onChange: (step: Langkah) => void }) {
  const current = active === "penutupan" ? "finalisasi" : active;
  return <div className="overflow-x-auto border-b border-[#E2E8F0]">
    <div role="tablist" aria-label="Bagian evaluasi ekonomi" className="flex w-max min-w-full gap-5 sm:gap-7">
      {tabs.map((t, i) => <button key={t.id} type="button" id={`langkah-${t.id}`} role="tab" aria-selected={current === t.id} aria-controls="isi-langkah" tabIndex={current === t.id ? 0 : -1}
        onClick={() => onChange(t.id)} onKeyDown={(e) => {
          const next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i + tabs.length - 1) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
          if (next < 0) return;
          e.preventDefault(); onChange(tabs[next].id);
          document.getElementById(`langkah-${tabs[next].id}`)?.focus();
        }}
        className={`flex min-h-12 items-center gap-2 border-b-2 py-3 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#000352] ${current === t.id ? "border-[#000352] text-[#000352]" : "border-transparent text-[#64748B] hover:text-[#0F172A]"}`}>
        <span>{t.label}</span>
      </button>)}
    </div>
  </div>;
}
