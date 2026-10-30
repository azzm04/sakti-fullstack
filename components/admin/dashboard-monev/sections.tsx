"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness, FileWarning, MessageCircleOff, Repeat2, Send, ShieldAlert, TrendingUp,
  UserRoundMinus, UserRoundX, UsersRound, type LucideIcon,
} from "lucide-react";
import type { Fase, Kelompok, MonevDashboard } from "@/lib/dashboard-monev/data";
import { rupiahSingkat } from "@/lib/dashboard-monev/rules";
import { pengisianBerakhir } from "@/lib/monev/evaluasi";
import { Angka, Muncul } from "./anim";
import type { IsiDaftar } from "./DaftarDialog";
import { kontakLabel } from "./Ringkasan";
import { BarisAngka, Kosong, Panel, PilihKecil, TitikNada, angka, kartu, nadaWarna, tanggal, warna } from "./ui";

type Buka = (isi: IsiDaftar) => void;

const ikonKelompok: Record<string, LucideIcon> = {
  "tidak-memenuhi": ShieldAlert, "kk-berbeda": UsersRound, dokumen: FileWarning, pekerjaan: BriefcaseBusiness,
  "kini-tidak": ShieldAlert, "dua-periode": Repeat2, naik: TrendingUp, tanggungan: UserRoundMinus, "kerja-baru": BriefcaseBusiness,
  "seleksi-tidak": ShieldAlert, "seleksi-naik": TrendingUp, "seleksi-anggota": UsersRound, "seleksi-kerja": BriefcaseBusiness,
};

/** Label lebih pendek untuk daftar ringkas. */
const labelPendek: Record<string, string> = {
  "kk-berbeda": "Anggota KK berbeda",
  pekerjaan: "Pekerjaan ditandai",
  "dua-periode": "Tidak memenuhi 2 periode",
  naik: "Penghasilan naik > 50%", "seleksi-naik": "Penghasilan naik > 50%",
  "seleksi-anggota": "Anggota keluarga berbeda",
};

function DaftarKelompok({ kelompok, buka, keterangan }: { kelompok: Kelompok[]; buka: Buka; keterangan?: string }) {
  return (
    <ul className="mt-3 grid gap-0.5">
      {kelompok.map((k, i) => (
        <li key={k.id}>
          <Muncul urutan={i}>
            <BarisAngka ikon={ikonKelompok[k.id] ?? ShieldAlert} warnaIkon={k.nada === "info" ? "#475569" : nadaWarna[k.nada]}
              judul={labelPendek[k.id] ?? k.label} nilai={<Angka value={k.kasus.length} />}
              onClick={k.kasus.length ? () => buka({ judul: k.label, keterangan, baris: k.kasus }) : undefined} />
          </Muncul>
        </li>
      ))}
    </ul>
  );
}

/* ── Hasil pemeriksaan ──────────────────────────────────────── */
export function HasilPemeriksaan({ data, buka }: { data: MonevDashboard["pemeriksaan"]; buka: Buka }) {
  return (
    <Panel title="Hasil pemeriksaan"
      info={<>Dari {angka(data.dipindai)} laporan yang sudah dipindai AI. {angka(data.tanpaTanda)} laporan tanpa tanda. Satu laporan bisa masuk lebih dari satu kelompok, dan hasil AI bukan keputusan akhir.</>}>
      {data.dipindai === 0 ? <Kosong>Belum ada laporan yang dipindai.</Kosong> : <DaftarKelompok kelompok={data.kelompok} buka={buka} />}
    </Panel>
  );
}

/* ── Hubungi mahasiswa ──────────────────────────────────────── */
const ikonKontak = { TELEGRAM: Send, BELUM_TELEGRAM: MessageCircleOff, BELUM_AKUN: UserRoundX } as const;

