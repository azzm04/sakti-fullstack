import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, CalendarRange, Clock, ShieldCheck } from "lucide-react";

const JADWAL = [
  {
    tag: "REGISTRASI", tagClass: "bg-primary/10 text-primary",
    day: "03", month: "Februari", meta: "s/d 31 Oktober 2026", metaIcon: CalendarRange,
    title: "Pendaftaran Akun Siswa",
    desc: "Tahap awal bagi seluruh calon pendaftar untuk memvalidasi data NIK, NISN, dan NPSN di sistem pusat.",
    link: "#", linkLabel: "Lihat Persyaratan", linkClass: "text-primary",
    cardClass: "border border-slate-200",
    dayClass: "text-primary",
  },
  {
    tag: "SELEKSI", tagClass: "bg-tertiary/10 text-tertiary",
    day: "21", month: "Maret", meta: "Jadwal Gelombang 1", metaIcon: Clock,
    title: "Pendaftaran UTBK-SNBT",
    desc: "Sinkronisasi sistem SAKTI dengan portal seleksi nasional masuk perguruan tinggi negeri secara otomatis.",
    link: "#", linkLabel: "Panduan Sinkronisasi", linkClass: "text-tertiary",
    cardClass: "border-t-4 border-[#743B00] shadow-sm",
    dayClass: "text-tertiary",
  },
  {
    tag: "MONITORING", tagClass: "bg-secondary/10 text-secondary",
    day: "01", month: "Juli", meta: "Deadline Pelaporan", metaIcon: ShieldCheck,
    title: "Monev & Evaluasi Penerima",
    desc: "Batas akhir pemutakhiran data IPK dan status akademik bagi penerima bantuan aktif (On-Going).",
    link: "#", linkLabel: "E-Reporting", linkClass: "text-secondary",
    cardClass: "border border-slate-200",
    dayClass: "text-secondary",
  },
];

export default function JadwalSection() {
  return (
    <section className="py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-4 block">Agenda Mendatang</span>
            <h2 className="text-4xl font-bold text-primary tracking-tight">Jadwal Penting KIP-Kuliah 2026</h2>
          </div>
          <div className="flex gap-2">
            <button className="w-12 h-12 rounded-full flex items-center justify-center border border-slate-300 bg-white text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all" title="Prev">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="w-12 h-12 rounded-full flex items-center justify-center border border-slate-300 bg-white text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all" title="Next">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {JADWAL.map((j) => (
            <div key={j.title} className={`group bg-white p-8 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden ${j.cardClass}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8" />
              <div className="mb-8">
                <span className={`px-4 py-1.5 rounded-md text-xs font-bold ${j.tagClass}`}>{j.tag}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-5xl font-black ${j.dayClass}`}>{j.day}</span>
                <span className="text-lg font-bold text-secondary">{j.month}</span>
              </div>
              <div className="text-sm font-medium text-secondary mb-6 flex items-center gap-2">
                <j.metaIcon className="w-4 h-4" /> {j.meta}
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{j.title}</h3>
              <p className="text-secondary text-sm leading-relaxed mb-6">{j.desc}</p>
              <Link href={j.link} className={`inline-flex items-center gap-2 font-bold text-sm hover:gap-3 transition-all ${j.linkClass}`}>
                {j.linkLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
