"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonevDashboard } from "@/lib/dashboard-monev/data";
import type { IsiDaftar } from "./DaftarDialog";
import { kontakLabel } from "./Ringkasan";
import { Kosong, Panel, PilihKecil, angka, kotakTooltip, warna } from "./ui";

const potong = (teks: string, n: number) => (teks.length > n ? `${teks.slice(0, n - 1)}…` : teks);

/** Label sumbu X dua baris supaya nama prodi tidak bertumpuk. */
function TickDuaBaris({ x = 0, y = 0, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const kata = (payload?.value ?? "").split(" ");
  const [a, b] = kata.length === 1 ? [potong(kata[0], 11), ""] : [potong(kata[0], 11), potong(kata.slice(1).join(" "), 11)];
  return (
    <text x={x} y={y + 10} textAnchor="middle" fontSize={11} fill={warna.teks}>
      <tspan x={x}>{a}</tspan>
      {b && <tspan x={x} dy={13}>{b}</tspan>}
    </text>
  );
}

type Prodi = MonevDashboard["belum"]["perProdi"][number];
type BarisProdi = Prodi & { rasio: number };
interface ProdiTooltip { active?: boolean; payload?: { payload: BarisProdi }[] }

/** Grafik utama: persentase laporan masuk per prodi. Klik batang untuk daftar yang belum mengisi. */
export function PengisianProdi({ data, belum, buka }: { data: Prodi[]; belum: MonevDashboard["belum"]["daftar"]; buka: (isi: IsiDaftar) => void }) {
  const [mode, setMode] = useState<"terendah" | "semua">("terendah");
  const kurangiGerak = useReducedMotion();

  const baris = useMemo<BarisProdi[]>(() => {
    const urut = data.map((p) => ({ ...p, rasio: p.wajib ? Math.round(p.sudah / p.wajib * 100) : 0 })).sort((a, b) => a.rasio - b.rasio);
    return mode === "terendah" ? urut.slice(0, 10) : urut;
  }, [data, mode]);
  const totalWajib = data.reduce((n, p) => n + p.wajib, 0);
  const rataRata = totalWajib ? Math.round(data.reduce((n, p) => n + p.sudah, 0) / totalWajib * 100) : 0;

  const bukaProdi = (nama: string) => buka({
    judul: `Belum mengisi · ${nama}`, keterangan: "Bisa diteruskan ke koordinator prodi",
    baris: belum.filter((b) => b.prodi === nama).map((b) => ({ ...b, detail: kontakLabel[b.kontak], salinan: [b.email ?? ""] })),
    kolomSalinan: ["Email"],
  });

  const tooltipIsi = ({ active, payload }: ProdiTooltip) => {
    const p = active ? payload?.[0]?.payload : undefined;
    if (!p) return null;
    return (
      <div className={`${kotakTooltip} min-w-40`}>
        <p className="text-[#64748B]">{p.nama}</p>
        <p className="mt-0.5 flex items-baseline justify-between gap-3">
          <span className="text-[15px] font-semibold tabular-nums text-[#0F172A]">{p.rasio}%</span>
          <span className="tabular-nums text-[#64748B]">{angka(p.wajib - p.sudah)} belum</span>
        </p>
      </div>
    );
  };

  return (
    <Panel title="Pengisian per prodi"
      info={<>Persentase mahasiswa wajib isi yang sudah mengirim laporan, dari yang terendah. Garis putus-putus adalah rata-rata ({rataRata}%). Klik batang untuk melihat siapa yang belum mengisi; daftar yang sama juga bisa dicari per prodi lewat kartu Belum mengisi.</>}
      aksi={data.length > 10 ? <PilihKecil label="Tampilkan prodi" value={mode} onChange={setMode} options={[
        { value: "terendah", label: "10 terendah" }, { value: "semua", label: `Semua (${data.length})` },
      ]} /> : undefined}>
      {data.length === 0 ? <Kosong>Belum ada mahasiswa wajib isi.</Kosong> : (
        <div className="-mx-1 mt-4 overflow-x-auto px-1">
          <div className="h-64" style={{ minWidth: Math.max(baris.length * 60, 320) }} role="img"
            aria-label={`Rata-rata ${rataRata}%. ${baris.map((b) => `${b.nama} ${b.rasio}%`).join(", ")}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={baris} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="38%">
                <XAxis dataKey="nama" tickLine={false} axisLine={false} interval={0} height={36} tick={(p: object) => <TickDuaBaris {...p} />} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false}
                  tick={{ fontSize: 11, fill: warna.teks }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip content={(props) => tooltipIsi(props as unknown as ProdiTooltip)} cursor={false} />
                <Bar dataKey="rasio" fill={warna.navy} radius={[6, 6, 6, 6]} background={{ fill: warna.lintasan, radius: 6 }}
                  activeBar={{ fill: warna.navySedang }} isAnimationActive={!kurangiGerak} animationDuration={800} animationEasing="ease-out"
                  className="cursor-pointer" onClick={(d: { payload?: BarisProdi }) => d.payload && d.payload.wajib > d.payload.sudah && bukaProdi(d.payload.nama)} />
                <ReferenceLine y={rataRata} stroke={warna.teks} strokeDasharray="4 4" strokeOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Panel>
  );
}
