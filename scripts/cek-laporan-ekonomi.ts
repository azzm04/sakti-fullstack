/** Uji roster dan filter UI ekonomi: npx jiti scripts/cek-laporan-ekonomi.ts */
import assert from "node:assert/strict";
import { cocokFilter, susunLaporanEkonomi, type LaporanDenganDokumen } from "../lib/monev/laporan-ekonomi";
import { judulPeriode, urlPeriode } from "../lib/monev/ruang-kerja";
const deadline = new Date("2026-11-01T00:00:00Z");
const periode = {
  id: "p", label: "Monev KIP-K Undip Semester Gasal 2026/2027",
  tahun_akademik: 2026, semester: "Gasal", is_active: true,
  waktu_mulai: new Date("2026-10-01T00:00:00Z"), deadline, created_at: deadline,
  ditutup_at: null as Date | null, difinalisasi_at: null,
};
const laporan: LaporanDenganDokumen = {
  id: "l1", user_id: "u1", periode_monev_id: "p", waktu_lapor: deadline,
  pekerjaan_ayah: "Petani", pekerjaan_ibu: "Tidak Bekerja",
  penghasilan_ayah: BigInt(4_500_000), penghasilan_ibu: BigInt(0), penghasilan_lain: BigInt(0),
  jumlah_tanggungan: 4, hasil_deteksi_yolo: null, hasil_scan_ai: null,
  status_anomali: false, penghasilan_final: null, anggota_final: null,
  ditinjau_at: null, alasan_manual: [], path_scan_kk: "dokumen/kk.pdf",
};
const penerima = Array.from({ length: 5 }, (_, i) => ({
  userId: i === 4 ? null : `u${i + 1}`, nim: `nim${i + 1}`, nama: `Mahasiswa ${i + 1}`,
  angkatan: i === 2 ? 2022 : 2023, telegramId: null, prodi: "Informatika", email: null,
}));
const sumber = {
  periode: [periode], laporan: [laporan], penerima,
  mundur: [{ user_id: "u4", diputuskan_at: new Date("2026-10-10"), updated_at: deadline }],
};
let rows = susunLaporanEkonomi(sumber, "p");
assert.deepEqual(rows.map((r) => r.nim), ["nim1", "nim2", "nim5"]);
assert.equal(rows.filter((r) => cocokFilter(r, "belum-mengisi")).length, 2);
assert.equal(rows.filter((r) => cocokFilter(r, "perlu-ditinjau")).length, 1);
assert.equal(rows.filter((r) => cocokFilter(r, "belum-dipindai")).length, 1);
assert.equal(rows.filter((r) => cocokFilter(r, "sudah-mengisi")).length, 1);
assert.equal(rows[0].total, 4_500_000);
assert.equal(rows[0].perOrang, 1_125_000);
assert.equal(rows[0].dokumen[0].label, "Kartu keluarga");
assert.doesNotThrow(() => JSON.stringify(rows));
console.log("✓ Roster, tanpa akun, pengecualian semester/pengunduran diri, filter, dan serialisasi");
laporan.anggota_final = 7;
laporan.ditinjau_at = deadline;
rows = susunLaporanEkonomi(sumber, "p");
assert.equal(rows[0].hasil, "LOLOS");
assert.equal(rows[0].anggota, 7);
assert.equal(rows[0].dikoreksi, true);
assert.equal(rows[0].perluDitinjau, false);
console.log("✓ Koreksi admin dan hasil tabel memakai aturan evaluasi");
periode.ditutup_at = deadline;
rows = susunLaporanEkonomi(sumber, "p");
assert.equal(rows.filter((r) => cocokFilter(r, "tidak-lolos")).length, 2);
assert.ok(rows.filter((r) => !r.laporanId).every((r) => r.keterangan.includes("Belum mengisi")));
assert.equal(susunLaporanEkonomi(sumber, "tidak-ada").length, 0);
console.log("✓ E3 hanya setelah ditutup; periode tidak ditemukan");
assert.equal(judulPeriode(periode), "Gasal 2026/2027");
const url = new URL(urlPeriode("contoh-5", "pemeriksaan", true, "perlu-ditinjau"), "http://localhost");
assert.equal(url.searchParams.get("demo"), "1");
assert.equal(url.searchParams.get("filter"), "perlu-ditinjau");
console.log("✓ Label periode ringkas dan konteks tautan dashboard dipertahankan");