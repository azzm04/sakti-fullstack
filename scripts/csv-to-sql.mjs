/**
 * Script: Konversi CSV pendaftar KIP-K -> SQL INSERT (siap jalan, tanpa edit manual)
 *
 * Kolom-kolom di bawah ini diverifikasi LANGSUNG terhadap skema database yang
 * sesungguhnya (information_schema, bukan cuma dugaan dari kode aplikasi):
 *  - `kandidat`   : hanya field yang benar-benar ada & diisi saat import
 *                   (lihat app/api/kandidat/route.ts).
 *  - `hasil_wawancara` : validasi_kks/kip/sktm, ekonomi riil, kepemilikan_rumah
 *                   (kode angka, lihat OPT_KEPEMILIKAN di FormObservasi.tsx),
 *                   aset, kondisi_rumah, rekomendasi, hasil_akhir.
 *  - `detail_ekonomi_wawancara` : tabel ANAK terpisah dari hasil_wawancara —
 *                   luas_tanah/luas_bangunan/sumber_air/mck/tahun_perolehan/
 *                   jml_tanggungan_sebenarnya TIDAK ada di hasil_wawancara,
 *                   harus di-insert ke sini dan dihubungkan via hasil_wawancara_id.
 *  - `pewawancara` : TIDAK punya kolom `idx` (itu bukan kolom DB, hanya field
 *                   tambahan dari data yang diberikan pengguna).
 *  - `impor_data`  : TIDAK punya kolom `updated_at`.
 *
 * Parser CSV sadar multi-baris di dalam field ber-quote (field IG/Prestasi yang
 * mengandung newline tidak lagi merusak baris berikutnya). UUID digenerate
 * langsung di JavaScript dan ditulis eksplisit ke SQL, jadi file .sql yang
 * dihasilkan tinggal dijalankan utuh (BEGIN...COMMIT), tanpa edit manual.
 *
 * Jalankan: node scripts/csv-to-sql.mjs
 * Output  : scripts/insert_kandidat.sql
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dir = dirname(fileURLToPath(import.meta.url));

// ============================================================================
// KONFIGURASI
// ============================================================================

// Admin yang menjalankan import (admin_users.uuid_id) — diambil dari data
// pewawancara yang diberikan (admin_id di sana adalah admin yang membuat akun ini).
const ADMIN_ID = "a5278d69-6c85-445f-b415-22778af74cbd";

// Pewawancara yang "bertugas" untuk seluruh data hasil wawancara yang di-generate
// di bawah ini. Nilainya persis seperti yang diberikan (row asli tabel pewawancara).
const PEWAWANCARA = {
  id: "06d135c9-4443-4d8a-a587-907235cc2eb7",
  admin_id: "a5278d69-6c85-445f-b415-22778af74cbd",
  user_id: "f14d9592-a57e-4d7f-a102-8182e411b798",
  nama: "Azzam",
  is_active: true,
  total_assigned: 0,
  total_completed: 0,
  created_at: "2026-08-16 08:09:30.525832+00",
  updated_at: "2026-08-16 08:09:30.525832+00",
};

// Tahun seleksi untuk batch impor ini.
const TAHUN_SELEKSI = 2026;

// Daftar file sumber yang akan diproses. Tambahkan baris baru di sini kalau ada
// file CSV lain (mis. "SNBT Non Eligible", "SNBP Non Eligible"). File yang tidak
// ditemukan di folder scripts/ otomatis dilewati (tidak bikin script gagal).
const SOURCES = [
  { file: "Data Verifikasi Validasi_SNBP Eligible_.csv", jalurMasuk: "SNBP Eligible" },
  { file: "Data Verifikasi Validasi_SNBT Eligible_.csv", jalurMasuk: "SNBT Eligible" },
  { file: "Data_Verifikasi_Validasi_SNBP_Eligible.csv", jalurMasuk: "SNBP Eligible" },
  { file: "Data_Verifikasi_Validasi_SNBT_Eligible.csv", jalurMasuk: "SNBT Eligible" },
  { file: "Data_Verifikasi Validasi_SNBP_NON_ELIGIBLE.csv", jalurMasuk: "SNBP Non Eligible" },
  { file: "Data_Verifikasi_Validasi_SNBT_NON_ELIGIBLE.csv", jalurMasuk: "SNBT Non Eligible" },
]
  .filter((s) => existsSync(join(__dir, s.file)))
  // Kalau ada dua file kebetulan memetakan ke jalur_masuk yang sama, jangan proses dobel.
  .filter((s, i, arr) => arr.findIndex((x) => x.jalurMasuk === s.jalurMasuk) === i);

if (SOURCES.length === 0) {
  console.error(
    "❌ Tidak ada file CSV sumber yang ditemukan di scripts/. " +
      "Taruh file CSV (lihat daftar SOURCES di dalam script ini) lalu jalankan ulang.",
  );
  process.exit(1);
}

const CHUNK_SIZE = 200; // jumlah baris per statement INSERT (aman utk SQL editor)

// ============================================================================
// CSV PARSER — sadar quote & newline di dalam field
// ============================================================================
function parseCsv(raw) {
  const text = raw.replace(/^﻿/, ""); // buang BOM di awal file
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ";") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cell += ch;
  }
  // baris terakhir (tanpa newline penutup)
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((c) => c.trim() !== "")) rows.push(row);
  }
  return rows;
}

// ============================================================================
// HELPER — pemetaan header (case-insensitive + fallback nama lama/baru)
// ============================================================================
function buildColIndex(header) {
  const norm = header.map((h) => h.trim().toLowerCase());
  const find = (...candidates) => {
    for (const c of candidates) {
      const i = norm.indexOf(c.trim().toLowerCase());
      if (i >= 0) return i;
    }
    // fallback: cocokkan awal string (menangani variasi suffix header)
    for (const c of candidates) {
      const i = norm.findIndex((h) => h.startsWith(c.trim().toLowerCase()));
      if (i >= 0) return i;
    }
    return -1;
  };

  return {
    no: find("no"),
    no_pendaftaran: find("No. Pendaftaran KIP"),
    nama: find("Nama Siswa2", "Nama Siswa"),
    prodi: find("Prodi"),
    nik: find("NIK"),
    no_kk: find("No. Kartu Keluarga"),
    nik_kepala: find("NIK Kepala Keluarga"),
    nisn: find("NISN"),
    aktif_dtsen: find("Aktif DTSEN"),
    validasi_aktif_dtsen: find("Validasi Aktif DTSEN", "Validasi AKTIF DTSEN", "Validasi DTKS"),
    desil_dtsen: find("Desil DTSEN"),
    validasi_desil_dtsen: find("Validasi Desil DTSEN", "Validasi DESIL DTSEN", "Validasi P3KE"),
    no_kip: find("No. KIP"),
    validasi_kip: find("Validasi KIP"),
    no_kks: find("No. KKS"),
    asal_sekolah: find("Asal Sekolah"),
    kab_kota_sekolah: find("Kab/Kota Sekolah"),
    provinsi_sekolah: find("Provinsi Sekolah"),
    tempat_lahir: find("Tempat Lahir"),
    tanggal_lahir: find("Tanggal Lahir"),
    jenis_kelamin: find("Jenis Kelamin"),
    alamat: find("Alamat Tinggal"),
    no_hp: find("No. Handphone"),
    email: find("Alamat Email"),
    sosmed: find("Alamat IG/ Twitter/ Tiktok"),
    pekerjaan_ayah: find("Pekerjaan Ayah"),
    ket_pekerjaan_ayah: find("Ket. Pekerjaan Ayah"),
    penghasilan_ayah_range: find("Penghasilan Ayah"),
    ket_penghasilan_ayah: find("Ket. Penghasilan Ayah/ bln", "Ket. Penghasilan Ayah/bln"),
    status_ayah: find("Status Ayah"),
    pekerjaan_ibu: find("Pekerjaan Ibu"),
    ket_pekerjaan_ibu: find("Ket. Pekerjaan Ibu"),
    penghasilan_ibu_range: find("Penghasilan Ibu"),
    ket_penghasilan_ibu: find("Ket. Penghasilan Ibu/ bln", "Ket. Penghasilan Ibu/bln"),
    status_ibu: find("Status Ibu"),
    penghasilan_lain: find("Penghasilan lain/ bln", "Penghasilan lain/bln"),
    jumlah_tanggungan: find("Jumlah Tanggungan"),
    jml_tanggungan_sebenarnya: find("Jml Tanggungan Sebenarnya"),
    nominal_per_kapita: find("Nominal per kapita"),
    kepemilikan_rumah: find("Kepemilikan Rumah"),
    tahun_perolehan: find("Tahun Perolehan"),
    sumber_listrik: find("Sumber Listrik"),
    luas_tanah: find("Luas Tanah"),
    luas_bangunan: find("Luas Bangunan"),
    sumber_air: find("Sumber Air"),
    mck: find("MCK"),
    kondisi_rumah: find("Kondisi Rumah"),
    jarak: find("Jarak Pusat Kota (KM)"),
    prestasi: find("Prestasi"),
    rekomendasi: find("Rekomendasi"),
    alasan: find("Alasan"),
    pewawancara_csv: find("Nama Pewawancara"),
    alasan_penguat: find("Alasan Penguat nanti jadi role model undip"),
  };
}

// ============================================================================
// HELPER — escaping & parsing nilai
// ============================================================================
const BLANK_TOKENS = new Set(["", "-", "—", "#div/0!", "#value!", "n/a", "tidak ada data"]);

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  const s = String(val).trim();
  if (BLANK_TOKENS.has(s.toLowerCase())) return "NULL";
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

/** Ambil angka dari format IDR / range "Rp. X - Rp. Y" / desimal koma / "N Orang" dll. */
function parseNum(val) {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (BLANK_TOKENS.has(s.toLowerCase())) return null;
  s = s.replace(/rp\.?/gi, "").trim();
  s = s.split("-")[0].trim(); // ambil batas bawah kalau berupa range
  s = s.replace(/\./g, "").replace(",", "."); // titik ribuan -> hapus, koma desimal -> titik
  s = s.replace(/[^\d.]/g, ""); // buang sisa teks (mis. "Orang", "km")
  if (s === "" || s === ".") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** "05/07/2007" -> "2007-07-05". Fallback ke null kalau tidak bisa diparse. */
function parseDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  if (BLANK_TOKENS.has(s.toLowerCase())) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const dt = new Date(s);
  if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  return null;
}

