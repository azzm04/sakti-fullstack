"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Info, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Nada } from "@/lib/dashboard-monev/data";

/**
 * Gaya dashboard Monev mengikuti halaman /mahasiswa: panel putih rounded-lg dengan
 * border tipis tanpa bayangan, label 13 px abu, nilai gelap, judul navy.
 * Teks dibuat seminimal mungkin; penjelasan dipindah ke tombol info.
 */
export const warna = {
  navy: "#000352", navyMuda: "#C9CBEA", navySedang: "#6B70B8",
  bad: "#B42318", warn: "#B54708", ok: "#067647",
  tinta: "#0F172A", teks: "#64748B", grid: "#E2E8F0", lintasan: "#EEF0F6",
} as const;

export const nadaWarna: Record<Nada, string> = { bad: warna.bad, alert: warna.warn, warn: warna.warn, info: "#94A3B8" };

export const angka = (n: number) => n.toLocaleString("id-ID");
export const persen = (a: number, b: number) => (b ? `${(a / b * 100).toLocaleString("id-ID", { maximumFractionDigits: 0 })}%` : "-");
export const tanggal = (iso: string, jam = false) => new Date(iso).toLocaleString("id-ID", {
  day: "numeric", month: "short", ...(jam ? { hour: "2-digit", minute: "2-digit" } : {}), timeZone: "Asia/Jakarta",
});

export const kartu = "min-w-0 rounded-lg border border-[#E2E8F0] bg-white";
export const kotakTooltip = "rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[12px] leading-5 shadow-sm";
const fokus = "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2";
export const tautanTeks = `text-[13px] font-medium text-[#000352] hover:underline ${fokus}`;

/** Judul bagian dengan aksi kecil di kanan. */
export function JudulBagian({ title, info, aksi }: { title: string; info?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-1.5 text-[16px] font-semibold leading-6 text-[#0F172A]">
        {title}{info && <InfoTombol label={`Tentang ${title.toLowerCase()}`}>{info}</InfoTombol>}
      </h2>
      {aksi}
    </div>
  );
}

export function Panel({ title, info, aksi, children, className = "" }: {
  title: string; info?: ReactNode; aksi?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`${kartu} px-5 py-5 md:px-6 ${className}`}>
      <JudulBagian title={title} info={info} aksi={aksi} />
      {children}
    </section>
  );
}

/** Tombol (i) kecil yang membuka penjelasan singkat. */
export function InfoTombol({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger aria-label={label}
        className="inline-flex size-6 items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]">
        <Info size={15} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 rounded-lg border-[#E2E8F0] bg-white p-3 text-[13px] font-normal leading-5 text-[#475569] shadow-md">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function TautanAksi({ href, children = "Buka halaman Monev" }: { href: string; children?: ReactNode }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-1 whitespace-nowrap ${tautanTeks}`}>
      {children} <ArrowUpRight size={14} aria-hidden />
    </Link>
  );
}

/** Ubin ikon kecil, seperti ikon pada daftar di referensi. */
export function UbinIkon({ ikon: Ikon, warnaIkon = "#334155" }: { ikon: LucideIcon; warnaIkon?: string }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]" aria-hidden>
      <Ikon size={18} style={{ color: warnaIkon }} strokeWidth={1.75} />
    </span>
  );
}

/** Satu baris daftar: ubin ikon, judul, keterangan pendek, angka di kanan. Bisa diklik. */
export function BarisAngka({ ikon, warnaIkon, judul, sub, nilai, onClick }: {
  ikon: LucideIcon; warnaIkon?: string; judul: string; sub?: string; nilai: ReactNode; onClick?: () => void;
}) {
  const isi = (
    <>
      <UbinIkon ikon={ikon} warnaIkon={warnaIkon} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium leading-5 text-[#0F172A]">{judul}</span>
        {sub && <span className="block truncate text-[12px] leading-5 text-[#64748B]">{sub}</span>}
      </span>
      <span className="shrink-0 text-[16px] font-semibold tabular-nums text-[#0F172A]">{nilai}</span>
    </>
  );
  const kelas = "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left";
  if (!onClick) return <div className={kelas}>{isi}</div>;
  return (
    <button type="button" onClick={onClick}
      className={`${kelas} transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]`}>
      {isi}
    </button>
  );
}

/** Dropdown kecil di pojok panel. */
export function PilihKecil<T extends string>({ value, onChange, options, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string;
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value as T)}
      className="rounded-lg border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] text-[#334155] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Kosong({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-lg border border-dashed border-[#E2E8F0] px-4 py-6 text-center text-[13px] leading-5 text-[#64748B]">{children}</p>;
}

export function TitikNada({ nada }: { nada: Nada }) {
  return <span className="size-1.5 shrink-0 rounded-full" style={{ background: nadaWarna[nada] }} aria-hidden />;
}
