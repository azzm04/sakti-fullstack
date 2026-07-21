/**
 * Script: Konversi CSV pendaftar KIP-K → SQL INSERT
 * Jalankan: node scripts/csv-to-sql.mjs
 * Output : scripts/insert_kandidat.sql
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Baca CSV ──────────────────────────────────────────────────────────────────
const csvPath = join(__dir, "Data Verifikasi Validasi_SNBP Eligible_.csv");
const raw = readFileSync(csvPath, "utf-8");

// CSV pakai delimiter ";"
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== "");
const headerLine = lines[0].split(";").map((h) => h.trim());

// Posisi kolom (case-insensitive)
const idx = (name) => {
  const i = headerLine.findIndex(
    (h) => h.toLowerCase() === name.toLowerCase()
  );
  return i;
};

// ── Helper ─────────────────────────────────────────────────────────────────────
/** Parse baris CSV dengan memperhatikan tanda kutip */
function parseLine(line) {
  const result = [];
  let inQuote = false;
  let cell = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ";" && !inQuote) {
      result.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  result.push(cell.trim());
  return result;
}

/** Escape string untuk SQL */
function esc(val) {
  if (val === null || val === undefined || val === "" || val === "-" || val === "—") {
    return "NULL";
  }
  const s = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "''")
    .trim();
  if (s === "" || s === "-" || s === "—") return "NULL";
  return `'${s}'`;
}

/** Parse angka dari format IDR / range / angka biasa */
function parseNum(val) {
  if (!val || val === "-" || val === "—" || val === "#DIV/0!" || val === "#VALUE!") return null;
  const s = String(val)
    .replace(/[Rp\s]/gi, "")
    .replace(/\./g, "")        // titik ribuan
    .replace(",", ".")         // koma desimal
    .split("-")[0]             // ambil batas bawah range
    .trim();
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? null : n;
}

/** Parse nominal_per_kapita dari kolom " Nominal per kapita " (bisa ada Rp. atau angka biasa) */
function parseKapita(val) {
  if (!val || val === "-" || val === "#DIV/0!" || val === "#VALUE!") return null;
  const s = String(val)
    .replace(/[Rp\s.]/gi, "")
    .replace(",", ".");
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? null : n;
}

// ── Indeks kolom dari header ───────────────────────────────────────────────────
const COL = {
  no:                   idx("no"),
  no_pendaftaran:       idx("No. Pendaftaran KIP"),
  nama:                 idx("Nama Siswa2"),
  prodi:                idx("Prodi"),
  nik:                  idx("NIK"),
  no_kk:                idx("No. Kartu Keluarga"),
  nik_kepala:           idx("NIK Kepala Keluarga"),
  nisn:                 idx("NISN"),
  status_dtks:          idx("Status DTKS"),
  validasi_dtks:        idx("Validasi DTKS"),
  status_p3ke:          idx("Status P3KE"),
  validasi_p3ke:        idx("Validasi P3KE"),
  no_kip:               idx("No. KIP"),
  validasi_kip:         idx("Validasi KIP"),
  no_kks:               idx("No. KKS"),
  asal_sekolah:         idx("Asal Sekolah"),
  kab_kota_sekolah:     idx("Kab/Kota Sekolah"),
  provinsi_sekolah:     idx("Provinsi Sekolah"),
  tempat_lahir:         idx("Tempat Lahir"),
  tanggal_lahir:        idx("Tanggal Lahir"),
  jenis_kelamin:        idx("Jenis Kelamin"),
  alamat:               idx("Alamat Tinggal"),
  no_hp:                idx("No. Handphone"),
  email:                idx("Alamat Email"),
  sosmed:               idx("Alamat IG/ Twitter/ Tiktok"),
  nama_ayah:            idx("Nama Ayah"),
  pekerjaan_ayah:       idx("Pekerjaan Ayah"),
  ket_pekerjaan_ayah:   idx("Ket. Pekerjaan Ayah"),
  penghasilan_ayah_r:   idx("Penghasilan Ayah"),       
  ket_penghasilan_ayah: idx("Ket. Penghasilan Ayah/ bln"), // Spasi awal/akhir dihapus
  status_ayah:          idx("Status Ayah"),
  nama_ibu:             idx("Nama Ibu"),
  pekerjaan_ibu:        idx("Pekerjaan Ibu"),
  ket_pekerjaan_ibu:    idx("Ket. Pekerjaan Ibu"),
  penghasilan_ibu_r:    idx("Penghasilan Ibu"),
  ket_penghasilan_ibu:  idx("Ket. Penghasilan Ibu/ bln"),  // Spasi awal/akhir dihapus
  status_ibu:           idx("Status Ibu"),
  wali:                 idx("Wali (jika ada)"),
  penghasilan_lain:     idx("Penghasilan lain/ bln"),      // Spasi awal/akhir dihapus
  jml_tanggungan:       idx("Jumlah Tanggungan"),
  jml_sebenarnya:       idx("Jml Tanggungan Sebenarnya"),
  nominal_per_kapita:   idx("Nominal per kapita"),         // Spasi awal/akhir dihapus
  kepemilikan_rumah:    idx("Kepemilikan Rumah"),
  tahun_perolehan:      idx("Tahun Perolehan"),
  sumber_listrik:       idx("Sumber Listrik"),
  luas_tanah:           idx("Luas Tanah"),
  luas_bangunan:        idx("Luas Bangunan"),
  sumber_air:           idx("Sumber Air"),
  mck:                  idx("MCK"),
  kondisi_rumah:        idx("Kondisi Rumah"),
  jarak:                idx("Jarak Pusat Kota (KM)"),
  prestasi:             idx("Prestasi"),
  rekomendasi:          idx("Rekomendasi"),
  alasan:               idx("Alasan"),
  pewawancara:          idx("Nama Pewawancara"),
  alasan_penguat:       idx("Alasan Penguat nanti jadi role model undip"), // Disesuaikan dengan CSV
};

