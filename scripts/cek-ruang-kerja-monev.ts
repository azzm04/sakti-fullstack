/** Uji navigasi Tahap 2: npx jiti scripts/cek-ruang-kerja-monev.ts */
import assert from "node:assert/strict";
import { fasePeriode } from "../lib/monev/evaluasi";
import { LANGKAH, langkahBawaan, pilihLangkah, statusLangkah, type PeriodeRuangKerja } from "../lib/monev/ruang-kerja";
import { wibInputToUtcIso, utcIsoToWibInput, addDaysToWibInput } from "../lib/monev-schedule";

const now = new Date("2026-10-26T03:00:00Z");
const base: PeriodeRuangKerja = {
  id: "uji", label: "Gasal 2026/2027", waktu_mulai: "2026-10-01T01:00:00Z",
  deadline: "2026-11-01T03:00:00Z", is_active: true,
  created_at: "2026-09-01T00:00:00Z", updated_at: null, tahun_akademik: 2026,
  semester: "Gasal", jumlah_laporan: 2, ditutup_at: null, difinalisasi_at: null,
  fase: "BERLANGSUNG", sisaHari: 6,
  ringkasan: { wajibIsi: 10, terkirim: 2, belumDipindai: 1, perluDitinjau: 1, tidakLolos: 0 },
};
let passed = 0;
function cek(nama: string, run: () => void) {
  run();
  passed++;
  console.log(`✓ ${nama}`);
}
function periode(patch: Partial<PeriodeRuangKerja>): PeriodeRuangKerja {
  const p = { ...base, ...patch };
  return { ...p, fase: fasePeriode({
    ...p, deadline: new Date(p.deadline), waktu_mulai: p.waktu_mulai ? new Date(p.waktu_mulai) : null,
    ditutup_at: p.ditutup_at ? new Date(p.ditutup_at) : null,
    difinalisasi_at: p.difinalisasi_at ? new Date(p.difinalisasi_at) : null,
  }, p.jumlah_laporan, now) };
}
cek("Periode berlangsung menuju pengisian", () => assert.equal(langkahBawaan(periode({})), "pengisian"));
cek("Tenggat lewat menuju penutupan, termasuk saat nonaktif", () => {
  for (const is_active of [true, false]) assert.equal(langkahBawaan(periode({ deadline: now.toISOString(), is_active })), "penutupan");
});
cek("Ditutup dengan laporan bertanda menuju pemeriksaan", () => assert.equal(langkahBawaan(periode({ ditutup_at: now.toISOString() })), "pemeriksaan"));
cek("Ditutup tanpa tinjauan tersisa menuju finalisasi", () => assert.equal(langkahBawaan(periode({ ditutup_at: now.toISOString(), ringkasan: { ...base.ringkasan, perluDitinjau: 0 } })), "finalisasi"));
cek("Final selalu menuju finalisasi", () => assert.equal(langkahBawaan(periode({ ditutup_at: now.toISOString(), difinalisasi_at: now.toISOString() })), "finalisasi"));
cek("Nonaktif dan belum dibuka menuju jadwal", () => {
  for (const is_active of [true, false]) assert.equal(langkahBawaan(periode({ waktu_mulai: "2026-10-28T00:00:00Z", jumlah_laporan: 0, is_active })), "jadwal");
});
cek("Setiap langkah dapat dibuka lewat URL, termasuk penutupan sebelum tenggat", () => {
  for (const l of LANGKAH) assert.equal(pilihLangkah(l.id, base), l.id);
});
cek("Parameter tidak dikenal menggunakan langkah bawaan", () => {
  assert.equal(pilihLangkah("tidak-ada", base), "pengisian");
  assert.equal(pilihLangkah(undefined, base), "pengisian");
});
cek("Lewat tenggat tidak otomatis menandai pengisian/penutupan selesai", () => {
  const steps = statusLangkah(periode({ deadline: now.toISOString() }));
  assert.equal(steps[1].selesai, false);
  assert.equal(steps[3].selesai, false);
});
cek("Status stepper mengikuti tutup, tinjauan, dan final", () => {
  const p = periode({ ditutup_at: now.toISOString(), difinalisasi_at: now.toISOString(), ringkasan: { ...base.ringkasan, perluDitinjau: 0, belumDipindai: 0 } });
  assert.ok(statusLangkah(p).every((s) => s.selesai));
});
cek("Jadwal tanpa waktu mulai belum selesai", () => assert.equal(statusLangkah(periode({ waktu_mulai: null, jumlah_laporan: 0 }))[0].selesai, false));
cek("Input WIB dan tambahan tujuh hari melewati pergantian tahun", () => {
  const input = "2026-12-28T10:00";
  assert.equal(utcIsoToWibInput(wibInputToUtcIso(input)), input);
  assert.equal(addDaysToWibInput(input, 7), "2027-01-04T10:00");
});
console.log(`${passed} kelompok uji navigasi lulus.`);