/** "ada" -> true, "tidak ada" -> false, selain itu -> null (tidak diketahui). */
function toBool(val) {
  if (!val) return null;
  const s = String(val).trim().toLowerCase();
  if (BLANK_TOKENS.has(s)) return null;
  if (s === "ada" || s === "true" || s === "ya") return true;
  if (s === "tidak ada" || s === "false" || s === "tidak") return false;
  return null;
}

function sqlBool(b) {
  return b === true ? "TRUE" : b === false ? "FALSE" : "NULL";
}

/** true kalau field CSV benar-benar berisi data (bukan "-", kosong, dll). */
function hasValue(val) {
  if (val === null || val === undefined) return false;
  return !BLANK_TOKENS.has(String(val).trim().toLowerCase());
}

/** Deteksi NIK/NIK-KK yang rusak jadi notasi ilmiah Excel (mis. "3,30606E+15"). */
function isScientificNotation(val) {
  return /^-?\d+(?:[.,]\d+)?e\+\d+$/i.test(String(val ?? "").trim());
}

/** CSV "Rekomendasi" (Diusulkan/Tidak diusulkan) -> enum rekomendasi di DB. */
function mapRekomendasi(text) {
  if (!text) return null;
  const t = String(text).toLowerCase();
  if (t.includes("tidak diusulkan") || t.includes("tidak layak")) return "Tidak Layak";
  if (t.includes("diusulkan") || t.includes("layak")) return "Layak";
  return null;
}

