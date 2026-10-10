"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import MonospaceBarChart from "@/components/ui/monospace-bar-chart";
import type { SelectionGroup, MonevDashboardData, MonevPeriodSummary } from "@/lib/admin-dashboard-data";

const number = (value: number) => value.toLocaleString("id-ID");
const control = "min-h-11 rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#334155] focus:outline-none focus:ring-2 focus:ring-[#000352]/20";
const panel = "rounded-lg border border-[#E2E8F0] bg-white p-5 sm:p-6";
const link = "inline-flex items-center gap-1 text-sm font-medium text-[#000352] hover:underline";
const statusLabels: Record<MonevPeriodSummary["status"], string> = {
  BELUM_DIMULAI: "Belum dibuka", BERLANGSUNG: "Berlangsung", BERAKHIR: "Berakhir",
  NONAKTIF: "Tersembunyi", NONAKTIF_BERJALAN: "Tersembunyi",
};
const date = (iso: string) => new Date(iso).toLocaleString("id-ID", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
});

function Metrics({ items }: { items: { label: string; value: number; note: string }[] }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => (
    <div key={item.label} className={panel}><p className="text-sm text-[#64748B]">{item.label}</p><p className="mt-3 text-3xl font-semibold tabular-nums text-[#0B1536]">{number(item.value)}</p><p className="mt-2 text-xs leading-relaxed text-[#64748B]">{item.note}</p></div>
  ))}</div>;
}
function DataError() {
  const router = useRouter();
  return <div role="alert" className={panel}><p className="text-sm text-[#475569]">Data belum dapat dimuat. Silakan coba lagi.</p><button onClick={() => router.refresh()} className={`${link} mt-3`}>Muat ulang</button></div>;
}