console.log("Header terdeteksi:");
Object.entries(COL).forEach(([k, v]) =>
  console.log(`  ${k.padEnd(25)} → kolom ${v} "${v >= 0 ? headerLine[v] : "❌ TIDAK DITEMUKAN"}"`)
);

// ── Generate SQL ───────────────────────────────────────────────────────────────
const batchId = "gen-" + Date.now(); // placeholder, ganti dengan UUID nyata dari impor_data

const sqls = [];

// 1. Insert ke impor_data dulu
sqls.push(`-- ============================================================`);
sqls.push(`-- 1. Buat record impor_data (batch)`);
sqls.push(`-- ============================================================`);
sqls.push(`INSERT INTO impor_data (file_name, total_rows, valid_rows, error_rows, dup_rows)`);
sqls.push(`VALUES ('Data Verifikasi Validasi_SNBP Eligible_.csv', ${lines.length - 1}, ${lines.length - 1}, 0, 0)`);
sqls.push(`RETURNING id;`);
sqls.push(``);
sqls.push(`-- ⚠️  Catat ID yang dikembalikan di atas, ganti ${`<IMPOR_ID>`} di bawah ini`);
sqls.push(``);

// 2. Insert kandidat
sqls.push(`-- ============================================================`);
sqls.push(`-- 2. Insert kandidat`);
sqls.push(`-- ============================================================`);
sqls.push(`INSERT INTO kandidat (`);
sqls.push(`  impor_data_id, no, no_pendaftaran_kipk, no_kip, no_kks,`);
sqls.push(`  nama_pendaftar, prodi_pendaftar, nik, no_kartu_keluarga, nik_kepala_keluarga, nisn,`);
sqls.push(`  status_dtks, validasi_dtks, status_p3ke, validasi_p3ke, validasi_kip, validasi_kks,`);
sqls.push(`  asal_sekolah, kab_kota_sekolah, provinsi_sekolah,`);
sqls.push(`  tempat_lahir, tanggal_lahir, jenis_kelamin,`);
sqls.push(`  alamat, no_hp, email,`);
sqls.push(`  pekerjaan_ayah, ket_pekerjaan_ayah, penghasilan_ayah, status_ayah,`);
sqls.push(`  pekerjaan_ibu,  ket_pekerjaan_ibu,  penghasilan_ibu,  status_ibu,`);
sqls.push(`  penghasilan_lain, jumlah_tanggungan, jumlah_orang_rumah, nominal_per_kapita,`);
sqls.push(`  kepemilikan_rumah, sumber_listrik, sumber_air, mck,`);
sqls.push(`  kab_kota, provinsi, jarak_pusat_kota,`);
sqls.push(`  jalur_masuk`);
sqls.push(`) VALUES`);

