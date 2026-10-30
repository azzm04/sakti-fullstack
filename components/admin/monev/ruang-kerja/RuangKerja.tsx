"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { MonevDashboard as Dashboard } from "@/lib/dashboard-monev/data";
import type { LaporanEkonomi as Baris } from "@/lib/monev/laporan-ekonomi";
import { tanggalWib, urlPeriode, type PeriodeRuangKerja } from "@/lib/monev/ruang-kerja";
import { HARI_PENGINGAT, type Kontak } from "@/lib/dashboard-monev/rules";
import KepalaPeriode from "./KepalaPeriode";
import LangkahJadwal from "./LangkahJadwal";
import LaporanEkonomi from "./LaporanEkonomi";
import { halaman, wadahForm, panel, kolom, tombol, utama } from "./tampilan";

export default function RuangKerja({ periode, periods, dashboard, laporan }: {
  periode: PeriodeRuangKerja; periods: { id: string; label: string }[]; dashboard: Dashboard; laporan: Baris[];
}) {
  const params = useSearchParams();
  const jadwal = params.get("langkah") === "jadwal";
  const pengingat = params.get("langkah") === "pengingat";
  const contoh = dashboard.contoh;
  const final = periode.fase === "FINAL";

  return <div className={halaman}>
    <div className={jadwal || pengingat ? wadahForm : "space-y-6"}>
      <KepalaPeriode periode={periode} periods={periods} contoh={contoh} />
      {pengingat ? <PengingatPengisian key={periode.id} periode={periode} dashboard={dashboard} /> : jadwal ? <LangkahJadwal key={`${periode.id}-${periode.updated_at}`} periode={periode} contoh={contoh} /> : <>
        <LaporanEkonomi key={periode.id} rows={laporan} contoh={contoh} final={final} />
      </>}
    </div>
  </div>;
}

const labelKontak: Record<Kontak, string> = {
  TELEGRAM: "Telegram terhubung",
  BELUM_TELEGRAM: "Belum terhubung",
  BELUM_AKUN: "Belum memiliki akun",
};

