/**
 * lib/dashboard-monev/data.ts
 * Data tab Monev di dashboard admin (PRD .kiro/specs/dashboard-monev/prd.md).
 *
 * `getMonevDashboard` hanya mengambil baris dari database; semua perhitungan ada
 * di `hitungDashboard` (fungsi murni) yang juga dipakai data contoh, sehingga
 * data contoh selalu mengikuti aturan yang sama dengan data asli.
 *
 * Aturan evaluasi (nilai efektif, tanda, wajib isi, fase) ada di
 * `lib/monev/evaluasi.ts` (PRD .kiro/specs/monev-alur-terpadu/prd.md §5).
 * Angka ekonomi memakai nilai efektif: koreksi admin bila ada, selain itu
 * isian mahasiswa. Wajib isi dihitung dari data saat ini (tanpa snapshot);
 * status cuti belum tercatat di sistem.
 */
import { prisma } from "@/lib/db";
import { daysLeftWIB } from "@/lib/monev-schedule";
import {
  fasePeriode, kkBerbeda, kkTakTerbaca, nilaiEfektif, pekerjaanLaporanDitandai, perluDitinjau,
  statusWajibIsi, sudahDipindai, tandaLaporan, type FasePeriode, type LaporanEvaluasi,
} from "@/lib/monev/evaluasi";
import {
  BATAS_SEMESTER, HARI_PENGINGAT, kontak, naikJauh, pekerjaanDitandai, rupiahSingkat,
  semesterKe, statusEkonomi, teksPekerjaanDitandai, type Kontak, type StatusEkonomi,
} from "./rules";

export type Fase = FasePeriode;
export type Nada = "bad" | "alert" | "warn" | "info";

export interface PeriodeOpsi { id: string; label: string; fase: Fase }
export interface Mahasiswa { nim: string; nama: string; prodi: string }
/** Satu mahasiswa dalam suatu kelompok, dengan alasan singkat mengapa ia masuk kelompok itu. */
export interface Kasus extends Mahasiswa { detail: string }
export interface Kelompok { id: string; label: string; nada: Nada; kasus: Kasus[] }
export interface BelumMengisi extends Mahasiswa { kontak: Kontak; email: string | null }

export interface BarisPerhatian extends Mahasiswa {
  tanda: { label: string; nada: Nada }[];
  penghasilan: number; anggota: number; anggotaKk: number | null;
}

export interface MonevDashboard {
  /** true bila memakai data contoh (bukan data asli). */
  contoh: boolean;
  periods: PeriodeOpsi[];
  selected: null | {
    id: string; label: string; fase: Fase; deadline: string; waktuMulai: string | null; sisaHari: number;
  };
  progres: {
    wajibIsi: number; terkirim: number; dipindai: number; belumDipindai: number;
    /** Laporan yang belum ditinjau dan belum dipindai atau bertanda (PRD alur terpadu §5.4). */
    perluDitinjau: number; ditinjau: number;
    tidakDihitung: { lewatSemester: number; mengundurkanDiri: number };
    semesterTerakhir: number;
  };
  belum: {
    daftar: BelumMengisi[];
    perProdi: { nama: string; sudah: number; wajib: number }[];
    pengingatBerikut: { hari: number; tanggal: string; penerima: number } | null;
    riwayatPengingat: { hari: number; waktu: string; terkirim: number; gagal: number }[];
  };
  pemeriksaan: {
    dipindai: number; belumDipindai: number; tanpaTanda: number;
    kelompok: Kelompok[];
    status: Record<StatusEkonomi, number>;
  };
  perubahan: {
    periodeLalu: null | { pembanding: string; dibandingkan: number; kelompok: Kelompok[] };
    seleksi: { tercakup: number; total: number; kelompok: Kelompok[] };
  };
  perhatian: BarisPerhatian[];
}

/* ── Masukan mentah ─────────────────────────────────────────── */

