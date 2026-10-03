"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Upload, ClipboardCheck, BarChart3, ArrowRight } from "lucide-react";
import type { DashboardStats } from "@/schemas";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { KpiCard } from "@/components/admin/ui/KpiCard";
import { Pill, type PillTone } from "@/components/admin/ui/Pill";
import { Timeline } from "@/components/admin/ui/Timeline";

export type StatusAduan = "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";

export interface AduanRingkasan {
  items: {
    id: string;
    kode_laporan: string;
    jenis_aduan: "KETIDAKTEPATAN" | "PENYALAHGUNAAN";
    nama_terlapor: string;
    fakultas_prodi: string | null;
    status: StatusAduan;
    created_at: string;
  }[];
  counts: Record<StatusAduan, number>;
}

interface Props {
  stats: DashboardStats | null;
  aduan: AduanRingkasan | null;
}

const ease = [0.25, 0, 0, 1] as [number, number, number, number];
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease },
});

function fmtId(n: number): string {
  return n.toLocaleString("id-ID");
}
function fmtPct(n: number, digits = 1): string {
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
function formatActivityTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Kemarin";
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

/** Warna pill & titik status berdasarkan isi rekomendasi/hasil akhir — bukan warna tetap. */
function rekomendasiTone(rekomendasi: string | null): PillTone {
  if (!rekomendasi) return "neutral";
  const lower = rekomendasi.toLowerCase();
  if (lower.includes("tidak") && !lower.includes("pertimbang")) return "danger";
  if (lower.includes("pertimbang")) return "warn";
  return "accent";
}
function statusDotColor(hasilAkhir: string | null): string {
  if (hasilAkhir === "Diusulkan") return "bg-admin-accent";
  if (hasilAkhir === "Tidak Diusulkan") return "bg-admin-danger-bar";
  return "bg-admin-text-5";
}

const ADUAN_STATUS: Record<StatusAduan, { label: string; tone: PillTone }> = {
  MENUNGGU: { label: "Menunggu", tone: "warn" },
  DIPROSES: { label: "Diproses", tone: "accent" },
  SELESAI: { label: "Selesai", tone: "solid" },
  DITOLAK: { label: "Ditolak", tone: "danger" },
};
const JENIS_ADUAN_LABEL: Record<string, string> = {
  KETIDAKTEPATAN: "Ketidaktepatan Sasaran",
  PENYALAHGUNAAN: "Penyalahgunaan Dana",
};

const quickActionBtn =
  "flex items-center gap-[11px] w-full px-[13px] py-[11px] border border-admin-border bg-transparent rounded-xl text-[13px] font-medium text-admin-text cursor-pointer text-left hover:bg-admin-surface-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

/**
 * Baris KPI monev (Periode Berjalan / Sudah Mengisi / Penerima Terpantau /
 * Temuan Terbuka) — nilai di bawah ini ILUSTRATIF, bukan hasil query.
 * Domain monev (monev_submissions, penerima_kipk, periode akademik) belum
 * punya data maupun tabel periode di database ini. Ditinggalkan sebagai
 * scaffold UI sesuai permintaan; sambungkan ke data asli begitu backend
 * monev (di luar cakupan sesi ini) selesai dikerjakan.
 */
const monevKpiPlaceholder = [
  {
    code: "PR-01",
    label: "Periode Berjalan",
    value: "2026/1",
    delta: "42 hari lagi",
    deltaTone: "accent" as PillTone,
    note: "semester ganjil · ditutup 30 Sep 2026",
    pct: "78%",
  },
  {
    code: "MV-02",
    label: "Sudah Mengisi",
    value: "68,4%",
    delta: "+6,2",
    deltaTone: "accent" as PillTone,
    note: "363 dari 530 penerima sudah mengisi",
    pct: "68.4%",
  },
  {
    code: "MV-03",
    label: "Penerima Terpantau",
    value: "530",
    delta: "aktif",
    deltaTone: "accent" as PillTone,
    note: "mahasiswa dalam masa pemantauan",
    pct: "90%",
  },
  {
    code: "MV-04",
    label: "Temuan Terbuka",
    value: "17",
    delta: "harus ditindak lanjut",
    deltaTone: "danger" as PillTone,
    note: "IPK < 3,00 atau berkas monev harus diverifikasi manual",
    pct: "17%",
    danger: true,
  },
];

export default function AdminDashboardContent({ stats, aduan }: Props) {
  const hasData = (stats?.total ?? 0) > 0;
  const pctWawancara =
    stats && stats.wawancaraTotal > 0
      ? (stats.wawancaraSelesai / stats.wawancaraTotal) * 100
      : 0;

  const steps = [
    {
      no: "01",
      label: "Import Data",
      href: "/admin/import",
      icon: Upload,
      desc: "Unggah berkas Excel pendaftar KIP-K",
      state: hasData ? "Selesai" : "Menunggu",
      meta: stats ? `${fmtId(stats.total)} baris` : "—",
    },
    {
      no: "02",
      label: "Evaluasi Wawancara",
      href: "/admin/evaluasi",
      icon: ClipboardCheck,
      desc: "Tinjau & finalisasi rekomendasi pewawancara",
      state:
        !stats || stats.wawancaraSelesai === 0
          ? "Menunggu"
          : stats.wawancaraSelesai >= stats.wawancaraTotal
            ? "Selesai"
            : "Berjalan",
      meta: stats
        ? `${fmtId(stats.wawancaraSelesai)} / ${fmtId(stats.wawancaraTotal)}`
        : "—",
    },
    {
      no: "03",
      label: "Analisis Decision Tree",
      href: "/admin/analitik",
      icon: BarChart3,
      desc: "Pola keputusan & aturan terekstraksi",
      state: stats?.dtAccuracy ? "Selesai" : "Menunggu",
      meta: stats?.dtAccuracy
        ? `${stats.dtAccuracy.jumlahFitur} variabel`
        : "Belum dianalisis",
    },
  ];

  const timelineItems = (stats?.recentActivity ?? []).map((a, i) => ({
    id: i,
    text: a.title,
    when: formatActivityTime(a.time),
    who: a.by,
  }));

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        title="Ringkasan Keseluruhan"
        description="Pantau progres seleksi dan monitoring KIP-K secara keseluruhan"
      />

      <div className="px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
        {/* Stat row — periode & monev (lihat catatan di monevKpiPlaceholder) */}
        <motion.section
          {...fadeUp(0.05)}
          className="grid grid-cols-2 lg:grid-cols-4 gap-[14px]"
        >
          {monevKpiPlaceholder.map((s) => (
            <KpiCard
              key={s.code}
              label={s.label}
              code={s.code}
              value={s.value}
              delta={<Pill tone={s.deltaTone}>{s.delta}</Pill>}
              note={s.note}
              pct={s.pct}
              barColor={s.danger ? "var(--color-admin-danger-bar)" : undefined}
              valueColor={
                s.danger ? "var(--color-admin-danger-text)" : undefined
              }
            />
          ))}
        </motion.section>

        {/* Three workflow steps */}
        <motion.section
          {...fadeUp(0.1)}
          className="grid grid-cols-1 sm:grid-cols-3 gap-[14px]"
        >
          {steps.map((s) => (
            <Link
              key={s.no}
              href={s.href}
              className="block h-full focus:outline-none focus-visible:outline-2 focus-visible:outline-admin-accent focus-visible:outline-offset-2"
            >
              <article className="bg-admin-surface border border-admin-border rounded-2xl px-5 pt-[18px] pb-[15px] flex flex-col gap-3.5 h-full hover:border-admin-accent/45 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-[30px] h-[30px] rounded-[10px] bg-admin-accent/[0.13] text-admin-accent-ink font-admin-heading text-[15px] font-semibold flex items-center justify-center">
                      {s.no}
                    </span>
                    <div>
                      <div className="text-[15.5px] font-bold tracking-[-0.005em]">
                        {s.label}
                      </div>
                      <div className="text-[12.5px] text-admin-text-3 mt-0.5">
                        {s.desc}
                      </div>
                    </div>
                  </div>
                  <Pill
                    tone={
                      s.state === "Selesai"
                        ? "accent"
                        : s.state === "Berjalan"
                          ? "warn"
                          : "neutral"
                    }
                  >
                    {s.state}
                  </Pill>
                </div>
                <div className="flex items-center justify-between border-t border-admin-grid pt-[11px]">
                  <span className="text-[11px] tracking-[0.1em] uppercase text-admin-text-4">
                    {s.meta}
                  </span>
                  <span className="text-[12.5px] font-semibold text-admin-accent flex items-center gap-1.5">
                    Buka{" "}
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </motion.section>

        {/* Split row: recent interviews table + progress/quick actions */}
        <motion.section
          {...fadeUp(0.15)}
          className="grid grid-cols-1 xl:grid-cols-[1.85fr_1fr] gap-[14px]"
        >
          <article className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden">
            <div className="flex items-end justify-between gap-3 px-5 pt-[18px] pb-3.5">
              <div>
                <h2 className="font-admin-heading text-[18px] font-semibold m-0">
                  Hasil Wawancara Terbaru
                </h2>
                <p className="text-[12.5px] text-admin-text-3 mt-[3px] m-0">
                  Rekomendasi pewawancara yang baru difinalisasi
                </p>
              </div>
              <Link
                href="/admin/evaluasi"
                className="text-[12.5px] font-semibold text-admin-accent flex items-center gap-1.5 shrink-0 hover:underline"
              >
                Lihat semua{" "}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
              </Link>
            </div>
            {!stats || stats.recentInterviews.length === 0 ? (
              <p className="text-[13px] text-admin-text-4 py-8 text-center">
                Belum ada data.
              </p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,2fr)_minmax(158px,1.5fr)_minmax(0,1.1fr)] gap-3.5 px-5 pb-[9px] text-[10.5px] tracking-[0.13em] uppercase text-admin-placeholder border-b border-admin-grid">
                    <span>Kandidat</span>
                    <span>Program Studi</span>
                    <span>Rekomendasi</span>
                    <span>Status</span>
                  </div>
                  {stats.recentInterviews.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,2fr)_minmax(158px,1.5fr)_minmax(0,1.1fr)] gap-3.5 items-center px-5 py-3.5 border-b border-admin-border-soft last:border-b-0 hover:bg-admin-surface-soft transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold truncate">
                          {r.nama ?? "—"}
                        </div>
                        <div className="text-[11.5px] text-admin-text-4 tabular-nums mt-0.5 font-admin-mono">
                          {r.noPendaftaran ?? "—"}
                        </div>
                      </div>
                      <div className="text-[12.5px] text-admin-text-2 truncate">
                        {r.prodi ?? "—"}
                      </div>
                      <div>
                        <Pill tone={rekomendasiTone(r.rekomendasi)}>
                          {r.rekomendasi ?? "—"}
                        </Pill>
                      </div>
                      <div className="text-[12.5px] text-admin-text-2 flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDotColor(r.hasilAkhir)}`}
                        />
                        {r.hasilAkhir ?? "Draft"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>

          <div className="flex flex-col gap-[14px]">
            <article className="bg-admin-surface border border-admin-border rounded-2xl p-[18px_20px]">
              <h2 className="font-admin-heading text-[18px] font-semibold mb-3 m-0">
                Progres Wawancara
              </h2>
              {stats && stats.wawancaraTotal > 0 ? (
                <>
                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="font-admin-heading text-[44px] font-semibold leading-[0.9] tracking-[-0.02em] tabular-nums">
                      {fmtId(stats.wawancaraSelesai)}
                    </span>
                    <span className="text-[12.5px] text-admin-text-3">
                      dari {fmtId(stats.wawancaraTotal)} kandidat ·{" "}
                      {fmtPct(pctWawancara)}%
                    </span>
                  </div>
                  <div className="h-[9px] rounded-full bg-admin-grid overflow-hidden my-3.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-admin-accent/70 to-admin-accent"
                      style={{ width: `${Math.min(100, pctWawancara)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { value: stats.pewawancaraAktif, label: "Pewawancara" },
                      { value: stats.sesiAktif, label: "Sesi aktif" },
                      {
                        value: stats.wawancaraTotal - stats.wawancaraSelesai,
                        label: "Belum",
                      },
                    ].map((w) => (
                      <div
                        key={w.label}
                        className="bg-admin-bg rounded-xl p-[11px_12px]"
                      >
                        <div className="font-admin-heading text-[20px] font-semibold leading-none tabular-nums">
                          {fmtId(w.value)}
                        </div>
                        <div className="text-[10px] tracking-[0.12em] uppercase text-admin-text-4 mt-[5px]">
                          {w.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-admin-text-4 py-4">
                  Belum ada data.
                </p>
              )}
            </article>

            <article className="bg-admin-surface border border-admin-border rounded-2xl p-[18px_20px]">
              <h2 className="font-admin-heading text-[18px] font-semibold m-0">
                Aksi Cepat
              </h2>
              <p className="text-[12.5px] text-admin-text-3 mt-1 mb-[13px] m-0">
                Tugas yang paling sering dijalankan admin
              </p>
              <div className="flex flex-col gap-2">
                <button
                  disabled
                  title="Template unduhan belum tersedia"
                  className={quickActionBtn}
                >
                  Unduh template .xlsx
                </button>
                <Link href="/admin/wawancara/urutan" className={quickActionBtn}>
                  Aktifkan sesi wawancara
                </Link>
                <Link href="/admin/monev" className={quickActionBtn}>
                  Jadwalkan monev
                </Link>
                <Link href="/admin/analitik" className={quickActionBtn}>
                  Latih ulang decision tree
                </Link>
              </div>
            </article>
          </div>
        </motion.section>

        {/* Split row: aduan terbaru + activity */}
        <motion.section
          {...fadeUp(0.2)}
          className="grid grid-cols-1 xl:grid-cols-[1.85fr_1fr] gap-[14px] items-start"
        >
          <article className="bg-admin-surface border border-admin-border rounded-2xl overflow-hidden">
            <div className="flex items-end justify-between gap-3 px-5 pt-[18px] pb-3.5">
              <div>
                <h2 className="font-admin-heading text-[18px] font-semibold m-0">
                  Aduan Terbaru
                </h2>
                <p className="text-[12.5px] text-admin-text-3 mt-[3px] m-0">
                  Laporan masuk dari layanan pengaduan KIP-K
                </p>
              </div>
              <Link
                href="/admin/aduan"
                className="text-[12.5px] font-semibold text-admin-accent flex items-center gap-1.5 shrink-0 hover:underline"
              >
                Lihat semua{" "}
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.8} />
              </Link>
            </div>

            {aduan && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-5 pb-4">
                {(Object.keys(ADUAN_STATUS) as StatusAduan[]).map((key) => (
                  <div key={key} className="bg-admin-bg rounded-xl p-[11px_12px]">
                    <div className="font-admin-heading text-[20px] font-semibold leading-none tabular-nums">
                      {fmtId(aduan.counts[key])}
                    </div>
                    <div className="text-[10px] tracking-[0.12em] uppercase text-admin-text-4 mt-[5px]">
                      {ADUAN_STATUS[key].label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!aduan || aduan.items.length === 0 ? (
              <p className="text-[13px] text-admin-text-4 py-8 text-center border-t border-admin-grid">
                Belum ada aduan masuk.
              </p>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.7fr)_minmax(0,2fr)_minmax(0,1fr)] gap-3.5 px-5 py-[9px] text-[10.5px] tracking-[0.13em] uppercase text-admin-placeholder border-y border-admin-grid">
                    <span>Kode Laporan</span>
                    <span>Jenis Aduan</span>
                    <span>Terlapor</span>
                    <span>Status</span>
                  </div>
                  {aduan.items.map((a) => (
                    <Link
                      key={a.id}
                      href={`/admin/aduan/${a.id}`}
                      className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.7fr)_minmax(0,2fr)_minmax(0,1fr)] gap-3.5 items-center px-5 py-3.5 border-b border-admin-border-soft last:border-b-0 hover:bg-admin-surface-soft transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold truncate font-admin-mono">
                          {a.kode_laporan}
                        </div>
                        <div className="text-[11.5px] text-admin-text-4 mt-0.5">
                          {formatActivityTime(a.created_at)}
                        </div>
                      </div>
                      <div className="text-[12.5px] text-admin-text-2 truncate">
                        {JENIS_ADUAN_LABEL[a.jenis_aduan] ?? a.jenis_aduan}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">
                          {a.nama_terlapor}
                        </div>
                        <div className="text-[11.5px] text-admin-text-4 truncate mt-0.5">
                          {a.fakultas_prodi ?? "—"}
                        </div>
                      </div>
                      <div>
                        <Pill tone={ADUAN_STATUS[a.status].tone}>
                          {ADUAN_STATUS[a.status].label}
                        </Pill>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          <article className="bg-admin-surface border border-admin-border rounded-2xl p-[18px_20px_8px]">
            <h2 className="font-admin-heading text-[18px] font-semibold mb-3 m-0">
              Aktivitas Terbaru
            </h2>
            {timelineItems.length === 0 ? (
              <p className="text-[13px] text-admin-text-4 py-4">
                Belum ada data.
              </p>
            ) : (
              <Timeline items={timelineItems} />
            )}
          </article>
        </motion.section>
      </div>
    </div>
  );
}
