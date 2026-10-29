"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
} from "lucide-react";
import {
  tanggalWib,
  urlPeriode,
  type PeriodeRuangKerja,
} from "@/lib/monev/ruang-kerja";
import LangkahJadwal from "./ruang-kerja/LangkahJadwal";
import AksiPeriode from "./AksiPeriode";
import { halaman, kolom, panel, tombol, utama } from "./ruang-kerja/tampilan";

type StatusRingkas =
  | "belum-dimulai"
  | "proses"
  | "ditutup"
  | "final";

function statusRingkas(p: PeriodeRuangKerja): {
  id: StatusRingkas;
  label: string;
  detail: string;
  warna: string;
} {
  if (p.fase === "FINAL")
    return {
      id: "final",
      label: "Final",
      detail: "Hasil terkunci",
      warna: "bg-[#15803D] text-white",
    };
  if (p.fase === "DITUTUP")
    return {
      id: "ditutup",
      label: "Ditutup",
      detail: "Pengisian ditutup. Hasil evaluasi belum final.",
      warna: "bg-[#E2E8F0] text-[#334155]",
    };
  if (p.fase === "BERLANGSUNG")
    return {
      id: "proses",
      label: "Proses",
      detail: "Pengisian berlangsung",
      warna: "bg-[#64748B] text-white",
    };
  if (p.fase === "TENGGAT_LEWAT")
    return {
      id: "proses",
      label: "Proses",
      detail: "Tenggat sudah lewat",
      warna: "bg-[#64748B] text-white",
    };
  return {
    id: "belum-dimulai",
    label: "Belum dimulai",
    detail: p.fase === "NONAKTIF" ? "Periode nonaktif" : "Sudah dijadwalkan",
    warna: "bg-[#F1F5F9] text-[#475569]",
  };
}

function StatusPeriode({ periode }: { periode: PeriodeRuangKerja }) {
  const status = statusRingkas(periode);
  return (
    <span
      title={status.detail}
      aria-label={`${status.label}: ${status.detail}`}
      className={`inline-flex whitespace-nowrap rounded px-2.5 py-1 text-[12px] font-medium leading-4 ${status.warna}`}
    >
      {status.label}
    </span>
  );
}

