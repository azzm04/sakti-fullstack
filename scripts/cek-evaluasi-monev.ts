/**
 * scripts/cek-evaluasi-monev.ts
 * Uji aturan evaluasi Monev (PRD .kiro/specs/monev-alur-terpadu/prd.md §14.1).
 * Fungsi murni, tanpa database.
 *
 * Jalankan: npx jiti scripts/cek-evaluasi-monev.ts
 */
import {
  fasePeriode, hasilMahasiswa, keterangan, perluDitinjau, semesterPenangguhan, statusEkonomiLaporan,
  statusWajibIsi, tandaLaporan, type HasilEvaluasi, type KodeAlasan, type LaporanEvaluasi,
} from "../lib/monev/evaluasi";

const HARI = 86_400_000;
let gagal = 0, lulus = 0;

function cek(nama: string, dapat: unknown, harap: unknown) {
  const ok = JSON.stringify(dapat) === JSON.stringify(harap);
  if (ok) lulus++;
  else gagal++;
  console.log(`${ok ? "✓" : "✗"} ${nama}${ok ? "" : `\n    harap: ${JSON.stringify(harap)}\n    dapat: ${JSON.stringify(dapat)}`}`);
}

/** Laporan dasar: sudah dipindai, KK cocok, tanpa tanda, belum ditinjau. */
function laporan(isi: Partial<LaporanEvaluasi> = {}): LaporanEvaluasi {
  return {
    pekerjaan_ayah: "Petani", pekerjaan_ibu: "Tidak Bekerja",
    penghasilan_ayah: 2_000_000, penghasilan_ibu: 0, penghasilan_lain: 0,
    jumlah_tanggungan: 4, hasil_deteksi_yolo: 4, hasil_scan_ai: {}, status_anomali: false,
    penghasilan_final: null, anggota_final: null, ditinjau_at: null, alasan_manual: [],
    ...isi,
  };
}
const ditinjau = new Date("2026-11-20T03:00:00Z");
const hasil = (l: LaporanEvaluasi | null, ditutup: boolean): [HasilEvaluasi, KodeAlasan[]] => {
  const h = hasilMahasiswa(l, ditutup);
  return [h.hasil, h.alasan];
};

console.log("— Syarat ekonomi dan nilai efektif");
const e1 = laporan({ penghasilan_ayah: 4_500_000, hasil_deteksi_yolo: 4 });
cek("Rp 4,5 jt / 4 orang tanpa koreksi → E1", hasil({ ...e1, ditinjau_at: ditinjau }, false), ["TIDAK_LOLOS", ["E1"]]);
cek("Sama, anggota_final 7 → memenuhi per kapita, Lolos",
  [statusEkonomiLaporan({ ...e1, anggota_final: 7 }), hasil({ ...e1, anggota_final: 7, ditinjau_at: ditinjau }, false)],
  ["MEMENUHI_PER_KAPITA", ["LOLOS", []]]);
cek("Rp 3 jt / 4 orang, penghasilan_final 4,8 jt → E1",
  hasil(laporan({ penghasilan_ayah: 3_000_000, penghasilan_final: 4_800_000, ditinjau_at: ditinjau }), false), ["TIDAK_LOLOS", ["E1"]]);
cek("Tepat Rp 4 jt → memenuhi", statusEkonomiLaporan(laporan({ penghasilan_ayah: 4_000_000, jumlah_tanggungan: 2 })), "MEMENUHI");
cek("Per kapita tepat Rp 750 rb → memenuhi per kapita",
  statusEkonomiLaporan(laporan({ penghasilan_ayah: 4_500_000, jumlah_tanggungan: 6, hasil_deteksi_yolo: 6 })), "MEMENUHI_PER_KAPITA");
cek("Penghasilan lain ikut dihitung (3,6 jt + 0,5 jt / 4 orang → E1)",
  statusEkonomiLaporan(laporan({ penghasilan_ayah: 3_600_000, penghasilan_lain: 500_000 })), "TIDAK_MEMENUHI");

console.log("— Alasan dan keterangan");
cek("E2 dan E4 → keterangan digabung 'dan'",
  keterangan(hasilMahasiswa(laporan({ alasan_manual: ["E4", "E2"], ditinjau_at: ditinjau }), false).alasan),
  "Orang tua PNS dan Terindikasi gaya hidup tidak mencerminkan sebagai penerima KIPK");
cek("E1 + E2 diurutkan E1 dulu",
  hasil({ ...e1, alasan_manual: ["E2"], ditinjau_at: ditinjau }, false), ["TIDAK_LOLOS", ["E1", "E2"]]);

