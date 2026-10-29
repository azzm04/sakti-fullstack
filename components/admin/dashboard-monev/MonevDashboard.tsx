"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, ClipboardList, Users, UserRoundX, FileCheck2 } from "lucide-react";
import type { MonevDashboard as Data } from "@/lib/dashboard-monev/data";
import { judulPeriode, urlPeriode } from "@/lib/monev/ruang-kerja";
import { BadgeFase, panel, utama, tombol } from "@/components/admin/monev/ruang-kerja/tampilan";
import DaftarDialog, { type IsiDaftar } from "./DaftarDialog";
import { PengisianProdi } from "./Grafik";
import { Sapaan } from "./Ringkasan";
import { HasilPemeriksaan, HubungiMahasiswa, PerluDitinjau, PerubahanKondisi } from "./sections";
import { angka, tanggal } from "./ui";

export default function MonevDashboard({ data, namaAdmin = "Admin Dirmawa", embedded = false }: { data: Data; namaAdmin?: string; embedded?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [daftar, setDaftar] = useState<IsiDaftar | null>(null);
  const s = data.selected;
  if (!s) return <div className={`${panel} p-8 text-center`}><h2 className="font-semibold text-[#0F172A]">Belum ada periode evaluasi</h2><p className="mb-5 mt-2 text-[13px] text-[#64748B]">Tentukan periode dan jadwal pengisian untuk memulai Monev.</p><Link href="/admin/monev?buat=1" className={utama}>Buat periode <ArrowRight size={15} /></Link></div>;
  const url = (step: "pengisian" | "pemeriksaan" | "jadwal" | "penutupan" | "finalisasi", filter?: string) => urlPeriode(s.id, step, data.contoh, filter);
  const r = data.progres;
  const rasio = r.wajibIsi ? Math.round(r.terkirim / r.wajibIsi * 100) : 0;

  const action = s.fase === "TENGGAT_LEWAT" ? { title: "Waktu pengisian sudah berakhir", detail: "Laporan yang masuk dapat diperiksa. Pantau mahasiswa yang belum mengisi melalui dashboard ini.", href: url("pemeriksaan"), label: "Periksa laporan" }
    : s.fase === "DITUTUP" ? { title: r.perluDitinjau ? "Lanjutkan pemeriksaan ekonomi" : "Pemeriksaan selesai", detail: r.perluDitinjau ? `${angka(r.perluDitinjau)} laporan masih perlu ditinjau sebelum hasil evaluasi ditetapkan.` : "Lihat laporan ekonomi dan hasil pemeriksaan sementara.", href: r.perluDitinjau ? url("pemeriksaan", "perlu-ditinjau") : url("pemeriksaan"), label: r.perluDitinjau ? "Periksa laporan" : "Lihat laporan" }
    : s.fase === "FINAL" ? { title: "Evaluasi telah difinalkan", detail: "Jadwal dan hasil evaluasi periode ini terkunci.", href: url("finalisasi"), label: "Lihat hasil evaluasi" }
    : s.fase === "NONAKTIF" || s.fase === "BELUM_DIBUKA" ? { title: "Siapkan pengisian mahasiswa", detail: "Periksa jadwal sebelum mahasiswa mulai mengirim laporan ekonomi.", href: url("jadwal"), label: "Lihat jadwal" }
    : { title: "Pengisian mahasiswa sedang berjalan", detail: `${angka(r.wajibIsi - r.terkirim)} mahasiswa belum mengisi. Laporan yang masuk sudah dapat diperiksa.`, href: url("pemeriksaan"), label: embedded ? "Periksa laporan" : "Buka evaluasi" };
  return <div className="space-y-5" aria-busy={pending}>
    {!embedded && <Sapaan data={data} namaAdmin={namaAdmin} pending={pending} gantiPeriode={(id) => startTransition(() => {
      const query = new URLSearchParams(window.location.search);
      query.set("tab", "monev"); query.set("periode", id); router.replace(`/admin?${query}`, { scroll: false });
    })} />}
    <section className={`${panel} overflow-hidden`}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2"><span className="text-[13px] font-medium text-[#64748B]">{embedded ? "Progres periode" : judulPeriode(s)}</span><BadgeFase fase={s.fase} /></div>
          <h2 className="text-[20px] font-semibold leading-7 tracking-tight text-[#0F172A]">{action.title}</h2>
          <p className="mt-2 max-w-xl text-[13px] leading-6 text-[#64748B]">{action.detail}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3"><Link href={action.href} className={utama}>{action.label}<ArrowRight size={15} /></Link>
            <Link href={embedded ? url("jadwal") : `/admin/monev${data.contoh ? "?demo=1" : ""}`} className={tombol}>{embedded ? "Atur jadwal" : "Periode evaluasi"}</Link>
          </div>
        </div>
        <div className="flex flex-col justify-center border-t border-[#E2E8F0] bg-[#FAFBFD] p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="flex items-baseline justify-between"><span className="text-[12px] text-[#64748B]">Laporan masuk</span><strong className="text-[28px] font-semibold tracking-tight text-[#000352]">{rasio}%</strong></div>
          <progress aria-label="Progres pengisian" value={r.terkirim} max={Math.max(1, r.wajibIsi)} className="mt-3 h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:bg-[#000352] [&::-webkit-progress-bar]:bg-[#E9ECF3] [&::-webkit-progress-value]:bg-[#000352]" />
          <p className="mt-2 text-[12px] text-[#64748B]">{angka(r.terkirim)} dari {angka(r.wajibIsi)} mahasiswa wajib isi</p>
          <p className="mt-5 flex items-center gap-2 text-[12px] text-[#475569]"><CalendarDays size={14} />Batas {tanggal(s.deadline, true)} WIB</p>
        </div>
      </div>
    </section>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: "Wajib mengisi", value: r.wajibIsi, icon: Users, filter: "semua", note: "Mahasiswa dalam periode" },
        { label: "Sudah mengirim", value: r.terkirim, icon: FileCheck2, filter: "sudah-mengisi", note: "Laporan ekonomi masuk" },
        { label: "Belum mengisi", value: r.wajibIsi - r.terkirim, icon: UserRoundX, filter: "belum-mengisi", note: "Perlu dipantau" },
        { label: "Perlu ditinjau", value: r.perluDitinjau, icon: ClipboardList, filter: "perlu-ditinjau", note: `${angka(r.belumDipindai)} belum dipindai` },
      ].map((m) => <Link key={m.label} href={url("pemeriksaan", m.filter)} className={`${panel} group p-4 transition hover:border-[#B8BED8] sm:p-5`}><div className="flex items-center justify-between"><span className="text-[12px] text-[#64748B]">{m.label}</span><m.icon size={17} className="text-[#6B70B8]" /></div><div className="mt-3 flex items-center justify-between"><strong className="text-[28px] font-semibold tracking-tight text-[#0F172A]">{angka(m.value)}</strong><ArrowRight size={15} className="text-[#CBD5E1] group-hover:text-[#000352]" /></div><p className="mt-1 text-[11px] text-[#94A3B8]">{m.note}</p></Link>)}
    </div>
    <div className={`grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px] ${pending ? "opacity-60" : ""}`}>
      <div className="min-w-0 space-y-5"><PengisianProdi data={data.belum.perProdi} belum={data.belum.daftar} buka={setDaftar} /><PerluDitinjau data={data.perhatian} buka={setDaftar} /></div>
      <div className="min-w-0 space-y-5"><HubungiMahasiswa data={data.belum} fase={s.fase} buka={setDaftar} /><HasilPemeriksaan data={data.pemeriksaan} buka={setDaftar} /><PerubahanKondisi data={data.perubahan} buka={setDaftar} /></div>
    </div>
    <DaftarDialog isi={daftar} onClose={() => setDaftar(null)} />
  </div>;
}