/** Sisi admin saja. Tidak memanggil bot, cron, atau endpoint pengiriman. */
function PengingatPengisian({ periode, dashboard }: { periode: PeriodeRuangKerja; dashboard: Dashboard }) {
  const perpanjangan = useSearchParams().get("jenis") === "perpanjangan";
  const [cari, setCari] = useState("");
  const [kontak, setKontak] = useState("semua");
  const [hal, setHal] = useState(1);
  const [ukuran, setUkuran] = useState(10);
  const [pratinjau, setPratinjau] = useState(false);
  const daftar = dashboard.belum.daftar;
  const terhubung = daftar.filter((m) => m.kontak === "TELEGRAM").length;
  const tanpaTelegram = daftar.filter((m) => m.kontak === "BELUM_TELEGRAM").length;
  const tanpaAkun = daftar.filter((m) => m.kontak === "BELUM_AKUN").length;
  const hasil = daftar.filter((m) => (kontak === "semua" || m.kontak === kontak)
    && `${m.nama} ${m.nim} ${m.prodi}`.toLocaleLowerCase("id-ID").includes(cari.trim().toLocaleLowerCase("id-ID")));
  const jumlahHalaman = Math.max(1, Math.ceil(hasil.length / ukuran));
  const aktif = Math.min(hal, jumlahHalaman);
  const mulai = (aktif - 1) * ukuran;
  const berlangsung = periode.fase === "BERLANGSUNG";
  const alasan = periode.fase === "FINAL" ? "Periode sudah final. Daftar dan riwayat hanya dapat dilihat."
    : periode.fase === "DITUTUP" ? "Pengisian sudah ditutup. Pengingat pengisian tidak tersedia."
    : periode.fase === "TENGGAT_LEWAT" ? "Batas pengisian sudah lewat. Periksa jadwal sebelum menyiapkan pengingat."
    : periode.fase === "NONAKTIF" ? "Periode sedang nonaktif."
    : periode.fase === "BELUM_DIBUKA" ? "Pengisian belum dimulai."
    : "Pratinjau tersedia. Pengiriman manual belum diaktifkan.";
  const pesan = perpanjangan
    ? `Pemberitahuan perpanjangan Monev\n\nWaktu pengisian laporan ekonomi untuk ${periode.label} diperpanjang.\nBatas pengisian terbaru: ${tanggalWib(periode.deadline)} WIB.\n\nJika belum mengirim laporan, buka SAKTI, pilih Monev, lalu lengkapi dan kirim laporan Anda.`
    : `Pengingat pengisian Monev\n\nMohon lengkapi laporan ekonomi untuk ${periode.label}.\nBatas pengisian: ${tanggalWib(periode.deadline)} WIB.\n\nBuka SAKTI, pilih Monev, lalu lengkapi dan kirim laporan Anda.`;
  const riwayat = [...dashboard.belum.riwayatPengingat].sort((a, b) => b.waktu.localeCompare(a.waktu));
  const instruksiAktivasi = "Cara menghubungkan Telegram ke SAKTI:\n1. Masuk ke akun SAKTI Anda.\n2. Buka menu Monev dan bagian Pengingat Telegram.\n3. Pilih opsi untuk menghubungkan Telegram, lalu ikuti petunjuk aktivasi di layar.\n4. Di bot Telegram, tekan Start atau kirim kode aktivasi dari akun Anda sendiri.\n5. Kembali ke SAKTI dan periksa status koneksi Telegram.\n\nJika akun SAKTI belum tersedia atau data penerima belum terhubung ke akun, hubungi admin untuk pemeriksaan data terlebih dahulu. Jangan membagikan kode aktivasi pribadi.";
  async function salin(teks: string, pesanSukses: string) {
    try {
      await navigator.clipboard.writeText(teks);
      toast.success(pesanSukses);
    } catch {
      toast.error("Gagal menyalin. Izinkan akses clipboard pada browser, lalu coba lagi.");
    }
  }
  function salinDaftar() {
    // Format tab mengikuti daftar dashboard; jaga isi sel saat ditempel ke spreadsheet.
    const sel = (value: string) => {
      const bersih = value.replace(/[\t\r\n]+/g, " ");
      return /^[\s]*[=+@-]/.test(bersih) ? `'${bersih}` : bersih;
    };
    const teks = [
      ["NIM", "Nama", "Program studi", "Email", "Status Telegram", "Tindak lanjut"],
      ...hasil.map((m) => [
        `'${m.nim}`, m.nama, m.prodi, m.email ?? "", labelKontak[m.kontak],
        m.kontak === "BELUM_AKUN" ? "Periksa data penerima dan keterkaitan akun SAKTI."
          : m.kontak === "BELUM_TELEGRAM" ? "Hubungi melalui kanal yang tersedia dan sampaikan instruksi aktivasi Telegram."
          : "Siapkan pengingat pengisian setelah layanan pengiriman tersedia.",
      ]),
    ].map((baris) => baris.map(sel).join("\t")).join("\n");
    void salin(teks, `${hasil.length} mahasiswa tersalin. Tempel ke spreadsheet untuk tindak lanjut.`);
  }

  return <div className="space-y-6">
    <section className={`${panel} p-5`} aria-labelledby="ringkasan-pengingat">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 id="ringkasan-pengingat" className="text-[16px] font-semibold text-[#000352]">Mahasiswa belum mengisi</h2>
          <p className="mt-2 text-[14px] text-[#334155]"><strong className="font-semibold">{daftar.length.toLocaleString("id-ID")}</strong> dari {dashboard.progres.wajibIsi.toLocaleString("id-ID")} mahasiswa wajib mengisi</p>
        </div>
        <button type="button" disabled={!berlangsung || !terhubung} onClick={() => setPratinjau(true)} className={`${utama} max-w-full`}>{perpanjangan ? "Siapkan pemberitahuan perpanjangan" : "Siapkan pengingat"}</button>
      </div>
      <dl className="mt-5 grid gap-4 border-t border-[#E2E8F0] pt-4 sm:grid-cols-3">
        {[{ label: "Telegram terhubung", value: terhubung }, { label: "Belum terhubung", value: tanpaTelegram }, { label: "Belum memiliki akun", value: tanpaAkun }].map((item) => <div key={item.label}><dt className="text-[12px] text-[#64748B]">{item.label}</dt><dd className="mt-1 text-[18px] font-semibold tabular-nums text-[#000352]">{item.value.toLocaleString("id-ID")}</dd></div>)}
      </dl>
      <p className="mt-4 text-[12px] leading-5 text-[#64748B]">{alasan}{berlangsung && !terhubung && " Belum ada penerima yang terhubung ke Telegram."}</p>
    </section>

    <section className={`${panel} overflow-hidden`} aria-label="Daftar mahasiswa belum mengisi">
      <div className="grid gap-4 border-b border-[#E2E8F0] p-5 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="min-w-0 text-[12px] text-[#64748B]">Cari mahasiswa<span className="relative mt-1.5 block"><Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-3.5 text-[#94A3B8]" /><input value={cari} onChange={(e) => { setCari(e.target.value); setHal(1); }} placeholder="Nama, NIM, atau program studi" className={`${kolom} !pl-9 !text-base sm:!text-sm`} /></span></label>
        <label className="text-[12px] text-[#64748B]">Status Telegram<select aria-label="Status Telegram" value={kontak} onChange={(e) => { setKontak(e.target.value); setHal(1); }} className={`${kolom} mt-1.5 !text-base sm:!text-sm`}><option value="semua">Semua status</option>{Object.entries(labelKontak).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <label className="flex items-center gap-2 text-[12px] text-[#64748B]">Tampilkan<select aria-label="Jumlah mahasiswa per halaman" value={ukuran} onChange={(e) => { setUkuran(Number(e.target.value)); setHal(1); }} className={`${kolom} !w-auto`}>{[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}</select>mahasiswa</label>
        <div className="flex max-w-full flex-col items-start gap-2 sm:items-end">
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!hasil.length} onClick={salinDaftar} className={tombol}>Salin daftar tindak lanjut</button>
            {hasil.some((m) => m.kontak === "BELUM_TELEGRAM")}
          </div>
          
        </div>
      </div>
      {kontak === "BELUM_AKUN" && <p className="px-5 pb-4 text-[12px] leading-5 text-[#64748B]">Akun belum terhubung ke data penerima. Periksa NIM dan keterkaitan akun sebelum meminta mahasiswa mendaftar ulang.</p>}
      {kontak === "BELUM_TELEGRAM" && <p className="px-5 pb-4 text-[12px] leading-5 text-[#64748B]">Sampaikan instruksi aktivasi melalui email yang tersedia atau kanal lain. Mahasiswa perlu menghubungkan Telegram dari akun SAKTI mereka sendiri.</p>}
      <div role="region" aria-label="Tabel mahasiswa belum mengisi, geser untuk kolom lainnya" tabIndex={0} className="overflow-x-auto border-t border-[#E2E8F0]">
        <table className="w-full min-w-[760px] text-left text-[13px]">
          <caption className="sr-only">Mahasiswa wajib mengisi yang belum mengirim laporan pada periode ini.</caption>
          <thead className="border-b border-[#E2E8F0] bg-[#FAFBFD] text-[12px] text-[#64748B]"><tr>{["No", "NIM", "Nama", "Prodi", "Status Telegram"].map((h) => <th key={h} scope="col" className="px-5 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-[#EDF0F4]">{hasil.slice(mulai, mulai + ukuran).map((m, i) => <tr key={m.nim} className="align-top hover:bg-[#FAFBFD]">
            <td className="px-5 py-5 tabular-nums text-[#64748B]">{mulai + i + 1}</td><td className="whitespace-nowrap px-5 py-5 tabular-nums">{m.nim}</td><td className="px-5 py-5 font-medium">{m.nama}</td><td className="px-5 py-5 text-[#64748B]">{m.prodi}</td>
            <td className="px-5 py-5"><span className={`inline-flex whitespace-nowrap rounded px-2.5 py-1 text-[12px] font-medium leading-4 ${m.kontak === "TELEGRAM" ? "bg-[#15803D] text-white" : "bg-[#F1F5F9] text-[#475569]"}`}>{labelKontak[m.kontak]}</span></td>
          </tr>)}{!hasil.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#64748B]">{daftar.length ? "Tidak ada mahasiswa yang sesuai dengan pencarian atau filter." : dashboard.progres.wajibIsi ? "Semua mahasiswa wajib mengisi sudah mengirim laporan." : "Belum ada mahasiswa wajib mengisi pada periode ini."}</td></tr>}</tbody>
        </table>
      </div>
      <nav aria-label="Halaman mahasiswa belum mengisi" className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] px-5 py-4"><button aria-label="Halaman sebelumnya" disabled={aktif === 1} onClick={() => setHal(aktif - 1)} className={tombol}><ChevronLeft size={15} aria-hidden /></button><span className="text-[12px] text-[#64748B]">{aktif} / {jumlahHalaman}</span><button aria-label="Halaman berikutnya" disabled={aktif === jumlahHalaman} onClick={() => setHal(aktif + 1)} className={tombol}><ChevronRight size={15} aria-hidden /></button></nav>
    </section>

    <section className={`${panel} p-5`} aria-labelledby="jadwal-pengingat">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="jadwal-pengingat" className="text-[16px] font-semibold text-[#000352]">Pengingat otomatis</h2><p className="mt-2 text-[12px] leading-5 text-[#64748B]">Jadwal mengikuti batas pengisian periode. Pelaksanaan pengiriman belum diverifikasi.</p></div><Link href={urlPeriode(periode.id, "jadwal", dashboard.contoh)} className={tombol}>Lihat jadwal periode</Link></div>
      <details className="mt-4 border-t border-[#E2E8F0] pt-3"><summary className="cursor-pointer text-[13px] font-medium text-[#000352]">Lihat jadwal pengingat</summary><dl className="mt-2 divide-y divide-[#EDF0F4]">{HARI_PENGINGAT.map((hari) => <div key={hari} className="flex flex-wrap justify-between gap-2 py-3 text-[13px]"><dt>{hari} hari sebelum batas pengisian</dt><dd className="text-[#64748B]">{new Date(new Date(periode.deadline).getTime() - hari * 86400000).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })}</dd></div>)}</dl></details>
    </section>

    <details className={panel}><summary className="cursor-pointer px-5 py-4 text-[14px] font-medium text-[#000352]">Riwayat pengiriman</summary><div className="border-t border-[#E2E8F0] px-5">
      {riwayat.length ? <ul className="divide-y divide-[#EDF0F4]">{riwayat.map((r, i) => <li key={`${r.waktu}-${r.hari}-${i}`} className="flex flex-wrap justify-between gap-2 py-4 text-[13px]"><div><p>Pengingat H-{r.hari}</p><p className="mt-1 text-[12px] text-[#64748B]">{tanggalWib(r.waktu)} WIB</p></div><p className="text-[#64748B]">{r.terkirim} terkirim · {r.gagal} gagal</p></li>)}</ul> : <p className="py-5 text-[13px] text-[#64748B]">Belum ada riwayat pengingat yang tercatat.</p>}
    </div></details>

    <Dialog open={pratinjau} onOpenChange={setPratinjau}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white sm:max-w-xl"><DialogTitle>{perpanjangan ? "Siapkan pemberitahuan perpanjangan" : "Siapkan pengingat Telegram"}</DialogTitle><DialogDescription>Sasaran: seluruh mahasiswa yang belum mengisi dan terhubung ke Telegram pada periode ini. Filter tabel tidak mengubah sasaran pesan.</DialogDescription>
        <dl className="space-y-2 text-[13px]"><div className="flex justify-between gap-3"><dt>Telegram terhubung</dt><dd>{terhubung} mahasiswa</dd></div><div className="flex justify-between gap-3 text-[#64748B]"><dt>Belum dapat menerima</dt><dd>{tanpaTelegram + tanpaAkun} mahasiswa</dd></div></dl>
        <h3 className="text-[13px] font-medium text-[#000352]">Pratinjau pesan</h3>
        <p className="whitespace-pre-wrap rounded-lg border border-[#E2E8F0] bg-[#FAFBFD] p-4 text-[13px] leading-6 text-[#334155]">{pesan}</p>
        <p className="text-[12px] leading-5 text-[#64748B]">Pesan ini belum dikirim. Pengiriman manual akan tersedia setelah integrasi diaktifkan.</p>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setPratinjau(false)} className={tombol}>Tutup</button><button type="button" disabled className={utama}>Kirim pengingat</button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
