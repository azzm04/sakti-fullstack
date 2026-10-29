/**
 * lib/monev/evaluasi.ts
 * Aturan evaluasi ekonomi Monev (PRD .kiro/specs/monev-alur-terpadu/prd.md §5).
 *
 * Fungsi murni tanpa akses database. Hasil evaluasi (Lolos / Tidak lolos),
 * E1, E3, dan semester penangguhan selalu dihitung di sini, tidak disimpan.
 * Database hanya menyimpan koreksi admin, waktu tinjauan, alasan manual
 * (E2/E4), serta waktu tutup dan final periode.
 *
 * Import relatif (bukan "@/") supaya bisa dijalankan skrip uji lewat jiti.
 */
import { BATAS_SEMESTER, pekerjaanDitandai, semesterKe, statusEkonomi, type StatusEkonomi } from "../dashboard-monev/rules";
import { getOperationalStatus } from "../monev-schedule";

/* ── Alasan tidak lolos ─────────────────────────────────────── */

export type KodeAlasan = "E1" | "E2" | "E3" | "E4";
export type KodeAlasanManual = "E2" | "E4";

/** Keterangan baku Dirmawa, dipakai apa adanya di layar, ekspor, dan portal mahasiswa. */
export const KETERANGAN_BAKU: Record<KodeAlasan, string> = {
  E1: "Penghasilan orang tua/wali diatas 4 jt",
  E2: "Orang tua PNS",
  E3: "Belum mengisi form monev KIP hingga akhir periode pengisian",
  E4: "Terindikasi gaya hidup tidak mencerminkan sebagai penerima KIPK",
};

const URUTAN_ALASAN: KodeAlasan[] = ["E1", "E2", "E3", "E4"];

/** Beberapa alasan digabung dengan "dan", urut E1–E4 (mengikuti surat Undip). */
export function keterangan(alasan: KodeAlasan[]): string {
  return URUTAN_ALASAN.filter((k) => alasan.includes(k)).map((k) => KETERANGAN_BAKU[k]).join(" dan ");
}

/* ── Fase periode ───────────────────────────────────────────── */

export type FasePeriode = "NONAKTIF" | "BELUM_DIBUKA" | "BERLANGSUNG" | "TENGGAT_LEWAT" | "DITUTUP" | "FINAL";

export interface PeriodeEvaluasi {
  deadline: Date;
  waktu_mulai: Date | null;
  is_active: boolean;
  ditutup_at: Date | null;
  difinalisasi_at: Date | null;
}

export function fasePeriode(p: PeriodeEvaluasi, jumlahLaporan: number, now: Date): FasePeriode {
  if (p.difinalisasi_at) return "FINAL";
  if (p.ditutup_at) return "DITUTUP";
  const status = getOperationalStatus({ ...p, jumlah_laporan: jumlahLaporan }, now);
  if (status === "BERAKHIR") return "TENGGAT_LEWAT";
  if (status === "BERLANGSUNG") return "BERLANGSUNG";
  if (status === "BELUM_DIMULAI") return "BELUM_DIBUKA";
  return "NONAKTIF";
}

/** Form sudah tidak menerima pengiriman. */
export function pengisianBerakhir(fase: FasePeriode): boolean {
  return fase === "TENGGAT_LEWAT" || fase === "DITUTUP" || fase === "FINAL";
}

/* ── Wajib isi ──────────────────────────────────────────────── */

export type StatusWajibIsi = "WAJIB" | "LEWAT_SEMESTER" | "MENGUNDURKAN_DIRI";

/**
 * Semester ke- ≤ 8 dan tidak mengundurkan diri (DITERIMA) sebelum tenggat.
 * `mundurAt` = waktu pengunduran diri diputuskan, atau null bila tidak ada.
 */
export function statusWajibIsi(
  periode: { tahun_akademik: number; semester: string; deadline: Date },
  angkatan: number,
  mundurAt: Date | null,
): StatusWajibIsi {
  if (semesterKe(periode.tahun_akademik, periode.semester, angkatan) > BATAS_SEMESTER) return "LEWAT_SEMESTER";
  if (mundurAt && mundurAt < periode.deadline) return "MENGUNDURKAN_DIRI";
  return "WAJIB";
}

/* ── Laporan ────────────────────────────────────────────────── */

type Rupiah = bigint | number | null;

export interface LaporanEvaluasi {
  pekerjaan_ayah: string | null;
  pekerjaan_ibu: string | null;
  penghasilan_ayah: Rupiah;
  penghasilan_ibu: Rupiah;
  penghasilan_lain: Rupiah;
  jumlah_tanggungan: number | null;
  hasil_deteksi_yolo: number | null;
  hasil_scan_ai: unknown;
  status_anomali: boolean | null;
  penghasilan_final: Rupiah;
  anggota_final: number | null;
  ditinjau_at: Date | null;
  alasan_manual: KodeAlasanManual[];
}

export const penghasilanIsian = (l: LaporanEvaluasi) =>
  Number(l.penghasilan_ayah ?? 0) + Number(l.penghasilan_ibu ?? 0) + Number(l.penghasilan_lain ?? 0);
export const anggotaIsian = (l: LaporanEvaluasi) => l.jumlah_tanggungan ?? 0;

