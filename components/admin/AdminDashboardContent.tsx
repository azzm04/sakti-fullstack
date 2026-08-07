"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Upload, Calculator, Users, CheckCircle2, AlertCircle,
  ArrowRight, FileSpreadsheet, BarChart3, ClipboardCheck,
  Activity, CalendarDays, Zap, Trophy,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Stats {
  total: number;
  valid: number;
  incomplete: number;
  saved: boolean;
}
interface Props { stats: Stats | null; }

// ── Alur 1: Seleksi Pendaftar KIPK ───────────────────────────────────────────
const SELEKSI: WorkflowItem[] = [
  {
    step: 1, label: "Import Data",
    desc: "Upload Excel pendaftar KIPK dari portal kampus",
    href: "/admin/import", icon: Upload,
    cls: "bg-blue-50 text-blue-600", border: "hover:border-blue-300",
  },
  {
    step: 2, label: "Wawancara (WAR)",
    desc: "Kelola pewawancara & buka sesi pemilihan urutan",
    href: "/admin/wawancara", icon: Zap,
    cls: "bg-amber-50 text-amber-600", border: "hover:border-amber-300",
  },
  {
    step: 3, label: "Evaluasi Pewawancara",
    desc: "Review & override hasil wawancara lapangan",
    href: "/admin/evaluasi", icon: ClipboardCheck,
    cls: "bg-violet-50 text-violet-600", border: "hover:border-violet-300",
  },
  {
    step: 4, label: "Seleksi & Hasil Akhir",
    desc: "Perankingan kandidat & penetapan penerima KIPK per jalur masuk",
    href: "/admin/hasil-akhir", icon: Calculator,
    cls: "bg-primary/8 text-primary", border: "hover:border-primary/40",
  },
  {
    step: 5, label: "Insight Decision Tree",
    desc: "Analisis pola keputusan pewawancara dari hasil seleksi",
    href: "/admin/analitik", icon: BarChart3,
    cls: "bg-emerald-50 text-emerald-600", border: "hover:border-emerald-300",
  },
];