/** Rekomendasi final -> hasil_akhir (samakan dengan autoHasilAkhir() di schemas/index.ts). */
function mapHasilAkhir(rekomendasi) {
  if (rekomendasi === "Layak") return "Diusulkan";
  if (rekomendasi === "Tidak Layak") return "Tidak Diusulkan";
  return null;
}

function composeAset(sumberListrik, prestasi) {
  const parts = [];
  if (sumberListrik && !BLANK_TOKENS.has(String(sumberListrik).trim().toLowerCase())) {
    parts.push(`Sumber listrik: ${sumberListrik.trim()}`);
  }
  if (prestasi && !BLANK_TOKENS.has(String(prestasi).trim().toLowerCase())) {
    parts.push(`Prestasi: ${prestasi.replace(/\s+/g, " ").trim()}`);
  }
  return parts.length ? parts.join(" | ") : null;
}

function composeCatatanAdmin(pewawancaraCsv, alasanPenguat) {
  const parts = [];
  if (pewawancaraCsv && !BLANK_TOKENS.has(String(pewawancaraCsv).trim().toLowerCase())) {
    parts.push(`Pewawancara lapangan (data asal CSV): ${pewawancaraCsv.trim()}`);
  }
  if (alasanPenguat && !BLANK_TOKENS.has(String(alasanPenguat).trim().toLowerCase())) {
    parts.push(`Catatan tambahan: ${alasanPenguat.replace(/\s+/g, " ").trim()}`);
  }
  return parts.length ? parts.join(" | ") : null;
}