export interface PeriodeRow {
  id: string; label: string; deadline: Date; waktu_mulai: Date | null; created_at: Date;
  is_active: boolean; tahun_akademik: number; semester: string;
  ditutup_at: Date | null; difinalisasi_at: Date | null;
}
export interface LaporanRow extends LaporanEvaluasi {
  id: string; user_id: string; periode_monev_id: string; waktu_lapor: Date | null;
}
export interface PenerimaRow {
  userId: string | null; nim: string; nama: string; angkatan: number; telegramId: bigint | number | null;
  prodi: string; email: string | null;
}
export interface MundurRow { user_id: string; diputuskan_at: Date | null; updated_at: Date }
export interface LogRow { periode_monev_id: string; triggerDay: number; sentAt: Date; totalSent: number; totalFailed: number }
/** Kondisi ekonomi saat seleksi, dari hasil wawancara atau data pendaftaran. */
export interface AcuanSeleksi { penghasilan: number; anggota: number; ditandai: boolean; sumber: "wawancara" | "pendaftaran" }

export interface Masukan {
  periode: PeriodeRow[]; laporan: LaporanRow[]; penerima: PenerimaRow[];
  mundur: MundurRow[]; log: LogRow[]; acuan: Map<string, AcuanSeleksi>;
}

/* ── Helper laporan ─────────────────────────────────────────── */

const total = (l: LaporanRow) => nilaiEfektif(l).penghasilan;
const anggota = (l: LaporanRow) => nilaiEfektif(l).anggota;
const ditandai = pekerjaanLaporanDitandai;
const perOrang = (penghasilan: number, n: number) => (n > 0 ? `${rupiahSingkat(penghasilan / n)}/orang` : "anggota kosong");
const ringkasEkonomi = (penghasilan: number, n: number) => `${rupiahSingkat(penghasilan)} · ${n} orang · ${perOrang(penghasilan, n)}`;
const fase = fasePeriode;

/** Urutan keparahan untuk mengurutkan tanda dan baris. */
const bobot: Record<Nada, number> = { bad: 0, alert: 1, warn: 2, info: 3 };

/* ── Perhitungan ────────────────────────────────────────────── */