console.log("— Wajib isi tanpa laporan");
cek("Belum mengisi sebelum periode ditutup", hasil(null, false), ["BELUM_MENGISI", []]);
cek("Tidak lolos (E3) setelah ditutup", hasil(null, true), ["TIDAK_LOLOS", ["E3"]]);
cek("Keterangan E3", keterangan(["E3"]), "Belum mengisi form monev KIP hingga akhir periode pengisian");

console.log("— Perlu ditinjau");
cek("Tanpa tanda, tanpa tinjauan → Lolos", hasil(laporan(), false), ["LOLOS", []]);
const kerja = laporan({ pekerjaan_ibu: "PNS / TNI / Polri" });
cek("Pekerjaan ditandai tanpa tinjauan → Perlu ditinjau", [tandaLaporan(kerja), hasil(kerja, false)], [["pekerjaan"], ["PERLU_DITINJAU", []]]);
cek("Pekerjaan ditandai, ditinjau tanpa E2 → Lolos", hasil({ ...kerja, ditinjau_at: ditinjau }, false), ["LOLOS", []]);
cek("Pekerjaan ditandai, ditinjau dengan E2 → Tidak lolos", hasil({ ...kerja, ditinjau_at: ditinjau, alasan_manual: ["E2"] }, false), ["TIDAK_LOLOS", ["E2"]]);
cek("Belum dipindai → Perlu ditinjau", perluDitinjau(laporan({ hasil_deteksi_yolo: null, hasil_scan_ai: null })), true);
cek("E1 belum ditinjau → Perlu ditinjau dengan alasan sementara E1", hasil(e1, false), ["PERLU_DITINJAU", ["E1"]]);
const perKapitaKkBeda = laporan({ penghasilan_ayah: 4_500_000, jumlah_tanggungan: 7, hasil_deteksi_yolo: 4 });
cek("Lolos per kapita tetapi KK berbeda → tanda kk-berbeda", tandaLaporan(perKapitaKkBeda), ["kk-berbeda"]);
cek("KK berbeda, dikoreksi ke angka KK → E1", hasil({ ...perKapitaKkBeda, anggota_final: 4, ditinjau_at: ditinjau }, false), ["TIDAK_LOLOS", ["E1"]]);
cek("KK tidak terbaca → tanda dokumen", tandaLaporan(laporan({ hasil_deteksi_yolo: 0 })), ["dokumen"]);

console.log("— Semester penangguhan");
cek("Gasal 2026/2027 → Genap 2026/2027", semesterPenangguhan(2026, "Gasal").label, "Genap 2026/2027");
cek("Genap 2025/2026 → Gasal 2026/2027", semesterPenangguhan(2025, "Genap").label, "Gasal 2026/2027");

console.log("— Wajib isi");
const gasal2026 = { tahun_akademik: 2026, semester: "Gasal", deadline: new Date("2026-11-09T09:00:00Z") };
cek("Angkatan 2022 di Gasal 2026 (semester 9) → lewat semester", statusWajibIsi(gasal2026, 2022, null), "LEWAT_SEMESTER");
cek("Angkatan 2023 di Gasal 2026 (semester 7) → wajib", statusWajibIsi(gasal2026, 2023, null), "WAJIB");
cek("Mundur sebelum tenggat → tidak wajib", statusWajibIsi(gasal2026, 2024, new Date("2026-10-01T00:00:00Z")), "MENGUNDURKAN_DIRI");
cek("Mundur setelah tenggat → tetap wajib", statusWajibIsi(gasal2026, 2024, new Date("2026-12-01T00:00:00Z")), "WAJIB");

console.log("— Fase periode");
const now = new Date("2026-11-20T00:00:00Z");
const p = { deadline: new Date(now.getTime() - 2 * HARI), waktu_mulai: new Date(now.getTime() - 40 * HARI), is_active: true, ditutup_at: null, difinalisasi_at: null };
cek("Lewat tenggat, belum ditutup → TENGGAT_LEWAT", fasePeriode(p, 10, now), "TENGGAT_LEWAT");
cek("Ditutup → DITUTUP", fasePeriode({ ...p, ditutup_at: now }, 10, now), "DITUTUP");
cek("Final → FINAL", fasePeriode({ ...p, ditutup_at: now, difinalisasi_at: now }, 10, now), "FINAL");
cek("Berjalan → BERLANGSUNG", fasePeriode({ ...p, deadline: new Date(now.getTime() + 5 * HARI) }, 10, now), "BERLANGSUNG");

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