/**
 * CSV "Kepemilikan Rumah" (teks bebas) -> kode smallint di DB, sesuai
 * OPT_KEPEMILIKAN di components/pewawancara/detail/FormObservasi.tsx:
 *   1 = Milik Sendiri, 2 = Sewa, 3 = Tidak Memiliki, 4 = Menumpang.
 */
function mapKepemilikanRumah(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("tidak memiliki")) return 3;
  if (t.includes("menumpang")) return 4;
  if (t.includes("sewa")) return 2;
  if (t.includes("sendiri") || t.includes("milik")) return 1;
  return null;
}

/**
 * CSV "Sumber Air" -> kode smallint, sesuai OPT_SUMBER_AIR di FormObservasi.tsx:
 *   1 = Sumur, 2 = PDAM, 3 = Sungai/Mata Air.
 * Kategori CSV di luar 3 ini (mis. "Air Kemasan") tidak punya padanan -> NULL.
 */
function mapSumberAir(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("sumur")) return 1;
  if (t.includes("pdam")) return 2;
  if (t.includes("sungai") || t.includes("mata air")) return 3;
  return null;
}

/**
 * CSV "MCK" -> kode smallint, sesuai OPT_MCK di FormObservasi.tsx:
 *   1 = Berbagi Pakai, 2 = Milik Sendiri.
 */
function mapMck(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("berbagi")) return 1;
  if (t.includes("sendiri")) return 2;
  return null;
}

/**
 * Ambil satu angka representatif dari teks luas tanah/bangunan yang berupa
 * rentang, mis. "100 - 200 M2" -> 150, "< 25 M2" -> 20, ">200 M2" -> 220,
 * "74,5 M2" -> 74.5. detail_ekonomi_wawancara.luas_tanah/luas_bangunan adalah
 * double precision (satu angka), bukan teks rentang.
 */
function parseAreaRange(val) {
  if (!hasValue(val)) return null;
  const s = String(val).toLowerCase().replace(/m2|m²/g, "").trim();
  const nums = (s.match(/\d+(?:[.,]\d+)?/g) || []).map((n) => parseFloat(n.replace(",", ".")));
  if (nums.length === 0) return null;
  if (nums.length >= 2) return Math.round(((nums[0] + nums[1]) / 2) * 10) / 10;
  if (s.startsWith("<")) return Math.round((nums[0] / 2) * 10) / 10;
  if (s.startsWith(">")) return Math.round((nums[0] + 20) * 10) / 10;
  return nums[0];
}