const valueRows = [];

for (let i = 1; i < lines.length; i++) {
  const cols = parseLine(lines[i]);
  if (cols.length < 5) continue; // skip baris kosong

  const g = (key) => {
    const colIdx = COL[key];
    if (colIdx === undefined || colIdx < 0) return "";
    return (cols[colIdx] ?? "").trim();
  };

  // Penghasilan: prioritaskan kolom nominal, fallback ke parse range
  const pengAyah = parseNum(g("ket_penghasilan_ayah")) ?? parseNum(g("penghasilan_ayah_r"));
  const pengIbu  = parseNum(g("ket_penghasilan_ibu"))  ?? parseNum(g("penghasilan_ibu_r"));
  const pengLain = parseNum(g("penghasilan_lain"));
  const kapita   = parseKapita(g("nominal_per_kapita"));
  const jarak    = parseNum(g("jarak"));

  const tanggungan  = parseNum(g("jml_tanggungan"))  ?? null;
  const sebenarnya  = parseNum(g("jml_sebenarnya"))  ?? null;

  const row = [
    `<IMPOR_ID>`,                           // impor_data_id — ganti setelah step 1
    g("no") || i,                           // no
    esc(g("no_pendaftaran")),               // no_pendaftaran_kipk
    esc(g("no_kip")),                       // no_kip
    esc(g("no_kks")),                       // no_kks
    esc(g("nama")),                         // nama_pendaftar
    esc(g("prodi")),                        // prodi_pendaftar
    esc(g("nik")),                          // nik
    esc(g("no_kk")),                        // no_kartu_keluarga
    esc(g("nik_kepala")),                   // nik_kepala_keluarga
    esc(g("nisn")),                         // nisn
    esc(g("status_dtks")),                  // status_dtks
    esc(g("validasi_dtks")),               // validasi_dtks
    esc(g("status_p3ke")),                  // status_p3ke
    esc(g("validasi_p3ke")),               // validasi_p3ke
    esc(g("validasi_kip")),                // validasi_kip
    esc(g("no_kks") ? g("no_kks") : null), // validasi_kks (isi jika ada no_kks)
    esc(g("asal_sekolah")),                // asal_sekolah
    esc(g("kab_kota_sekolah")),            // kab_kota_sekolah
    esc(g("provinsi_sekolah")),            // provinsi_sekolah
    esc(g("tempat_lahir")),                // tempat_lahir
    esc(g("tanggal_lahir")),               // tanggal_lahir
    esc(g("jenis_kelamin")),               // jenis_kelamin
    esc(g("alamat")),                       // alamat
    esc(g("no_hp")),                        // no_hp
    esc(g("email")),                        // email
    esc(g("pekerjaan_ayah")),              // pekerjaan_ayah
    esc(g("ket_pekerjaan_ayah")),          // ket_pekerjaan_ayah
    pengAyah !== null ? pengAyah : "NULL", // penghasilan_ayah
    esc(g("status_ayah")),                 // status_ayah
    esc(g("pekerjaan_ibu")),               // pekerjaan_ibu
    esc(g("ket_pekerjaan_ibu")),           // ket_pekerjaan_ibu
    pengIbu !== null ? pengIbu : "NULL",   // penghasilan_ibu
    esc(g("status_ibu")),                  // status_ibu
    pengLain !== null ? pengLain : "NULL", // penghasilan_lain
    tanggungan !== null ? tanggungan : "NULL",   // jumlah_tanggungan
    sebenarnya !== null ? sebenarnya : "NULL",   // jumlah_orang_rumah
    kapita !== null ? kapita : "NULL",     // nominal_per_kapita
    esc(g("kepemilikan_rumah")),           // kepemilikan_rumah
    esc(g("sumber_listrik")),              // sumber_listrik
    esc(g("sumber_air")),                  // sumber_air
    esc(g("mck")),                          // mck
    esc(g("kab_kota_sekolah")),            // kab_kota (pakai kab_kota_sekolah sebagai proxy)
    esc(g("provinsi_sekolah")),            // provinsi
    jarak !== null ? jarak : "NULL",       // jarak_pusat_kota
    "NULL",                                // jalur_masuk (tidak ada di CSV ini)
  ].join(", ");

  valueRows.push(`  (${row})`);
}