function SelectionDashboard({ data }: { data: SelectionGroup[] }) {
  const years = [...new Set(data.flatMap((item) => item.year === null ? [] : [item.year]))].sort((a, b) => b - a);
  const [year, setYear] = useState(years[0]?.toString() ?? "semua");
  const [route, setRoute] = useState("semua");
  const [chartMetric, setChartMetric] = useState<"total" | "proposed">("total");
  const filtered = data.filter((item) => (year === "semua" || (year === "tanpa" ? item.year === null : item.year === Number(year))) && (route === "semua" || item.route === route));
  const total = filtered.reduce((sum, item) => sum + item.total, 0);
  const completed = filtered.reduce((sum, item) => sum + item.completed, 0);
  const proposed = filtered.reduce((sum, item) => sum + item.proposed, 0);
  const recent = filtered.flatMap((item) => item.recent).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  const trend = [...years].reverse().map((item) => ({
    label: String(item), value: data.filter((group) => group.year === item && (route === "semua" || group.route === route)).reduce((sum, group) => sum + group[chartMetric], 0),
  }));
  const progress = total ? completed / total * 100 : 0;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-wrap gap-3">
        <label className="grid gap-2 text-xs font-medium text-[#64748B]">Tahun seleksi<select value={year} onChange={(event) => setYear(event.target.value)} className={control}><option value="semua">Semua tahun</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}{data.some((item) => item.year === null) && <option value="tanpa">Tanpa tahun seleksi</option>}</select></label>
        <label className="grid gap-2 text-xs font-medium text-[#64748B]">Jalur masuk<select value={route} onChange={(event) => setRoute(event.target.value)} className={control}><option value="semua">Semua jalur</option>{[...new Set(data.map((item) => item.route))].sort().map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <Link href="/admin/evaluasi" className={link}>Buka evaluasi <ArrowUpRight size={16} /></Link>
    </div>
    <Metrics items={[
      { label: "Total kandidat", value: total, note: "Sesuai tahun dan jalur terpilih" },
      { label: "Wawancara selesai", value: completed, note: "Memiliki hasil wawancara final" },
      { label: "Belum final", value: total - completed, note: "Belum memiliki hasil wawancara final" },
      { label: "Diusulkan", value: proposed, note: "Hasil wawancara, bukan penetapan penerima" },
    ]} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 text-sm text-[#64748B]">Rekap lintas tahun<select aria-label="Data grafik seleksi" value={chartMetric} onChange={(event) => setChartMetric(event.target.value as "total" | "proposed")} className={control}><option value="total">Jumlah kandidat</option><option value="proposed">Jumlah diusulkan</option></select></label>
        <MonospaceBarChart key={`${route}-${chartMetric}`} title={chartMetric === "total" ? "Kandidat per tahun" : "Diusulkan per tahun"} description={`Seluruh tahun tercatat - ${route === "semua" ? "semua jalur" : route}. Data tanpa tahun tidak masuk grafik.`} data={trend} unit="kandidat" />
      </div>
      <div className="space-y-4">
        <section className={panel}><h2 className="text-base font-semibold text-[#0B1536]">Progres wawancara</h2><p className="mt-4 text-3xl font-semibold tabular-nums text-[#000352]">{total ? `${progress.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%` : "-"}</p><p className="mt-2 text-sm text-[#64748B]">{number(completed)} dari {number(total)} kandidat memiliki hasil final.</p><progress aria-label="Progres finalisasi wawancara" value={completed} max={Math.max(total, 1)} className="mt-4 h-2 w-full overflow-hidden rounded [&::-webkit-progress-bar]:bg-slate-100 [&::-webkit-progress-value]:bg-[#000352] [&::-moz-progress-bar]:bg-[#000352]" /></section>
        <section className={panel}><h2 className="text-base font-semibold text-[#0B1536]">Kelola seleksi</h2><div className="mt-4 grid gap-4"><Link className={link} href="/admin/import">Impor data kandidat <ArrowUpRight size={15} /></Link><Link className={link} href="/admin/wawancara/urutan">Kelola sesi wawancara <ArrowUpRight size={15} /></Link><Link className={link} href="/admin/hasil-akhir">Lihat hasil akhir <ArrowUpRight size={15} /></Link><Link className={link} href="/admin/analitik">Buka analitik seleksi <ArrowUpRight size={15} /></Link></div></section>
      </div>
    </div>
    <section className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
      <div className="px-6 py-5"><h2 className="font-semibold text-[#0B1536]">Hasil wawancara terbaru</h2><p className="mt-1 text-sm text-[#64748B]">Mengikuti filter tahun dan jalur yang dipilih.</p></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-y border-[#E2E8F0] bg-slate-50 text-[#64748B]"><tr>{["Kandidat", "Program studi", "Hasil wawancara", "Waktu (WIB)"].map((label) => <th key={label} scope="col" className="px-6 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{recent.length ? recent.map((item) => <tr key={item.id}><td className="px-6 py-4 font-medium text-[#0B1536]">{item.name}</td><td className="px-6 py-4">{item.prodi}</td><td className="px-6 py-4">{item.result}</td><td className="px-6 py-4 text-[#64748B]">{date(item.at)}</td></tr>) : <tr><td colSpan={4} className="p-10 text-center text-[#64748B]">Belum ada hasil wawancara untuk pilihan ini.</td></tr>}</tbody></table></div>
    </section>
  </div>;
}

function MonevDashboard({ data }: { data: MonevDashboardData }) {
  const [periodId, setPeriodId] = useState(data.periods.find((period) => period.status === "BERLANGSUNG")?.id ?? data.periods.at(-1)?.id ?? "semua");
  const [range, setRange] = useState("6");
  const selected = data.periods.find((period) => period.id === periodId);
  const periods = selected ? [selected] : data.periods;
  const sum = (key: "reports" | "pending" | "review") => periods.reduce((total, period) => total + period[key], 0);
  const chartPeriods = range === "semua" ? data.periods : data.periods.slice(-Number(range));
  const resultsUrl = (id: string) => `/admin/monev?tab=hasil&periode=${encodeURIComponent(id)}`;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <label className="grid gap-2 text-xs font-medium text-[#64748B]">Periode Monev<select value={periodId} onChange={(event) => setPeriodId(event.target.value)} className={`${control} max-w-full`}><option value="semua">Semua periode</option>{[...data.periods].reverse().map((period) => <option key={period.id} value={period.id}>{period.label}</option>)}</select></label>
      <Link href="/admin/monev" className={link}>Kelola jadwal pengisian <ArrowUpRight size={16} /></Link>
    </div>
    <Metrics items={[
      { label: "Laporan masuk", value: sum("reports"), note: selected ? selected.label : "Akumulasi seluruh periode" },
      { label: "Mahasiswa pelapor", value: selected?.students ?? data.uniqueStudents, note: "Mahasiswa unik yang pernah mengirim" },
      { label: "Belum dipindai AI", value: sum("pending"), note: "Laporan belum memiliki hasil pemindaian" },
      { label: "Perlu ditinjau", value: sum("review"), note: "Indikasi perbedaan atau dokumen tidak terbaca" },
    ]} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="space-y-3"><label className="flex items-center justify-between gap-3 text-sm text-[#64748B]">Rekap lintas periode<select className={control} value={range} onChange={(event) => setRange(event.target.value)}><option value="6">6 periode terakhir</option><option value="semua">Semua periode</option></select></label><MonospaceBarChart key={range} title="Laporan masuk per periode" description="Jumlah laporan tersimpan. Rentang grafik terpisah dari filter ringkasan di atas." data={chartPeriods.map((period) => ({ label: period.label, value: period.reports }))} unit="laporan" /></div>
      <div className="space-y-4">
        <section className={panel}><h2 className="text-base font-semibold text-[#0B1536]">{selected ? "Periode terpilih" : "Cakupan rekap"}</h2>{selected ? <><p className="mt-4 font-medium text-[#000352]">{selected.label}</p><p className="mt-2 text-sm text-[#64748B]">{statusLabels[selected.status]}</p><p className="mt-4 text-xs text-[#64748B]">Batas pengisian (WIB)</p><p className="mt-1 text-sm">{date(selected.deadline)}</p><Link href={resultsUrl(selected.id)} className={`${link} mt-5`}>Periksa hasil Monev <ArrowUpRight size={16} /></Link></> : <p className="mt-3 text-sm leading-relaxed text-[#64748B]">{data.periods.length ? `${data.periods.length} periode tercatat. Pilih periode untuk membuka laporan mahasiswa.` : "Belum ada periode Monev. Buat periode melalui halaman jadwal pengisian."}</p>}</section>
        <section className={panel}><h2 className="text-base font-semibold text-[#0B1536]">Tentang angka rekap</h2><p className="mt-3 text-sm leading-relaxed text-[#64748B]">Satu mahasiswa dapat mengirim laporan pada beberapa periode. Jumlah laporan berbeda dari jumlah mahasiswa unik.</p><p className="mt-3 text-sm leading-relaxed text-[#64748B]">Persentase pengisian belum ditampilkan karena daftar mahasiswa wajib isi per periode belum tersedia.</p></section>
      </div>
    </div>
    <section className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white"><div className="px-6 py-5"><h2 className="font-semibold text-[#0B1536]">Rekap periode</h2><p className="mt-1 text-sm text-[#64748B]">Mengikuti pilihan periode pada ringkasan.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="border-y border-[#E2E8F0] bg-slate-50 text-[#64748B]"><tr>{["Periode", "Laporan", "Mahasiswa pelapor", "Belum dipindai", "Perlu ditinjau", ""].map((label) => <th key={label} scope="col" className="px-5 py-3 font-medium">{label || "Aksi"}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">{periods.length ? [...periods].reverse().map((period) => <tr key={period.id}><td className="px-5 py-4"><p className="font-medium text-[#0B1536]">{period.label}</p><p className="mt-1 text-xs text-[#64748B]">{statusLabels[period.status]}</p></td><td className="px-5 py-4 tabular-nums">{number(period.reports)}</td><td className="px-5 py-4 tabular-nums">{number(period.students)}</td><td className="px-5 py-4 tabular-nums">{number(period.pending)}</td><td className="px-5 py-4 tabular-nums">{number(period.review)}</td><td className="px-5 py-4"><Link href={resultsUrl(period.id)} className={link}>Lihat hasil</Link></td></tr>) : <tr><td colSpan={6} className="p-10 text-center text-[#64748B]">Belum ada periode Monev.</td></tr>}</tbody></table></div></section>
  </div>;
}

export default function AdminDashboardContent({ selection, monev }: { selection: SelectionGroup[] | null; monev: MonevDashboardData | null }) {
  const [tab, setTab] = useState<"seleksi" | "monev">("seleksi");
  const tabs = [{ id: "seleksi", label: "Manajemen Seleksi" }, { id: "monev", label: "Monev" }] as const;
  return <div className="min-h-screen bg-[#F8FAFC] text-[#334155]">
    <PageHeader title="Dashboard" description="Pantau pelaksanaan seleksi dan monitoring mahasiswa KIP Kuliah." />
    <div className="px-4 pt-6 pb-8 sm:px-[30px]">
      <div role="tablist" aria-label="Dashboard admin" className="mb-6 flex gap-6 border-b border-[#E2E8F0]">
        {tabs.map((item, index) => <button key={item.id} role="tab" id={`dashboard-tab-${item.id}`} aria-controls={`dashboard-panel-${item.id}`} aria-selected={tab === item.id} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}
          onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - index; setTab(tabs[next].id); document.getElementById(`dashboard-tab-${tabs[next].id}`)?.focus(); }}
          className={`border-b-2 px-1 pb-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-[#000352] ${tab === item.id ? "border-[#000352] text-[#000352]" : "border-transparent text-[#64748B] hover:text-[#000352]"}`}>{item.label}</button>)}
      </div>
      <section id="dashboard-panel-seleksi" role="tabpanel" aria-labelledby="dashboard-tab-seleksi" hidden={tab !== "seleksi"}>{tab === "seleksi" && (selection ? <SelectionDashboard data={selection} /> : <DataError />)}</section>
      <section id="dashboard-panel-monev" role="tabpanel" aria-labelledby="dashboard-tab-monev" hidden={tab !== "monev"}>{tab === "monev" && (monev ? <MonevDashboard data={monev} /> : <DataError />)}</section>
    </div>
  </div>;
}
