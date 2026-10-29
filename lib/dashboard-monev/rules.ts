/**
 * lib/dashboard-monev/rules.ts
 * Aturan bisnis dashboard Monev (PRD .kiro/specs/dashboard-monev/prd.md §6).
 * Semua fungsi murni — tanpa akses database — supaya mudah diuji.
 */

/** Syarat ekonomi KIP Kuliah lapis 1: penghasilan gabungan maksimal. */
export const BATAS_PENGHASILAN = 4_000_000;
/** Syarat ekonomi lapis 2: penghasilan gabungan per anggota keluarga maksimal. */
export const BATAS_PER_KAPITA = 750_000;
/** Masa tanggungan KIP Kuliah untuk S1 dan D4. */
export const BATAS_SEMESTER = 8;
/** Kenaikan penghasilan yang dianggap "naik jauh" (PRD §15 nomor 2). */
export const AMBANG_NAIK_JAUH = 0.5;

/**
 * Pilihan pekerjaan di form Monev yang ditandai untuk ditinjau (E2).
 * Hanya tanda tinjauan, bukan alasan penangguhan otomatis (PRD §15 nomor 1).
 */
export const PEKERJAAN_DITANDAI = ["PNS / TNI / Polri"];
/** Kata kunci untuk teks pekerjaan bebas di data seleksi. */
export const KATA_KUNCI_PEKERJAAN_DITANDAI = ["pns", "asn", "pegawai negeri", "tni", "polri", "polisi"];

/**
 * Hari pengingat Telegram otomatis (hari tersisa sebelum batas pengisian).
 * Harus sama dengan TRIGGER_DAYS di app/api/cron/monev-reminder/route.ts.
 */
export const HARI_PENGINGAT = [30, 7, 3, 2, 1];

export type StatusEkonomi = "MEMENUHI" | "MEMENUHI_PER_KAPITA" | "TIDAK_MEMENUHI";
export type Kontak = "TELEGRAM" | "BELUM_TELEGRAM" | "BELUM_AKUN";

/** Semester ke- pada suatu periode. `tahunAkademik` adalah tahun awal tahun ajaran. */
export function semesterKe(tahunAkademik: number, semester: string, angkatan: number): number {
  return (tahunAkademik - angkatan) * 2 + (semester === "Genap" ? 2 : 1);
}

/** Aturan dua lapis: ≤ Rp 4 jt memenuhi; kalau lebih, ≤ Rp 750 rb per orang tetap memenuhi. */
export function statusEkonomi(penghasilan: number, anggota: number): StatusEkonomi {
  if (penghasilan <= BATAS_PENGHASILAN) return "MEMENUHI";
  if (anggota > 0 && penghasilan / anggota <= BATAS_PER_KAPITA) return "MEMENUHI_PER_KAPITA";
  return "TIDAK_MEMENUHI";
}

/** Batas penghasilan untuk sejumlah anggota keluarga: max(Rp 4 jt, Rp 750 rb × anggota). */
export function batasPenghasilan(anggota: number): number {
  return Math.max(BATAS_PENGHASILAN, BATAS_PER_KAPITA * anggota);
}

export function pekerjaanDitandai(pekerjaan: string | null | undefined): boolean {
  return !!pekerjaan && PEKERJAAN_DITANDAI.includes(pekerjaan.trim());
}

/** Untuk teks pekerjaan bebas (data seleksi). */
export function teksPekerjaanDitandai(pekerjaan: string | null | undefined): boolean {
  if (!pekerjaan) return false;
  const teks = pekerjaan.toLowerCase();
  return KATA_KUNCI_PEKERJAAN_DITANDAI.some((kata) => new RegExp(`\\b${kata}\\b`).test(teks));
}

export function kontak(userId: string | null, telegramId: bigint | number | null): Kontak {
  if (!userId) return "BELUM_AKUN";
  return telegramId === null ? "BELUM_TELEGRAM" : "TELEGRAM";
}

export function naikJauh(sebelum: number, sesudah: number): boolean {
  return sebelum > 0 && (sesudah - sebelum) / sebelum > AMBANG_NAIK_JAUH;
}

/** "Rp 4,5 jt" / "Rp 750 rb" — untuk teks ringkas di dashboard. */
export function rupiahSingkat(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return `Rp ${Math.round(n / 1000).toLocaleString("id-ID")} rb`;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Tengah malam WIB dari suatu waktu, sebagai epoch ms. */
export function awalHariWIB(date: Date): number {
  const offset = 7 * 60 * 60 * 1000;
  const wib = new Date(date.getTime() + offset);
  return Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate()) - offset;
}

/** Hari ke- (0 = hari periode dibuka) berdasarkan tanggal WIB. */
export function hariKe(mulai: Date, waktu: Date): number {
  return Math.round((awalHariWIB(waktu) - awalHariWIB(mulai)) / 86_400_000);
}