// ── Alur 2: Monitoring Evaluasi Per Semester ──────────────────────────────────
const MONEV: WorkflowItem[] = [
  {
    step: 1, label: "Set Jadwal Monev",
    desc: "Tentukan periode & batas waktu pengisian per semester",
    href: "/admin/monev", icon: CalendarDays,
    cls: "bg-sky-50 text-sky-600", border: "hover:border-sky-300",
  },
  {
    step: 2, label: "Pengisian Formulir",
    desc: "Mahasiswa KIPK mengisi formulir Monitoring Evaluasi",
    href: "/admin/monev", icon: FileSpreadsheet,
    cls: "bg-teal-50 text-teal-600", border: "hover:border-teal-300",
    note: "Oleh Mahasiswa",
  },
  {
    step: 3, label: "Deteksi AI / OCR",
    desc: "Kecerdasan buatan menganalisis & memvalidasi isian formulir",
    href: "/admin/monev", icon: Activity,
    cls: "bg-orange-50 text-orange-500", border: "hover:border-orange-300",
  },
  {
    step: 4, label: "Evaluasi Hasil Monev",
    desc: "Audit & evaluasi hasil pengisian oleh Pewawancara & Admin",
    href: "/admin/monev", icon: Trophy,
    cls: "bg-rose-50 text-rose-500", border: "hover:border-rose-300",
    note: "Audit oleh Dirmawa",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
interface WorkflowItem {
  step: number;
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
  cls: string;
  border: string;
  note?: string;
}

const ease = [0.25, 0, 0, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease },
});

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground px-2 whitespace-nowrap">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function WorkflowCard({ item, delay }: { item: WorkflowItem; delay: number }) {
  const { step, label, desc, href, icon: Icon, cls, border, note } = item;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Link
        href={href}
        className={`group flex flex-col gap-3 bg-white border border-border rounded-2xl p-4 shadow-sm h-full transition-all duration-200 ${border} hover:shadow-md`}
      >
        <div className="flex items-start justify-between">
          <div className={`w-9 h-9 rounded-xl ${cls} flex items-center justify-center`}>
            <Icon size={16} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {step}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-foreground text-xs leading-snug">{label}</p>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{desc}</p>
          {note && (
            <span className="inline-block mt-2 text-[10px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-full">
              {note}
            </span>
          )}
        </div>
        <ArrowRight size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboardContent({ stats }: Props) {
  const hasData = (stats?.total ?? 0) > 0;

  const seleksiStages = [
    { label: "Data Diimpor",   done: hasData, color: "bg-blue-500"    },
    { label: "Wawancara",      done: false,   color: "bg-amber-500"   },
    { label: "Evaluasi",       done: false,   color: "bg-violet-500"  },
    { label: "Hasil Akhir",    done: false,   color: "bg-primary"     },
    { label: "Insight DT",     done: false,   color: "bg-emerald-500" },
  ];
  const doneCount       = seleksiStages.filter((s) => s.done).length;
  const pipelinePct     = Math.round((doneCount / seleksiStages.length) * 100);

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8 lg:p-10">
      <div className="max-w-screen-xl mx-auto space-y-10">

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Direktorat Kemahasiswaan · SAKTI
          </p>
          <h1 className="text-2xl md:text-3xl font-extrabold font-headline text-primary mt-0.5 leading-tight">
            Dashboard Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau dan kendalikan seluruh proses seleksi & monitoring evaluasi KIP-Kuliah.
          </p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div {...fadeUp(0.07)} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: "Total Pendaftar", value: stats?.total ?? "—",     icon: Users,         color: "text-primary",     bg: "bg-primary/8",   sub: "data masuk"       },
            { label: "Data Valid",      value: stats?.valid ?? "—",      icon: CheckCircle2,  color: "text-emerald-600", bg: "bg-emerald-50",  sub: "siap diproses"    },
            { label: "Perlu Perbaikan", value: stats?.incomplete ?? "—", icon: AlertCircle,   color: "text-amber-600",   bg: "bg-amber-50",    sub: "tidak lengkap"    },
            {
              label: "Status Database",
              value: hasData ? "Aktif" : "Kosong",
              icon: FileSpreadsheet,
              color: hasData ? "text-emerald-600" : "text-slate-400",
              bg:    hasData ? "bg-emerald-50"    : "bg-slate-100",
              sub:   hasData ? "data tersimpan"   : "belum ada data",
            },
          ].map(({ label, value, icon: Icon, color, bg, sub }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.07 + i * 0.05, ease }}
              className="bg-white rounded-2xl border border-border p-4 md:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <p className={`text-2xl font-extrabold font-headline ${color} leading-none`}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Alur 1: Seleksi ─────────────────────────────────── */}
        <motion.div {...fadeUp(0.14)} className="space-y-5">
          <SectionDivider label="Alur 1 · Seleksi Pendaftar KIPK" />

          {/* Pipeline progress */}
          <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">Progress Pipeline Seleksi</p>
              <span className="text-xs font-bold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                {doneCount}/{seleksiStages.length} tahap
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pipelinePct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {seleksiStages.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    s.done
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.done ? s.color : "bg-slate-300"}`} />
                  {i + 1}. {s.label}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {SELEKSI.map((item, i) => (
              <WorkflowCard key={item.step} item={item} delay={0.18 + i * 0.05} />
            ))}
          </div>
        </motion.div>

        {/* ─── Alur 2: Monev ───────────────────────────────────── */}
        <motion.div {...fadeUp(0.3)} className="space-y-5">
          <SectionDivider label="Alur 2 · Monitoring Evaluasi Per Semester" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MONEV.map((item, i) => (
              <WorkflowCard key={item.step} item={item} delay={0.34 + i * 0.05} />
            ))}
          </div>
        </motion.div>

        {/* Context banner */}
        {stats !== null && (
          <motion.div
            {...fadeUp(0.44)}
            className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border text-sm ${
              hasData
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {hasData
              ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
              : <AlertCircle  size={16} className="shrink-0 mt-0.5" />
            }
            <span className="leading-relaxed">
              {hasData ? (
                <><strong>{stats.total}</strong> pendaftar tersimpan · <strong>{stats.valid}</strong> valid · <strong>{stats.incomplete}</strong> perlu perbaikan. Lanjutkan ke <strong>Wawancara (WAR)</strong>.</>
              ) : (
                "Belum ada data pendaftar. Mulai dengan mengimpor file Excel dari portal Dirmawa."
              )}
            </span>
            {hasData && (
              <Link href="/admin/wawancara" className="ml-auto text-xs font-bold text-emerald-700 underline underline-offset-2 shrink-0 whitespace-nowrap">
                Ke Wawancara →
              </Link>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