export default function DaftarPeriode({
  periods,
  buat,
  contoh = false,
}: {
  periods: PeriodeRuangKerja[];
  buat: boolean;
  contoh?: boolean;
}) {
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState("semua");
  const [tahun, setTahun] = useState("");
  const [semester, setSemester] = useState("");
  const [ukuran, setUkuran] = useState(10);
  const [hal, setHal] = useState(1);
  const daftarTahun = [...new Set(periods.map((p) => p.tahun_akademik))].sort(
    (a, b) => b - a,
  );
  const daftarSemester = [...new Set(periods.map((p) => p.semester))].sort();
  const namaEvaluasi = (p: PeriodeRuangKerja) =>
    `Evaluasi ekonomi ${p.semester} ${p.tahun_akademik}/${p.tahun_akademik + 1}`;
  const rows = periods.filter(
    (p) =>
      (namaEvaluasi(p) + " " + p.label)
        .toLowerCase()
        .includes(cari.trim().toLowerCase()) &&
      (status === "semua" || statusRingkas(p).id === status) &&
      (!tahun || p.tahun_akademik === Number(tahun)) &&
      (!semester || p.semester === semester),
  );
  const jumlahHalaman = Math.max(1, Math.ceil(rows.length / ukuran));
  const halamanAktif = Math.min(hal, jumlahHalaman);
  const mulai = (halamanAktif - 1) * ukuran;
  const tampil = rows.slice(mulai, mulai + ukuran);
  const daftarUrl = `/admin/monev${contoh ? "?demo=1" : ""}`;
  const ubahFilter = (set: (value: string) => void, value: string) => {
    set(value);
    setHal(1);
  };

  if (buat) return <div className="min-h-screen bg-[#F8FAFC] font-body text-[#334155]">
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Link href={daftarUrl} className="inline-flex min-h-11 items-center gap-2 rounded text-[13px] font-medium text-[#475569] transition-colors hover:text-[#000352] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"><ArrowLeft size={16} aria-hidden />Kembali ke periode evaluasi</Link>
      <header className="max-w-2xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0B1536] sm:text-4xl">Buat periode evaluasi</h1>
        <p className="mt-3 text-[14px] leading-6 text-[#64748B] sm:text-base">Tentukan semester yang dievaluasi dan jadwal pengisian Monev mahasiswa.</p>
      </header>
      <LangkahJadwal />
    </div>
  </div>;

  return (
    <div className={halaman}>
      <header className="mb-6">
        <div>
          <h1 className="text-[24px] font-semibold leading-8 text-[#000352] lg:text-[32px] lg:leading-10">
            Periode evaluasi
          </h1>
          <p className="mt-2 text-[13px] leading-6 text-[#64748B]">
            Atur jadwal pengisian dan buka laporan ekonomi setiap periode.
          </p>
        </div>
      </header>
      {contoh && (
        <p className="mb-5 text-[12px] text-[#64748B]">
          Data contoh · {" "}
          <Link href="/admin/monev" className="font-medium underline">
            Buka data asli
          </Link>
        </p>
      )}
      {buat ? (
        <div className="max-w-3xl">
          <LangkahJadwal />
        </div>
      ) : (
        <section
          className={`${panel} overflow-hidden`}
          aria-label="Daftar periode evaluasi"
        >
          <div className="grid grid-cols-1 items-end gap-4 border-b border-[#E2E8F0] p-5 sm:grid-cols-2 xl:grid-cols-[minmax(280px,1fr)_160px_160px_160px]">
            <div className="flex min-w-0 items-end gap-2 sm:col-span-2 xl:col-span-1">
            <label className="min-w-0 flex-1 text-[12px] text-[#64748B]">
              Cari periode
              <span className="relative mt-1.5 block">
                <Search
                  size={15}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-3.5 text-[#94A3B8]"
                />
                <input
                  value={cari}
                  onChange={(e) => ubahFilter(setCari, e.target.value)}
                  placeholder="Semester atau tahun akademik"
                  className={`${kolom} !pl-9 !text-base sm:!text-sm`}
                />
              </span>
            </label>
            </div>
            <label className="min-w-0 text-[12px] text-[#64748B]">
              Tahun akademik
              <select
                aria-label="Tahun akademik"
                value={tahun}
                onChange={(e) => ubahFilter(setTahun, e.target.value)}
                className={`${kolom} mt-1.5 !text-base sm:!text-sm`}
              >
                <option value="">Semua tahun</option>
                {daftarTahun.map((t) => (
                  <option key={t} value={t}>
                    {t}/{t + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-[12px] text-[#64748B]">
              Semester
              <select
                aria-label="Semester"
                value={semester}
                onChange={(e) => ubahFilter(setSemester, e.target.value)}
                className={`${kolom} mt-1.5 !text-base sm:!text-sm`}
              >
                <option value="">Semua semester</option>
                {daftarSemester.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-0 text-[12px] text-[#64748B]">
              Status periode
              <select
                aria-label="Status periode"
                value={status}
                onChange={(e) => ubahFilter(setStatus, e.target.value)}
                className={`${kolom} mt-1.5 !text-base sm:!text-sm`}
              >
                <option value="semua">Semua status</option>
                <option value="belum-dimulai">Belum dimulai</option>
                <option value="proses">Proses</option>
                <option value="ditutup">Ditutup</option>
                <option value="final">Final</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
            <label className="flex items-center gap-2 text-[12px] text-[#64748B]">
              Tampilkan
              <select
                aria-label="Jumlah periode per halaman"
                value={ukuran}
                onChange={(e) => {
                  setUkuran(Number(e.target.value));
                  setHal(1);
                }}
                className="min-h-11 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[13px] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#000352]/20"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              periode
            </label>
            <Link href="/admin/monev?buat=1" className={`${utama} shrink-0`}><Plus size={15} aria-hidden />Buat periode</Link>
          </div>
          <div className="relative hidden overflow-x-auto md:block" tabIndex={0} role="region" aria-label="Tabel periode evaluasi, geser untuk kolom lainnya">
            <table className="w-full min-w-[1245px] table-fixed text-left text-[13px]">
              <caption className="sr-only">
                Daftar evaluasi ekonomi per tahun akademik dan semester
              </caption>
              <colgroup><col style={{ width: 65 }} /><col style={{ width: 152 }} /><col style={{ width: 250 }} /><col style={{ width: 180 }} /><col style={{ width: 145 }} /><col style={{ width: 105 }} /><col style={{ width: 210 }} /><col style={{ width: 138 }} /></colgroup>
              <thead className="border-y border-[#E2E8F0] bg-[#FAFBFD] text-[12px] text-[#64748B]">
                <tr>
                  {[
                    "No",
                    "Kelola",
                    "Nama evaluasi",
                    "Total mahasiswa Dievaluasi",
                    "Tahun akademik",
                    "Semester",
                    "Jadwal pengisian · WIB",
                    "Status periode",
                  ].map((h) => (
                    <th key={h} scope="col" className={`px-5 py-3 font-medium${h === "Status periode" ? " text-center" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF0F4]">
                {tampil.map((p, index) => (
                  <tr key={p.id} className="align-top hover:bg-[#FAFBFD]">
                    <td className="px-5 py-5 tabular-nums text-[#64748B]">{mulai + index + 1}</td>
                    <td className="px-5 py-5">
                      <AksiPeriode periode={p} contoh={contoh} />
                    </td>
                    <td className="px-5 py-5">
                      <Link
                        href={urlPeriode(p.id, undefined, contoh)}
                        className="font-semibold leading-6 text-[#0F172A] hover:text-[#000352] hover:underline"
                      >
                        {namaEvaluasi(p)}
                      </Link>
                    </td>
                    <td className="px-5 py-5">
                      <p className="font-semibold tabular-nums text-[#0F172A]">
                        {p.ringkasan.wajibIsi.toLocaleString("id-ID")}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[12px] text-[#64748B]">
                        {p.ringkasan.terkirim.toLocaleString("id-ID")} laporan masuk
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-5 text-[#0F172A]">
                      {p.tahun_akademik}/{p.tahun_akademik + 1}
                    </td>
                    <td className="px-5 py-5 text-[#0F172A]">{p.semester}</td>
                    <td className="px-5 py-5 text-[12px] leading-5 text-[#64748B]">
                      <p>
                        <span className="font-medium text-[#0F172A]">
                          Mulai:{" "}
                        </span>
                        {p.waktu_mulai
                          ? tanggalWib(p.waktu_mulai)
                          : "Belum diatur"}
                      </p>
                      <p className="mt-1">
                        <span className="font-medium text-[#0F172A]">
                          Batas:{" "}
                        </span>
                        {tanggalWib(p.deadline)}
                      </p>
                    </td>
                    <td className="px-5 py-5 text-center align-middle">
                      <StatusPeriode periode={p} />
                    </td>
                  </tr>
                ))}
                {!tampil.length && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-[#64748B]"
                    >
                      {periods.length
                        ? "Tidak ada periode yang sesuai dengan filter."
                        : "Belum ada periode. Tambahkan periode pertama untuk memulai evaluasi."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <ul aria-label="Periode evaluasi" className="divide-y divide-[#E2E8F0] border-t border-[#E2E8F0] md:hidden">
            {tampil.map((p, index) => <li key={p.id} className="space-y-4 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-3"><span className="text-[12px] leading-6 tabular-nums text-[#64748B]">{mulai + index + 1}.</span><Link href={urlPeriode(p.id, undefined, contoh)} className="min-w-0 text-[14px] font-semibold leading-6 text-[#000352] hover:underline">{namaEvaluasi(p)}</Link></div>
                <StatusPeriode periode={p} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-[12px] leading-5">
                <div><dt className="text-[#64748B]">Tahun akademik</dt><dd>{p.tahun_akademik}/{p.tahun_akademik + 1}</dd></div>
                <div><dt className="text-[#64748B]">Semester</dt><dd>{p.semester}</dd></div>
                <div><dt className="text-[#64748B]">Total mahasiwa dievaluasi</dt><dd>{p.ringkasan.wajibIsi.toLocaleString("id-ID")}</dd></div>
                <div><dt className="text-[#64748B]">Laporan masuk</dt><dd>{p.ringkasan.terkirim.toLocaleString("id-ID")}</dd></div>
                <div className="col-span-2"><dt className="text-[#64748B]">Jadwal pengisian · WIB</dt><dd>Mulai: {p.waktu_mulai ? tanggalWib(p.waktu_mulai) : "Belum diatur"}<br />Batas: {tanggalWib(p.deadline)}</dd></div>
              </dl>
              <div className="flex items-center justify-between border-t border-[#EDF0F4] pt-2"><span className="text-[12px] text-[#64748B]">Kelola</span><AksiPeriode periode={p} contoh={contoh} /></div>
            </li>)}
            {!tampil.length && <li className="px-4 py-10 text-center text-[13px] leading-6 text-[#64748B]">{periods.length ? "Tidak ada periode yang sesuai dengan filter." : "Belum ada periode. Tambahkan periode pertama untuk memulai evaluasi."}</li>}
          </ul>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E2E8F0] px-5 py-4">
            <nav
              aria-label="Halaman daftar periode"
              className="flex items-center gap-3"
            >
              <button
                disabled={halamanAktif === 1}
                onClick={() => setHal(halamanAktif - 1)}
                className={tombol}
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-[12px] tabular-nums text-[#64748B]">
                {halamanAktif} / {jumlahHalaman}
              </span>
              <button
                disabled={halamanAktif === jumlahHalaman}
                onClick={() => setHal(halamanAktif + 1)}
                className={tombol}
                aria-label="Halaman berikutnya"
              >
                <ChevronRight size={15} />
              </button>
            </nav>
          </div>
        </section>
      )}
    </div>
  );
}
