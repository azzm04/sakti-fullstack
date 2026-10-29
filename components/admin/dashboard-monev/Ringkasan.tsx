"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, ClipboardList, ShieldAlert, UserRoundX, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { Fase, MonevDashboard } from "@/lib/dashboard-monev/data";
import { pengisianBerakhir } from "@/lib/monev/evaluasi";
import { Angka } from "./anim";
import type { IsiDaftar } from "./DaftarDialog";
import { InfoTombol, angka, kartu, tanggal, warna } from "./ui";

const faseLabel: Record<Fase, string> = {
  BELUM_DIBUKA: "belum dibuka", BERLANGSUNG: "berlangsung", TENGGAT_LEWAT: "batas lewat", DITUTUP: "ditutup",
  FINAL: "final", NONAKTIF: "disembunyikan",
};

export const kontakLabel = {
  TELEGRAM: "Terhubung Telegram",
  BELUM_TELEGRAM: "Belum hubungkan Telegram",
  BELUM_AKUN: "Belum punya akun",
} as const;

/* ── Sapaan + pemilih periode ───────────────────────────────── */
export function Sapaan({ data, namaAdmin, pending, gantiPeriode }: {
  data: MonevDashboard; namaAdmin: string; pending: boolean; gantiPeriode: (id: string) => void;
}) {
  const s = data.selected!;
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[22px] font-semibold leading-8 tracking-tight text-[#0F172A]">Selamat datang, {namaAdmin}</h2>
        <p className="text-[13px] leading-5 text-[#64748B]">Monitoring dan evaluasi ekonomi penerima KIP Kuliah</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {data.contoh && (
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FEDF89] bg-[#FFFAEB] px-3 py-1 text-[12px] font-medium text-[#93370D]" role="status">
            Data contoh
            <a href="/admin?tab=monev&demo=0" className="underline underline-offset-2 hover:no-underline">Lihat data asli</a>
          </span>
        )}
        <label htmlFor="periode-monev" className="sr-only">Periode Monev</label>
        <select id="periode-monev" value={s.id} onChange={(e) => gantiPeriode(e.target.value)} disabled={pending}
          className="max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0F172A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] disabled:opacity-60">
          {[...data.periods].reverse().map((p) => <option key={p.id} value={p.id}>{p.label} ({faseLabel[p.fase]})</option>)}
        </select>
      </div>
    </div>
  );
}