/** "Tahun Perolehan" -> tahun (smallint). Menerima "2015" atau "2015-2016" (ambil yang pertama). */
function parseYearInt(val) {
  const n = parseNum(val);
  if (n === null) return null;
  const year = Math.round(n);
  return year >= 1900 && year <= 2100 ? year : null;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ============================================================================
// PROSES SETIAP FILE SUMBER
// ============================================================================
const sqlParts = [];
let scientificIdWarnings = 0;
let grandTotalKandidat = 0;
let grandTotalWawancara = 0;

sqlParts.push(`-- ============================================================`);
sqlParts.push(`-- Generated by scripts/csv-to-sql.mjs pada ${new Date().toISOString()}`);
sqlParts.push(`-- Jalankan file ini APA ADANYA di Supabase SQL Editor (top to bottom).`);
sqlParts.push(`-- Semua UUID sudah digenerate eksplisit -- tidak perlu edit manual.`);
sqlParts.push(`-- ============================================================`);
sqlParts.push(``);
sqlParts.push(`BEGIN;`);
sqlParts.push(``);

// ── 0. Pastikan pewawancara "bertugas" ada (idempotent) ─────────────────────
sqlParts.push(`-- ------------------------------------------------------------`);
sqlParts.push(`-- 0. Pewawancara yang bertugas untuk seluruh data di bawah ini`);
sqlParts.push(`-- ------------------------------------------------------------`);
sqlParts.push(`INSERT INTO public.pewawancara (`);
sqlParts.push(`  id, admin_id, user_id, nama, is_active, total_assigned, total_completed, created_at, updated_at`);
sqlParts.push(`) VALUES (`);
sqlParts.push(
  `  ${esc(PEWAWANCARA.id)}, ${esc(PEWAWANCARA.admin_id)}, ${esc(PEWAWANCARA.user_id)}, ${esc(PEWAWANCARA.nama)}, ${sqlBool(PEWAWANCARA.is_active)},`,
);
sqlParts.push(
  `  ${PEWAWANCARA.total_assigned}, ${PEWAWANCARA.total_completed}, ${esc(PEWAWANCARA.created_at)}, ${esc(PEWAWANCARA.updated_at)}`,
);
sqlParts.push(`)`);
sqlParts.push(`ON CONFLICT (id) DO NOTHING;`);
sqlParts.push(``);

for (const source of SOURCES) {
  const csvPath = join(__dir, source.file);
  const raw = readFileSync(csvPath, "utf-8");
  const table = parseCsv(raw);

  if (table.length < 2) {
    console.warn(`⚠️  ${source.file}: tidak ada data, dilewati.`);
    continue;
  }

  const header = table[0];
  const COL = buildColIndex(header);
  const dataRows = table.slice(1);

  const missingCols = Object.entries(COL)
    .filter(([, i]) => i < 0)
    .map(([k]) => k);
  if (missingCols.length) {
    console.warn(`⚠️  ${source.file}: kolom tidak ditemukan -> ${missingCols.join(", ")}`);
  }

  const impor_data_id = randomUUID();
  const jenisImpor = source.jalurMasuk;

  const kandidatRows = [];
  const wawancaraRows = [];
  const detailEkonomiRows = [];
  const seenNik = new Set();
  let errorRows = 0;
  let dupRows = 0;

  dataRows.forEach((cols, rowIdx) => {
    const g = (key) => {
      const i = COL[key];
      if (i === undefined || i < 0) return "";
      return (cols[i] ?? "").trim();
    };

    const nama = g("nama");
    const nik = g("nik");

    if (!nama && !nik) {
      errorRows++;
      return; // baris kosong / tidak bisa diproses
    }

    if (hasValue(nik)) {
      if (isScientificNotation(nik)) scientificIdWarnings++;
      if (seenNik.has(nik)) dupRows++;
      seenNik.add(nik);
    }

    const kandidatId = randomUUID();
    const no = parseInt(g("no"), 10) || rowIdx + 1;

    const penghasilanAyah =
      parseNum(g("ket_penghasilan_ayah")) ?? parseNum(g("penghasilan_ayah_range"));
    const penghasilanIbu =
      parseNum(g("ket_penghasilan_ibu")) ?? parseNum(g("penghasilan_ibu_range"));
    const jumlahTanggungan = parseNum(g("jumlah_tanggungan"));
    const jarak = parseNum(g("jarak"));

    // ── kandidat: hanya kolom yang benar-benar diisi saat import (lihat
    //    app/api/kandidat/route.ts) — field verifikasi/wawancara HANYA ada di
    //    hasil_wawancara supaya tidak bentrok dengan skema DB yang sebenarnya.
    kandidatRows.push(
      [
        esc(kandidatId),
        esc(impor_data_id),
        no,
        esc(g("no_pendaftaran")),
        esc(g("no_kip")),
        esc(g("no_kks")),
        esc(nama),
        esc(g("prodi")),
        esc(nik),
        esc(g("no_kk")),
        esc(g("nik_kepala")),
        esc(g("nisn")),
        esc(g("asal_sekolah")),
        esc(g("aktif_dtsen")),
        esc(g("desil_dtsen")),
        esc(g("tempat_lahir")),
        esc(parseDate(g("tanggal_lahir"))),
        esc(g("jenis_kelamin")),
        esc(g("alamat")),
        esc(g("no_hp")),
        esc(g("email")),
        esc(g("pekerjaan_ayah")),
        esc(g("pekerjaan_ibu")),
        penghasilanAyah !== null ? Math.round(penghasilanAyah) : "NULL",
        penghasilanIbu !== null ? Math.round(penghasilanIbu) : "NULL",
        jumlahTanggungan !== null ? Math.round(jumlahTanggungan) : "NULL",
        esc(g("kab_kota_sekolah")),
        esc(g("provinsi_sekolah")),
        esc(jenisImpor),
        jarak !== null ? jarak : "NULL",
      ].join(", "),
    );

    // ── hasil_wawancara: "seolah-olah sudah diwawancarai" — semua field
    //    lapangan diisi dari data CSV yang sudah berisi hasil wawancara asli.
    const jmlSebenarnya = parseNum(g("jml_tanggungan_sebenarnya"));
    const penghasilanLain = parseNum(g("penghasilan_lain"));
    const rekomendasi = mapRekomendasi(g("rekomendasi"));
    const hasilAkhir = mapHasilAkhir(rekomendasi);
    const aset = composeAset(g("sumber_listrik"), g("prestasi"));
    const catatanAdmin = composeCatatanAdmin(g("pewawancara_csv"), g("alasan_penguat"));

    const hasilWawancaraId = randomUUID();

    wawancaraRows.push(
      [
        esc(hasilWawancaraId),
        esc(kandidatId),
        esc(PEWAWANCARA.id),
        sqlBool(hasValue(g("no_kks"))),
        sqlBool(toBool(g("validasi_kip"))),
        "NULL", // validasi_sktm — tidak ada sumber data di CSV
        esc(g("sosmed")),
        esc(g("ket_pekerjaan_ayah")),
        penghasilanAyah !== null ? Math.round(penghasilanAyah) : "NULL",
        esc(g("ket_pekerjaan_ibu")),
        penghasilanIbu !== null ? Math.round(penghasilanIbu) : "NULL",
        penghasilanLain !== null ? Math.round(penghasilanLain) : "NULL",
        jmlSebenarnya !== null ? Math.round(jmlSebenarnya) : "NULL", // jumlah_orang_rumah
        jmlSebenarnya !== null ? Math.round(jmlSebenarnya) : "NULL", // validasi_orang_rumah
        mapKepemilikanRumah(g("kepemilikan_rumah")) ?? "NULL",
        esc(aset),
        esc(g("kondisi_rumah")),
        esc(rekomendasi),
        esc(g("alasan")),
        "FALSE", // is_draft — dianggap sudah selesai diwawancarai
        "now()",
        esc(hasilAkhir),
        esc(catatanAdmin),
      ].join(", "),
    );

    // ── detail_ekonomi_wawancara: tabel anak terpisah, field ekonomi riil
    //    yang bersumber dari observasi lapangan (luas rumah, sumber
    //    air/listrik, MCK, tahun perolehan rumah).
    detailEkonomiRows.push(
      [
        esc(randomUUID()),
        esc(hasilWawancaraId),
        penghasilanLain !== null ? Math.round(penghasilanLain) : "NULL",
        jmlSebenarnya !== null ? Math.round(jmlSebenarnya) : "NULL",
        parseYearInt(g("tahun_perolehan")) ?? "NULL",
        parseAreaRange(g("luas_tanah")) ?? "NULL",
        parseAreaRange(g("luas_bangunan")) ?? "NULL",
        "NULL", // daya_listrik — tidak ada sumber data di CSV
        mapSumberAir(g("sumber_air")) ?? "NULL",
        mapMck(g("mck")) ?? "NULL",
      ].join(", "),
    );
  });

  grandTotalKandidat += kandidatRows.length;
  grandTotalWawancara += wawancaraRows.length;

  // ── impor_data (batch) ─────────────────────────────────────────────────
  sqlParts.push(`-- ------------------------------------------------------------`);
  sqlParts.push(`-- ${source.file}  ->  jalur_masuk = "${jenisImpor}"`);
  sqlParts.push(`-- impor_data_id = ${impor_data_id}`);
  sqlParts.push(`-- ------------------------------------------------------------`);
  sqlParts.push(`INSERT INTO public.impor_data (`);
  sqlParts.push(`  id, admin_id, jenis_impor, file_name, total_rows, valid_rows, error_rows, dup_rows, tahun_seleksi, created_at`);
  sqlParts.push(`) VALUES (`);
  sqlParts.push(
    `  ${esc(impor_data_id)}, ${esc(ADMIN_ID)}, ${esc(jenisImpor)}, ${esc(source.file)}, ${dataRows.length}, ${kandidatRows.length}, ${errorRows}, ${dupRows}, ${TAHUN_SELEKSI}, now()`,
  );
  sqlParts.push(`);`);
  sqlParts.push(``);

  // ── kandidat ─────────────────────────────────────────────────────────
  sqlParts.push(`-- Kandidat (${kandidatRows.length} baris)`);
  for (const part of chunk(kandidatRows, CHUNK_SIZE)) {
    sqlParts.push(`INSERT INTO public.kandidat (`);
    sqlParts.push(`  id, impor_data_id, no, no_pendaftaran_kipk, no_kip, no_kks,`);
    sqlParts.push(`  nama_pendaftar, prodi_pendaftar, nik, no_kartu_keluarga, nik_kepala_keluarga, nisn,`);
    sqlParts.push(`  asal_sekolah, aktif_dtsen, desil_dtsen,`);
    sqlParts.push(`  tempat_lahir, tanggal_lahir, jenis_kelamin,`);
    sqlParts.push(`  alamat, no_hp, email,`);
    sqlParts.push(`  pekerjaan_ayah, pekerjaan_ibu, penghasilan_ayah, penghasilan_ibu, jumlah_tanggungan,`);
    sqlParts.push(`  kab_kota, provinsi, jalur_masuk, jarak_pusat_kota`);
    sqlParts.push(`) VALUES`);
    sqlParts.push(part.map((r) => `  (${r})`).join(",\n") + ";");
    sqlParts.push(``);
  }

  // ── hasil_wawancara ──────────────────────────────────────────────────
  sqlParts.push(`-- Hasil wawancara (${wawancaraRows.length} baris) — seolah-olah sudah diwawancarai`);
  for (const part of chunk(wawancaraRows, CHUNK_SIZE)) {
    sqlParts.push(`INSERT INTO public.hasil_wawancara (`);
    sqlParts.push(`  id, kandidat_id, pewawancara_id,`);
    sqlParts.push(`  validasi_kks, validasi_kip, validasi_sktm,`);
    sqlParts.push(`  sosial_media, ket_pekerjaan_ayah, ket_penghasilan_ayah, ket_pekerjaan_ibu, ket_penghasilan_ibu,`);
    sqlParts.push(`  penghasilan_lain, jumlah_orang_rumah, validasi_orang_rumah,`);
    sqlParts.push(`  kepemilikan_rumah, aset,`);
    sqlParts.push(`  kondisi_rumah,`);
    sqlParts.push(`  rekomendasi, alasan, is_draft, interviewed_at, hasil_akhir, catatan_admin`);
    sqlParts.push(`) VALUES`);
    sqlParts.push(part.map((r) => `  (${r})`).join(",\n") + ";");
    sqlParts.push(``);
  }

  // ── detail_ekonomi_wawancara ─────────────────────────────────────────
  sqlParts.push(`-- Detail ekonomi wawancara (${detailEkonomiRows.length} baris)`);
  for (const part of chunk(detailEkonomiRows, CHUNK_SIZE)) {
    sqlParts.push(`INSERT INTO public.detail_ekonomi_wawancara (`);
    sqlParts.push(`  id, hasil_wawancara_id, penghasilan_lain, jml_tanggungan_sebenarnya,`);
    sqlParts.push(`  tahun_perolehan, luas_tanah, luas_bangunan, daya_listrik, sumber_air, mck`);
    sqlParts.push(`) VALUES`);
    sqlParts.push(part.map((r) => `  (${r})`).join(",\n") + ";");
    sqlParts.push(``);
  }

  console.log(
    `✅ ${source.file}: ${kandidatRows.length} kandidat, ${wawancaraRows.length} hasil_wawancara` +
      (errorRows ? `, ${errorRows} baris dilewati (kosong)` : "") +
      (dupRows ? `, ${dupRows} NIK duplikat` : ""),
  );
}

// ── Update statistik pewawancara setelah semua batch diproses ──────────────
sqlParts.push(`-- ------------------------------------------------------------`);
sqlParts.push(`-- Update statistik pewawancara "bertugas" (semua wawancara di atas selesai)`);
sqlParts.push(`-- ------------------------------------------------------------`);
sqlParts.push(`UPDATE public.pewawancara`);
sqlParts.push(`SET total_assigned = total_assigned + ${grandTotalWawancara},`);
sqlParts.push(`    total_completed = total_completed + ${grandTotalWawancara},`);
sqlParts.push(`    updated_at = now()`);
sqlParts.push(`WHERE id = ${esc(PEWAWANCARA.id)};`);
sqlParts.push(``);
sqlParts.push(`COMMIT;`);

// ============================================================================
// TULIS FILE OUTPUT
// ============================================================================
const outPath = join(__dir, "insert_kandidat.sql");
writeFileSync(outPath, sqlParts.join("\n"), "utf-8");

console.log(`\n✅ SQL berhasil digenerate: ${outPath}`);
console.log(`   Total kandidat        : ${grandTotalKandidat}`);
console.log(`   Total hasil_wawancara : ${grandTotalWawancara}`);
console.log(`   Pewawancara bertugas  : ${PEWAWANCARA.nama} (${PEWAWANCARA.id})`);
if (scientificIdWarnings > 0) {
  console.log(
    `\n⚠️  ${scientificIdWarnings} NIK/NIK-KK terdeteksi dalam notasi ilmiah Excel (mis. "3,30606E+15").` +
      `\n   Digit aslinya sudah hilang saat file di-export dari Excel — tidak bisa dipulihkan oleh script ini.` +
      `\n   Export ulang CSV dengan kolom NIK diformat sebagai Text agar datanya presisi.`,
  );
}
console.log(`\n📋 Langkah selanjutnya:`);
console.log(`   1. Buka Supabase -> SQL Editor`);
console.log(`   2. Paste isi scripts/insert_kandidat.sql lalu Run (satu file, satu kali jalan, sudah BEGIN...COMMIT)`);