/** Angka koreksi admin bila ada; selain itu isian mahasiswa. */
export function nilaiEfektif(l: LaporanEvaluasi) {
  return {
    penghasilan: l.penghasilan_final !== null ? Number(l.penghasilan_final) : penghasilanIsian(l),
    anggota: l.anggota_final ?? anggotaIsian(l),
    dikoreksi: l.penghasilan_final !== null || l.anggota_final !== null,
  };
}

export function statusEkonomiLaporan(l: LaporanEvaluasi): StatusEkonomi {
  const { penghasilan, anggota } = nilaiEfektif(l);
  return statusEkonomi(penghasilan, anggota);
}

export const sudahDipindai = (l: LaporanEvaluasi) => l.hasil_deteksi_yolo !== null || l.hasil_scan_ai !== null;
/** YOLO berjalan tetapi tidak menemukan anggota keluarga di KK. */
export const kkTakTerbaca = (l: LaporanEvaluasi) => l.hasil_deteksi_yolo === 0;
/** Jumlah anggota di KK berbeda dari isian mahasiswa. */
export const kkBerbeda = (l: LaporanEvaluasi) =>
  l.hasil_deteksi_yolo !== null && l.hasil_deteksi_yolo > 0 && l.hasil_deteksi_yolo !== anggotaIsian(l);
export const pekerjaanLaporanDitandai = (l: LaporanEvaluasi) =>
  pekerjaanDitandai(l.pekerjaan_ayah) || pekerjaanDitandai(l.pekerjaan_ibu);

/* ── Tanda ──────────────────────────────────────────────────── */

/** Kelompok tanda D3 (PRD Dashboard Monev). Hanya untuk laporan yang sudah dipindai. */
export type KodeTanda = "tidak-memenuhi" | "kk-berbeda" | "dokumen" | "pekerjaan";

export function tandaLaporan(l: LaporanEvaluasi): KodeTanda[] {
  if (!sudahDipindai(l)) return [];
  const tanda: KodeTanda[] = [];
  const status = statusEkonomiLaporan(l);
  if (status === "TIDAK_MEMENUHI") tanda.push("tidak-memenuhi");
  // Lolos hanya karena per kapita: jumlah anggota menentukan, jadi KK yang
  // berbeda lebih berat daripada beda dokumen biasa.
  if (status === "MEMENUHI_PER_KAPITA" && kkBerbeda(l)) tanda.push("kk-berbeda");
  else if (l.status_anomali === true || kkTakTerbaca(l) || kkBerbeda(l)) tanda.push("dokumen");
  if (pekerjaanLaporanDitandai(l)) tanda.push("pekerjaan");
  return tanda;
}

/** Belum ditinjau admin, dan belum dipindai atau punya tanda. */
export function perluDitinjau(l: LaporanEvaluasi): boolean {
  return l.ditinjau_at === null && (!sudahDipindai(l) || tandaLaporan(l).length > 0);
}

/** E1 (dihitung) ditambah alasan manual E2/E4. E3 tidak berlaku untuk laporan. */
export function alasanLaporan(l: LaporanEvaluasi): KodeAlasan[] {
  const alasan: KodeAlasan[] = statusEkonomiLaporan(l) === "TIDAK_MEMENUHI" ? ["E1"] : [];
  for (const k of l.alasan_manual) if (!alasan.includes(k)) alasan.push(k);
  return URUTAN_ALASAN.filter((k) => alasan.includes(k));
}

/* ── Hasil per mahasiswa wajib isi ──────────────────────────── */

export type HasilEvaluasi = "BELUM_MENGISI" | "PERLU_DITINJAU" | "TIDAK_LOLOS" | "LOLOS";

export const LABEL_HASIL: Record<HasilEvaluasi, string> = {
  BELUM_MENGISI: "Belum mengisi",
  PERLU_DITINJAU: "Perlu ditinjau",
  TIDAK_LOLOS: "Tidak lolos",
  LOLOS: "Lolos",
};

/**
 * PRD §5.5, dievaluasi berurutan. Pada PERLU_DITINJAU, `alasan` berisi alasan
 * sementara (mis. E1 yang belum ditinjau) agar bisa ditampilkan sebagai pratinjau.
 */
export function hasilMahasiswa(laporan: LaporanEvaluasi | null, periodeDitutup: boolean): { hasil: HasilEvaluasi; alasan: KodeAlasan[] } {
  if (!laporan) return periodeDitutup ? { hasil: "TIDAK_LOLOS", alasan: ["E3"] } : { hasil: "BELUM_MENGISI", alasan: [] };
  const alasan = alasanLaporan(laporan);
  if (perluDitinjau(laporan)) return { hasil: "PERLU_DITINJAU", alasan };
  return { hasil: alasan.length ? "TIDAK_LOLOS" : "LOLOS", alasan };
}

/* ── Semester ───────────────────────────────────────────────── */

export function labelSemester(tahunAkademik: number, semester: string): string {
  return `${semester} ${tahunAkademik}/${tahunAkademik + 1}`;
}

/** Hasil Monev suatu periode menentukan pencairan semester berikutnya (PRD §5.6). */
export function semesterPenangguhan(tahunAkademik: number, semester: string) {
  const berikut = semester === "Gasal"
    ? { tahun_akademik: tahunAkademik, semester: "Genap" }
    : { tahun_akademik: tahunAkademik + 1, semester: "Gasal" };
  return { ...berikut, label: labelSemester(berikut.tahun_akademik, berikut.semester) };
}