/* ── Tiga kartu angka ───────────────────────────────────────── */
export function KartuAngka({ data, buka }: { data: MonevDashboard; buka: (isi: IsiDaftar) => void }) {
  const s = data.selected!;
  const lewat = pengisianBerakhir(s.fase);
  const belum = data.belum.daftar;
  const tidak = data.pemeriksaan.kelompok.find((k) => k.id === "tidak-memenuhi");

  const item: { label: string; ikon: LucideIcon; warnaIkon: string; nilai: number; onClick: () => void }[] = [
    {
      label: lewat ? "Tidak mengisi sampai batas" : "Belum mengisi", ikon: UserRoundX, warnaIkon: warna.navy, nilai: belum.length,
      onClick: () => buka({
        judul: lewat ? "Tidak mengisi sampai batas" : "Belum mengisi", keterangan: s.label,
        baris: belum.map((b) => ({ ...b, detail: kontakLabel[b.kontak], salinan: [b.email ?? ""] })), kolomSalinan: ["Email"],
      }),
    },
    {
      label: "Tidak memenuhi syarat", ikon: ShieldAlert, warnaIkon: warna.bad, nilai: tidak?.kasus.length ?? 0,
      onClick: () => tidak && buka({ judul: tidak.label, keterangan: "Penghasilan gabungan · anggota keluarga · per orang", baris: tidak.kasus }),
    },
    {
      label: "Perlu ditinjau", ikon: ClipboardList, warnaIkon: warna.warn, nilai: data.perhatian.length,
      onClick: () => buka({ judul: "Perlu ditinjau", keterangan: s.label, baris: data.perhatian.map((p) => ({ ...p, detail: p.tanda.map((t) => t.label).join(" · ") })) }),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {item.map((i) => {
        const Ikon = i.ikon;
        return (
          <button key={i.label} type="button" onClick={i.onClick} disabled={i.nilai === 0}
            className={`${kartu} group flex flex-col items-start px-5 py-5 text-left transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#CBD5E1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] disabled:cursor-default disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}>
            <span className="flex w-full items-start justify-between">
              <Ikon size={24} strokeWidth={1.75} style={{ color: i.warnaIkon }} aria-hidden />
              <ArrowUpRight size={16} className="text-[#CBD5E1] transition-colors group-hover:text-[#000352]" aria-hidden />
            </span>
            <Angka value={i.nilai} className="mt-5 text-[32px] font-semibold leading-10 tracking-tight text-[#0F172A]" />
            <span className="mt-1 text-[13px] leading-5 text-[#64748B]">{i.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Kartu status periode (navy) ────────────────────────────── */
export function KartuStatus({ data, hasilUrl }: { data: MonevDashboard; hasilUrl: string }) {
  const kurangiGerak = useReducedMotion();
  const s = data.selected!;
  const { wajibIsi, terkirim, belumDipindai, tidakDihitung } = data.progres;
  const rasio = wajibIsi ? terkirim / wajibIsi * 100 : 0;
  const status = s.fase === "BERLANGSUNG" ? `${s.sisaHari} hari lagi`
    : s.fase === "TENGGAT_LEWAT" ? "Batas pengisian lewat"
    : s.fase === "DITUTUP" ? "Periode ditutup"
    : s.fase === "FINAL" ? "Evaluasi final"
    : faseLabel[s.fase];

  return (
    <section className="rounded-lg bg-[#000352] px-6 py-6 text-white" aria-labelledby="status-monev">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="status-monev" className="text-[18px] font-semibold leading-7">{s.label}</h2>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] leading-5 text-white/70">
            <CalendarClock size={14} aria-hidden />{status}
          </p>
        </div>
        <span className="text-white/70 [&_button]:text-white/70 [&_button:hover]:bg-white/10 [&_button:hover]:text-white">
          <InfoTombol label="Dasar perhitungan wajib isi">
            Wajib isi tidak menghitung {angka(tidakDihitung.lewatSemester)} mahasiswa yang lewat 8 semester dan {angka(tidakDihitung.mengundurkanDiri)} yang mengundurkan diri. Status cuti belum tercatat di sistem.
          </InfoTombol>
        </span>
      </div>

      <p className="mt-6 flex items-baseline gap-2">
        <Angka value={rasio} format={(n) => `${Math.round(n)}%`} className="text-[36px] font-semibold leading-10 tracking-tight" />
        <span className="text-[13px] text-white/70">laporan masuk</span>
      </p>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={wajibIsi} aria-valuenow={terkirim} aria-label="Laporan masuk">
        {kurangiGerak
          ? <div className="h-full rounded-full bg-white" style={{ width: `${rasio}%` }} />
          : <motion.div className="h-full rounded-full bg-white" initial={{ width: 0 }} animate={{ width: `${rasio}%` }} transition={{ duration: 0.9, delay: 0.2, ease: [0.22, 1, 0.36, 1] }} />}
      </div>
      <p className="mt-2 text-[13px] tabular-nums text-white/70">{angka(terkirim)} dari {angka(wajibIsi)} mahasiswa · batas {tanggal(s.deadline)}</p>

      <Link href={hasilUrl}
        className="mt-6 flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-white text-[14px] font-medium text-[#000352] transition-colors hover:bg-[#EEF3FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#000352]">
        {belumDipindai > 0 ? `Pindai ${angka(belumDipindai)} laporan baru` : "Lihat semua laporan"}
      </Link>
    </section>
  );
}

