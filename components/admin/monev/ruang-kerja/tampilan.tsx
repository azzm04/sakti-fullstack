import type { FasePeriode } from "@/lib/monev/evaluasi";
import { LABEL_FASE } from "@/lib/monev/ruang-kerja";

export const panel = "min-w-0 rounded-lg border border-[#E2E8F0] bg-white";
export const tombol = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const utama = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#000352] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#171B68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const kolom = "min-h-11 w-full min-w-0 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] outline-none focus:border-[#6B70B8] focus:ring-2 focus:ring-[#000352]/10 disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]";
export const halaman = "min-h-screen w-full bg-[#F8FAFC] px-4 py-6 font-body text-[#334155] sm:px-[30px] sm:py-8";

export function BadgeFase({ fase }: { fase: FasePeriode }) {
  const kelas = fase === "BERLANGSUNG" ? "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]"
    : fase === "FINAL" ? "bg-[#15803D] text-white border-[#15803D]"
    : fase === "TENGGAT_LEWAT" || fase === "DITUTUP" ? "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]"
    : "bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]";
  return <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium ${kelas}`}><span className="size-1.5 rounded-full bg-current" aria-hidden />{LABEL_FASE[fase]}</span>;
}
