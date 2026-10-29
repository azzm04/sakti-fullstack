import Link from "next/link";
import { ArrowRight, BarChart3, CalendarDays, Plus } from "lucide-react";
import { halaman, panel } from "./ruang-kerja/tampilan";

export default function AwalMonev({ contoh }: { contoh: boolean }) {
  const pilihan = [
    { judul: "Dashboard Monev", isi: "Pantau pengisian mahasiswa dan ringkasan evaluasi ekonomi.", href: `/admin?tab=monev&demo=${contoh ? 1 : 0}`, Icon: BarChart3 },
    { judul: "Kelola periode", isi: "Pilih periode untuk memeriksa laporan, mengatur jadwal, atau melihat hasil.", href: `/admin/monev?tampilan=periode${contoh ? "&demo=1" : ""}`, Icon: CalendarDays },
    { judul: "Buat periode", isi: "Tentukan semester dan jadwal pengisian untuk evaluasi baru.", href: "/admin/monev?buat=1", Icon: Plus },
  ];
  return <div className={halaman}>
    <header className="mb-6">
      <h1 className="text-[24px] font-semibold leading-8 text-[#000352] lg:text-[32px] lg:leading-10">Monitoring dan evaluasi</h1>
      <p className="mt-2 text-[13px] leading-6 text-[#64748B]">Evaluasi ekonomi mahasiswa KIP Kuliah. Pilih kegiatan yang ingin Anda lakukan.</p>
    </header>
    {contoh && <p className="mb-5 text-[12px] text-[#64748B]">Pratinjau data contoh. <Link href="/admin/monev" className="text-[#000352] underline">Buka data asli</Link></p>}
    <nav aria-label="Pilihan Monev" className={`${panel} max-w-3xl divide-y divide-[#E2E8F0] overflow-hidden`}>
      {pilihan.map(({ judul, isi, href, Icon }) => <Link key={judul} href={href} className="group flex items-center gap-4 p-5 transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#000352] sm:p-6">
        <Icon size={20} strokeWidth={1.7} className="shrink-0 text-[#000352]" aria-hidden />
        <div className="min-w-0 flex-1"><h2 className="text-[15px] font-semibold text-[#0F172A]">{judul}</h2><p className="mt-1 text-[13px] leading-6 text-[#64748B]">{isi}</p>{contoh && judul === "Buat periode" && <p className="mt-1 text-[12px] text-[#64748B]">Membuka form untuk data asli.</p>}</div>
        <ArrowRight size={16} className="shrink-0 text-[#64748B] group-hover:text-[#000352]" aria-hidden />
      </Link>)}
    </nav>
  </div>;
}