export function hitungDashboard(m: Masukan, periodeId: string | undefined, now: Date, contoh = false): MonevDashboard {
  const periodeRows = [...m.periode].sort((a, b) => a.deadline.getTime() - b.deadline.getTime() || a.created_at.getTime() - b.created_at.getTime());
  const laporanPerPeriode = new Map<string, LaporanRow[]>();
  for (const l of m.laporan) {
    const list = laporanPerPeriode.get(l.periode_monev_id) ?? [];
    list.push(l);
    laporanPerPeriode.set(l.periode_monev_id, list);
  }
  const jumlahLaporan = (id: string) => laporanPerPeriode.get(id)?.length ?? 0;

  const periods: PeriodeOpsi[] = periodeRows.map((p) => ({ id: p.id, label: p.label, fase: fase(p, jumlahLaporan(p.id), now) }));
  const bawaan = periods.find((p) => p.fase === "BERLANGSUNG")
    ?? [...periods].reverse().find((p) => p.fase === "TENGGAT_LEWAT")
    ?? [...periods].reverse().find((p) => p.fase === "DITUTUP")
    ?? periods[periods.length - 1];
  const terpilih = periodeRows.find((p) => p.id === periodeId) ?? periodeRows.find((p) => p.id === bawaan?.id);
  if (!terpilih) return { ...kosong(), contoh, periods };

  const indexTerpilih = periodeRows.indexOf(terpilih);
  const sebelumnya = indexTerpilih > 0 ? periodeRows[indexTerpilih - 1] : null;
  const laporan = laporanPerPeriode.get(terpilih.id) ?? [];
  const laporanLalu = new Map((sebelumnya ? laporanPerPeriode.get(sebelumnya.id) ?? [] : []).map((l) => [l.user_id, l]));
  const laporanPerUser = new Map(laporan.map((l) => [l.user_id, l]));
  const fasePeriode = fase(terpilih, laporan.length, now);

  // ── Wajib isi ──────────────────────────────────────────────
  const mundurAt = new Map(m.mundur.map((x) => [x.user_id, x.diputuskan_at ?? x.updated_at]));
  let lewatSemester = 0, mengundurkanDiri = 0, semesterTerakhir = 0;
  const wajib: { p: PenerimaRow; kontak: Kontak; laporan: LaporanRow | null }[] = [];
  for (const p of m.penerima) {
    const status = statusWajibIsi(terpilih, p.angkatan, p.userId ? mundurAt.get(p.userId) ?? null : null);
    if (status === "LEWAT_SEMESTER") { lewatSemester++; continue; }
    if (status === "MENGUNDURKAN_DIRI") { mengundurkanDiri++; continue; }
    if (semesterKe(terpilih.tahun_akademik, terpilih.semester, p.angkatan) === BATAS_SEMESTER) semesterTerakhir++;
    wajib.push({ p, kontak: kontak(p.userId, p.telegramId), laporan: p.userId ? laporanPerUser.get(p.userId) ?? null : null });
  }
  const sudah = wajib.filter((w) => w.laporan);
  const belum = wajib.filter((w) => !w.laporan);
  const mhs = (p: PenerimaRow): Mahasiswa => ({ nim: p.nim, nama: p.nama, prodi: p.prodi });
  const penerimaPerUser = new Map(wajib.flatMap((w) => (w.p.userId ? [[w.p.userId, w.p] as const] : [])));

  // ── Per prodi ──────────────────────────────────────────────
  const perProdi = new Map<string, { sudah: number; wajib: number }>();
  for (const w of wajib) {
    const row = perProdi.get(w.p.prodi) ?? { sudah: 0, wajib: 0 };
    row.wajib++;
    if (w.laporan) row.sudah++;
    perProdi.set(w.p.prodi, row);
  }

  // ── Pengingat ─────────────────────────────────────────────
  const sisaHari = daysLeftWIB(terpilih.deadline, now);
  const logs = m.log.filter((x) => x.periode_monev_id === terpilih.id).sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
  const berikut = fasePeriode === "BERLANGSUNG" ? HARI_PENGINGAT.filter((h) => h < sisaHari).sort((a, b) => b - a)[0] : undefined;

  // ── Tanda per mahasiswa ───────────────────────────────────
  const tandaPerUser = new Map<string, Map<string, Nada>>();
  const tandai = (userId: string, label: string, nada: Nada) => {
    const map = tandaPerUser.get(userId) ?? new Map<string, Nada>();
    map.set(label, nada);
    tandaPerUser.set(userId, map);
  };
  const kelompok = (id: string, label: string, nada: Nada): Kelompok => ({ id, label, nada, kasus: [] });
  const tambah = (k: Kelompok, l: LaporanRow, detail: string, tanda?: string) => {
    const p = penerimaPerUser.get(l.user_id);
    if (!p) return;
    k.kasus.push({ ...mhs(p), detail });
    tandai(l.user_id, tanda ?? k.label, k.nada);
  };

  // ── Hasil pemeriksaan ─────────────────────────────────────
  const status: Record<StatusEkonomi, number> = { MEMENUHI: 0, MEMENUHI_PER_KAPITA: 0, TIDAK_MEMENUHI: 0 };
  const kTidak = kelompok("tidak-memenuhi", "Tidak memenuhi syarat", "bad");
  const kKk = kelompok("kk-berbeda", "Lolos per kapita, KK berbeda", "alert");
  const kDok = kelompok("dokumen", "Berbeda dari dokumen", "warn");
  const kKerja = kelompok("pekerjaan", "Pekerjaan orang tua ditandai", "warn");
  let tanpaTanda = 0, jumlahDipindai = 0, jumlahPerluDitinjau = 0, jumlahDitinjau = 0;
  for (const l of laporan) {
    if (!penerimaPerUser.has(l.user_id)) continue;
    const t = total(l), n = anggota(l), s = statusEkonomi(t, n);
    status[s]++;
    if (perluDitinjau(l)) jumlahPerluDitinjau++;
    if (l.ditinjau_at) jumlahDitinjau++;
    if (!sudahDipindai(l)) continue;
    jumlahDipindai++;
    const tanda = tandaLaporan(l);
    if (tanda.length === 0) tanpaTanda++;
    if (tanda.includes("tidak-memenuhi")) tambah(kTidak, l, ringkasEkonomi(t, n));
    if (tanda.includes("kk-berbeda")) {
      const kk = l.hasil_deteksi_yolo!;
      tambah(kKk, l, `Isian ${l.jumlah_tanggungan ?? 0} orang, KK ${kk} orang · ${perOrang(t, n)} → ${perOrang(t, kk)}`);
    }
    if (tanda.includes("dokumen")) {
      tambah(kDok, l, kkTakTerbaca(l) ? "KK tidak terbaca" : kkBerbeda(l) ? `Isian ${l.jumlah_tanggungan ?? 0} orang, KK ${l.hasil_deteksi_yolo} orang` : "Nominal penghasilan berbeda dari dokumen");
    }
    if (tanda.includes("pekerjaan")) {
      const detail = [
        pekerjaanDitandai(l.pekerjaan_ayah) && `Ayah: ${l.pekerjaan_ayah}`,
        pekerjaanDitandai(l.pekerjaan_ibu) && `Ibu: ${l.pekerjaan_ibu}`,
      ].filter(Boolean).join(" · ");
      tambah(kKerja, l, `${detail} · ${rupiahSingkat(t)}`);
    }
  }

  // ── Perubahan dari periode lalu ───────────────────────────
  let periodeLalu: MonevDashboard["perubahan"]["periodeLalu"] = null;
  if (sebelumnya) {
    const kKini = kelompok("kini-tidak", "Kini tidak memenuhi syarat", "bad");
    const kDua = kelompok("dua-periode", "Tidak memenuhi 2 periode berturut-turut", "bad");
    const kNaik = kelompok("naik", "Penghasilan naik lebih dari 50%", "info");
    const kKurang = kelompok("tanggungan", "Tanggungan berkurang", "info");
    const kKerjaBaru = kelompok("kerja-baru", "Pekerjaan kini ditandai", "warn");
    let dibandingkan = 0;
    for (const l of laporan) {
      const lalu = laporanLalu.get(l.user_id);
      if (!lalu || !penerimaPerUser.has(l.user_id)) continue;
      dibandingkan++;
      const tK = total(l), nK = anggota(l), tL = total(lalu), nL = anggota(lalu);
      const sK = statusEkonomi(tK, nK), sL = statusEkonomi(tL, nL);
      const geser = `${rupiahSingkat(tL)}/${nL} → ${rupiahSingkat(tK)}/${nK} orang`;
      if (sK === "TIDAK_MEMENUHI" && sL !== "TIDAK_MEMENUHI") tambah(kKini, l, geser);
      if (sK === "TIDAK_MEMENUHI" && sL === "TIDAK_MEMENUHI") tambah(kDua, l, geser);
      if (naikJauh(tL, tK)) tambah(kNaik, l, `${rupiahSingkat(tL)} → ${rupiahSingkat(tK)} (+${Math.round((tK - tL) / tL * 100)}%)`);
      if (nK < nL) tambah(kKurang, l, `${nL} → ${nK} orang · ${perOrang(tK, nK)}`);
      if (ditandai(l) && !ditandai(lalu)) tambah(kKerjaBaru, l, `${lalu.pekerjaan_ayah ?? "-"} / ${lalu.pekerjaan_ibu ?? "-"} → ${l.pekerjaan_ayah ?? "-"} / ${l.pekerjaan_ibu ?? "-"}`);
    }
    periodeLalu = { pembanding: sebelumnya.label, dibandingkan, kelompok: [kKini, kDua, kNaik, kKurang, kKerjaBaru] };
  }

  // ── Dibandingkan data seleksi ─────────────────────────────
  const sTidak = kelompok("seleksi-tidak", "Kini tidak memenuhi syarat", "bad");
  const sNaik = kelompok("seleksi-naik", "Penghasilan naik lebih dari 50%", "info");
  const sAnggota = kelompok("seleksi-anggota", "Jumlah anggota keluarga berbeda", "info");
  const sKerja = kelompok("seleksi-kerja", "Pekerjaan kini ditandai", "warn");
  let tercakup = 0;
  for (const w of wajib) {
    const a = m.acuan.get(w.p.nim);
    if (!a) continue;
    tercakup++;
    const l = w.laporan;
    if (!l) continue;
    const t = total(l), n = anggota(l);
    const label = `saat seleksi (${a.sumber})`;
    if (statusEkonomi(t, n) === "TIDAK_MEMENUHI" && statusEkonomi(a.penghasilan, a.anggota) !== "TIDAK_MEMENUHI") {
      tambah(sTidak, l, `${rupiahSingkat(a.penghasilan)}/${a.anggota} ${label} → ${rupiahSingkat(t)}/${n} orang`, "Berbeda dari data seleksi");
    }
    if (naikJauh(a.penghasilan, t)) tambah(sNaik, l, `${rupiahSingkat(a.penghasilan)} ${label} → ${rupiahSingkat(t)}`, "Berbeda dari data seleksi");
    if (a.anggota > 0 && a.anggota !== n) tambah(sAnggota, l, `${a.anggota} orang ${label} → ${n} orang`, "Berbeda dari data seleksi");
    if (ditandai(l) && !a.ditandai) tambah(sKerja, l, `Pekerjaan kini: ${l.pekerjaan_ayah ?? "-"} / ${l.pekerjaan_ibu ?? "-"}`, "Berbeda dari data seleksi");
  }
  // Sinyal "berbeda dari seleksi" hanya informasi; bobotnya diturunkan ke info
  for (const map of tandaPerUser.values()) if (map.has("Berbeda dari data seleksi")) map.set("Berbeda dari data seleksi", "info");

  // ── Perlu ditinjau ────────────────────────────────────────
  // Masuk bila ada tanda merah/oranye (walau satu), atau dua tanda lain atau lebih.
  const perhatian: BarisPerhatian[] = [];
  for (const w of sudah) {
    const l = w.laporan!;
    const map = tandaPerUser.get(l.user_id);
    if (!map) continue;
    const tanda = [...map].map(([label, nada]) => ({ label, nada })).sort((a, b) => bobot[a.nada] - bobot[b.nada]);
    const serius = tanda.some((t) => t.nada === "bad" || t.nada === "alert");
    if (!serius && tanda.length < 2) continue;
    perhatian.push({ ...mhs(w.p), tanda, penghasilan: total(l), anggota: anggota(l), anggotaKk: kkBerbeda(l) ? l.hasil_deteksi_yolo : null });
  }
  perhatian.sort((a, b) => bobot[a.tanda[0].nada] - bobot[b.tanda[0].nada] || b.tanda.length - a.tanda.length || b.penghasilan - a.penghasilan);

  const belumDipindai = laporan.filter((l) => penerimaPerUser.has(l.user_id) && !sudahDipindai(l)).length;
  return {
    contoh, periods,
    selected: {
      id: terpilih.id, label: terpilih.label, fase: fasePeriode, deadline: terpilih.deadline.toISOString(),
      waktuMulai: terpilih.waktu_mulai?.toISOString() ?? null, sisaHari,
    },
    progres: {
      wajibIsi: wajib.length, terkirim: sudah.length, dipindai: jumlahDipindai, belumDipindai,
      perluDitinjau: jumlahPerluDitinjau, ditinjau: jumlahDitinjau,
      tidakDihitung: { lewatSemester, mengundurkanDiri }, semesterTerakhir,
    },
    belum: {
      daftar: belum.map((w) => ({ ...mhs(w.p), kontak: w.kontak, email: w.p.email })).sort((a, b) => a.prodi.localeCompare(b.prodi) || a.nama.localeCompare(b.nama)),
      perProdi: [...perProdi].map(([nama, r]) => ({ nama, ...r })).sort((a, b) => a.sudah / a.wajib - b.sudah / b.wajib),
      pengingatBerikut: berikut === undefined ? null : {
        hari: berikut, tanggal: new Date(terpilih.deadline.getTime() - berikut * 86_400_000).toISOString(),
        penerima: belum.filter((w) => w.kontak === "TELEGRAM").length,
      },
      riwayatPengingat: logs.map((log) => ({ hari: log.triggerDay, waktu: log.sentAt.toISOString(), terkirim: log.totalSent, gagal: log.totalFailed })),
    },
    pemeriksaan: { dipindai: jumlahDipindai, belumDipindai, tanpaTanda, kelompok: [kTidak, kKk, kDok, kKerja], status },
    perubahan: { periodeLalu, seleksi: { tercakup, total: wajib.length, kelompok: [sTidak, sNaik, sAnggota, sKerja] } },
    perhatian,
  };
}