sqls.push(valueRows.join(",\n") + ";");

// 3. Insert hasil_wawancara untuk data yang sudah ada rekomendasi
sqls.push(``);
sqls.push(`-- ============================================================`);
sqls.push(`-- 3. Insert hasil_wawancara (hanya baris yang sudah diwawancarai)`);
sqls.push(`-- ============================================================`);
sqls.push(`-- Jalankan SETELAH step 2 selesai dan kandidat sudah tersimpan.`);
sqls.push(`-- Ganti <IMPOR_ID> dengan ID dari step 1.`);
sqls.push(``);

const hwRows = [];

for (let i = 1; i < lines.length; i++) {
  const cols = parseLine(lines[i]);
  if (cols.length < 5) continue;

  const g = (key) => {
    const colIdx = COL[key];
    if (colIdx === undefined || colIdx < 0) return "";
    return (cols[colIdx] ?? "").trim();
  };

  const rekomendasi   = g("rekomendasi");
  const alasan        = g("alasan");
  const pewawancara   = g("pewawancara");
  const kondisiRumah  = g("kondisi_rumah");

  // Skip baris yang tidak ada rekomendasi
  if (!rekomendasi && !pewawancara) continue;

  // Mapping rekomendasi → boolean kelayakan
  const layak =
    rekomendasi.toLowerCase().includes("diusulkan") &&
    !rekomendasi.toLowerCase().includes("tidak diusulkan")
      ? "TRUE"
      : "FALSE";

  const pengAyah = parseNum(g("ket_penghasilan_ayah")) ?? parseNum(g("penghasilan_ayah_r"));
  const pengIbu  = parseNum(g("ket_penghasilan_ibu"))  ?? parseNum(g("penghasilan_ibu_r"));
  const pengLain = parseNum(g("penghasilan_lain"));
  const jarak    = parseNum(g("jarak"));

  const no = g("no") || i;

  hwRows.push(
    `  -- No. ${no} — ${g("nama")}\n` +
    `  INSERT INTO hasil_wawancara (\n` +
    `    kandidat_id, sosial_media,\n` +
    `    ket_pekerjaan_ayah, ket_penghasilan_ayah, ket_pekerjaan_ibu, ket_penghasilan_ibu,\n` +
    `    penghasilan_lain, jarak_pusat_kota,\n` +
    `    kelayakan_rumah, rekomendasi, alasan, is_draft, interviewed_at\n` +
    `  )\n` +
    `  SELECT\n` +
    `    k.id, ${esc(g("sosmed"))},\n` +
    `    ${esc(g("ket_pekerjaan_ayah"))}, ${pengAyah ?? "NULL"}, ${esc(g("ket_pekerjaan_ibu"))}, ${pengIbu ?? "NULL"},\n` +
    `    ${pengLain ?? "NULL"}, ${jarak ?? "NULL"},\n` +
    `    ${kondisiRumah ? `'${kondisiRumah.replace(/'/g, "''")}'` : "NULL"}, ${esc(rekomendasi)}, ${esc(alasan)}, FALSE, NOW()\n` +
    `  FROM kandidat k\n` +
    `  WHERE k.impor_data_id = <IMPOR_ID> AND k.no = ${no};\n`
  );
}

sqls.push(hwRows.join("\n"));

// ── Tulis file output ─────────────────────────────────────────────────────────
const output = sqls.join("\n");
const outPath = join(__dir, "insert_kandidat.sql");
writeFileSync(outPath, output, "utf-8");

console.log(`\n✅ SQL berhasil digenerate: ${outPath}`);
console.log(`   Total baris data : ${lines.length - 1}`);
console.log(`   Total HW rows    : ${hwRows.length}`);
console.log(`\n📋 Langkah:`);
console.log(`   1. Buka Supabase → SQL Editor`);
console.log(`   2. Jalankan bagian "1. Buat record impor_data" → catat ID`);
console.log(`   3. Ganti semua <IMPOR_ID> di file dengan ID tersebut`);
console.log(`   4. Jalankan bagian "2. Insert kandidat"`);
console.log(`   5. Jalankan bagian "3. Insert hasil_wawancara"`);