export function HubungiMahasiswa({ data, fase, buka, pengingatUrl }: { data: MonevDashboard["belum"]; fase: Fase; buka: Buka; pengingatUrl?: string }) {
  const lewat = pengisianBerakhir(fase);
  const kelompok = (["TELEGRAM", "BELUM_TELEGRAM", "BELUM_AKUN"] as const).map((k) => ({ kontak: k, daftar: data.daftar.filter((b) => b.kontak === k) }));
  const sub = (k: (typeof kelompok)[number]["kontak"]) => {
    if (k !== "TELEGRAM") return "Hubungi manual";
    if (lewat) return "Form sudah tertutup";
    return data.pengingatBerikut ? `Pengingat ${tanggal(data.pengingatBerikut.tanggal)}` : "Tidak ada pengingat lagi";
  };
  return (
    <Panel title={lewat ? "Tidak mengisi" : "Belum mengisi"}
      aksi={pengingatUrl ? <Link href={pengingatUrl} className="inline-flex min-h-9 items-center text-[12px] font-medium text-[#000352] hover:underline">Kelola pengingat</Link> : undefined}
      info={lewat
        ? "Batas pengisian sudah lewat dan pengingat tidak dikirim lagi. Perpanjang periode di halaman jadwal bila mahasiswa masih diberi kesempatan."
        : "Pengingat Telegram dikirim otomatis pukul 08.00 WIB pada 30, 7, 3, 2, dan 1 hari sebelum batas, hanya ke yang belum mengisi."}>
      {data.daftar.length === 0 ? <Kosong>Semua sudah mengirim laporan.</Kosong> : (
        <ul className="mt-3 grid gap-0.5">
          {kelompok.map((k, i) => (
            <li key={k.kontak}>
              <Muncul urutan={i}>
                <BarisAngka ikon={ikonKontak[k.kontak]} warnaIkon={k.kontak === "TELEGRAM" ? warna.navy : "#475569"}
                  judul={kontakLabel[k.kontak]} sub={sub(k.kontak)} nilai={<Angka value={k.daftar.length} />}
                  onClick={k.daftar.length ? () => buka({
                    judul: kontakLabel[k.kontak], keterangan: lewat ? "Tidak mengisi sampai batas" : "Belum mengisi",
                    baris: k.daftar.map((b) => ({ ...b, detail: b.email ?? "Email belum tercatat", salinan: [b.email ?? ""] })), kolomSalinan: ["Email"],
                  }) : undefined} />
              </Muncul>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ── Perubahan kondisi ──────────────────────────────────────── */
export function PerubahanKondisi({ data, buka }: { data: MonevDashboard["perubahan"]; buka: Buka }) {
  const [dari, setDari] = useState<"lalu" | "seleksi">("lalu");
  const lalu = data.periodeLalu;
  const seleksi = data.seleksi;
  return (
    <Panel title="Perubahan kondisi"
      info={dari === "lalu"
        ? (lalu ? `Dibanding laporan ${lalu.pembanding}, dari ${angka(lalu.dibandingkan)} mahasiswa yang mengisi kedua periode.` : "Belum ada periode sebelumnya.")
        : `Dibanding data saat seleksi. Tercakup ${angka(seleksi.tercakup)} dari ${angka(seleksi.total)} mahasiswa; sisanya belum punya data seleksi di SAKTI.`}
      aksi={<PilihKecil label="Bandingkan dengan" value={dari} onChange={setDari} options={[
        { value: "lalu", label: "Periode lalu" }, { value: "seleksi", label: "Data seleksi" },
      ]} />}>
      {dari === "lalu"
        ? (!lalu ? <Kosong>Belum ada periode sebelumnya.</Kosong> : <DaftarKelompok key="lalu" kelompok={lalu.kelompok} buka={buka} keterangan={`Dibanding ${lalu.pembanding}`} />)
        : (seleksi.tercakup === 0 ? <Kosong>Belum ada data seleksi yang cocok.</Kosong> : <DaftarKelompok key="seleksi" kelompok={seleksi.kelompok} buka={buka} keterangan="Dibanding data seleksi" />)}
    </Panel>
  );
}

/* ── Perlu ditinjau ─────────────────────────────────────────── */
const TAMPIL = 5;

export function PerluDitinjau({ data, buka }: { data: MonevDashboard["perhatian"]; buka: Buka }) {
  const bukaSemua = () => buka({ judul: "Sinyal yang perlu diperhatikan", baris: data.map((p) => ({ ...p, detail: p.tanda.map((t) => t.label).join(" · ") })) });
  return (
    <section className={`${kartu} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 px-5 pt-5 md:px-6">
        <h2 className="text-[16px] font-semibold leading-6 text-[#0F172A]">Sinyal yang perlu diperhatikan</h2>
        {data.length > TAMPIL && (
          <button type="button" onClick={bukaSemua} className="rounded text-[13px] font-medium text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]">
            Lihat semua ({angka(data.length)})
          </button>
        )}
      </div>
      {data.length === 0
        ? <div className="px-5 pb-5 md:px-6"><Kosong>Tidak ada sinyal gabungan yang perlu diperhatikan.</Kosong></div>
        : <div className="mt-3 overflow-x-auto"><table className="w-full min-w-160 text-left text-[13px] leading-5">
          <thead className="text-[12px] text-[#64748B]"><tr>
            {["Mahasiswa", "Program studi", "Penghasilan", "Tanda utama"].map((h) => <th key={h} scope="col" className="border-b border-[#E2E8F0] px-5 py-2.5 font-medium md:px-6">{h}</th>)}
          </tr></thead>
          <tbody>
            {data.slice(0, TAMPIL).map((b, i) => (
              <tr key={b.nim} className="transition-colors hover:bg-[#F8FAFC]">
                <td className="border-b border-[#F1F5F9] px-5 py-3 md:px-6">
                  <Muncul urutan={i}>
                    <span className="block font-medium text-[#0F172A]">{b.nama}</span>
                    <span className="block text-[12px] tabular-nums text-[#94A3B8]">{b.nim}</span>
                  </Muncul>
                </td>
                <td className="border-b border-[#F1F5F9] px-5 py-3 text-[#475569] md:px-6">{b.prodi}</td>
                <td className="border-b border-[#F1F5F9] px-5 py-3 tabular-nums text-[#0F172A] md:px-6">
                  {rupiahSingkat(b.penghasilan)}<span className="text-[#94A3B8]"> / {b.anggota} orang</span>
                </td>
                <td className="border-b border-[#F1F5F9] px-5 py-3 md:px-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] px-2.5 py-0.5 text-[12px] text-[#475569]">
                    <TitikNada nada={b.tanda[0].nada} />{b.tanda[0].label}
                  </span>
                  {b.tanda.length > 1 && <span className="ml-1.5 text-[12px] text-[#94A3B8]" title={b.tanda.slice(1).map((t) => t.label).join(", ")}>+{b.tanda.length - 1}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>}
    </section>
  );
}