function kosong(): Omit<MonevDashboard, "periods" | "contoh"> {
  return {
    selected: null,
    progres: { wajibIsi: 0, terkirim: 0, dipindai: 0, belumDipindai: 0, perluDitinjau: 0, ditinjau: 0, tidakDihitung: { lewatSemester: 0, mengundurkanDiri: 0 }, semesterTerakhir: 0 },
    belum: { daftar: [], perProdi: [], pengingatBerikut: null, riwayatPengingat: [] },
    pemeriksaan: { dipindai: 0, belumDipindai: 0, tanpaTanda: 0, kelompok: [], status: { MEMENUHI: 0, MEMENUHI_PER_KAPITA: 0, TIDAK_MEMENUHI: 0 } },
    perubahan: { periodeLalu: null, seleksi: { tercakup: 0, total: 0, kelompok: [] } },
    perhatian: [],
  };
}

/* ── Pengambilan data asli ──────────────────────────────────── */

export async function getMonevDashboard(periodeId?: string, now: Date = new Date()): Promise<MonevDashboard> {
  const [periode, laporanRows, penerimaRows, mundur, log] = await Promise.all([
    prisma.periode_monev.findMany({
      select: {
        id: true, label: true, deadline: true, waktu_mulai: true, created_at: true, is_active: true, tahun_akademik: true, semester: true,
        ditutup_at: true, difinalisasi_at: true,
      },
    }),
    prisma.pengisian_monev.findMany({
      select: {
        id: true, user_id: true, periode_monev_id: true, pekerjaan_ayah: true, pekerjaan_ibu: true,
        penghasilan_ayah: true, penghasilan_ibu: true, penghasilan_lain: true, jumlah_tanggungan: true,
        hasil_deteksi_yolo: true, status_anomali: true, hasil_scan_ai: true, waktu_lapor: true,
        penghasilan_final: true, anggota_final: true, ditinjau_at: true,
        alasan_penangguhan_monev: { select: { kode: true } },
      },
    }),
    prisma.penerimaKipk.findMany({
      select: { userId: true, nim: true, nama: true, angkatan: true, telegramId: true, prodi: { select: { nama_prodi: true } }, user: { select: { email: true } } },
    }),
    prisma.pengunduran_diri.findMany({ where: { status: "DITERIMA" }, select: { user_id: true, diputuskan_at: true, updated_at: true } }),
    prisma.log_notifikasi.findMany({ select: { periode_monev_id: true, triggerDay: true, sentAt: true, totalSent: true, totalFailed: true } }),
  ]);
  const laporan: LaporanRow[] = laporanRows.map(({ alasan_penangguhan_monev, ...l }) => ({
    ...l, alasan_manual: alasan_penangguhan_monev.map((a) => a.kode),
  }));
  const penerima: PenerimaRow[] = penerimaRows.map((p) => ({
    userId: p.userId, nim: p.nim, nama: p.nama, angkatan: p.angkatan, telegramId: p.telegramId,
    prodi: p.prodi?.nama_prodi ?? "Tanpa prodi", email: p.user?.email ?? null,
  }));

  const nim = penerima.map((p) => p.nim).filter(Boolean);
  const kandidat = nim.length ? await prisma.kandidat.findMany({
    where: { nim_resmi: { in: nim } },
    select: {
      nim_resmi: true, penghasilan_ayah: true, penghasilan_ibu: true, jumlah_tanggungan: true, pekerjaan_ayah: true, pekerjaan_ibu: true,
      hasil_wawancara: {
        where: { is_draft: false }, orderBy: { updated_at: "desc" }, take: 1,
        select: {
          ket_penghasilan_ayah: true, ket_penghasilan_ibu: true, penghasilan_lain: true, ket_pekerjaan_ayah: true, ket_pekerjaan_ibu: true,
          detail_ekonomi_wawancara: { take: 1, select: { jml_tanggungan_sebenarnya: true } },
        },
      },
    },
  }) : [];
  const acuan = new Map<string, AcuanSeleksi>(kandidat.map((k) => {
    const w = k.hasil_wawancara[0];
    return [k.nim_resmi!, w ? {
      penghasilan: (w.ket_penghasilan_ayah ?? 0) + (w.ket_penghasilan_ibu ?? 0) + (w.penghasilan_lain ?? 0),
      anggota: w.detail_ekonomi_wawancara[0]?.jml_tanggungan_sebenarnya ?? k.jumlah_tanggungan ?? 0,
      ditandai: teksPekerjaanDitandai(w.ket_pekerjaan_ayah) || teksPekerjaanDitandai(w.ket_pekerjaan_ibu),
      sumber: "wawancara",
    } : {
      penghasilan: (k.penghasilan_ayah ?? 0) + (k.penghasilan_ibu ?? 0),
      anggota: k.jumlah_tanggungan ?? 0,
      ditandai: teksPekerjaanDitandai(k.pekerjaan_ayah) || teksPekerjaanDitandai(k.pekerjaan_ibu),
      sumber: "pendaftaran",
    }];
  }));

  return hitungDashboard({ periode, laporan, penerima, mundur, log, acuan }, periodeId, now);
}
