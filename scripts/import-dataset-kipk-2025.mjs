/**
 * Jalankan:
 *   node scripts/import-dataset-kipk-2025.mjs             -> dry run (tanpa insert)
 *   node scripts/import-dataset-kipk-2025.mjs --commit     -> insert sungguhan (1 transaksi)
 */

import XLSX from "xlsx";
import { randomUUID, randomInt } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");

// ============================================================================
// ENV
// ============================================================================
function loadEnv(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i < 0 || line.trim().startsWith("#")) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}
const env = loadEnv(join(ROOT, ".env.local"));

const COMMIT = process.argv.includes("--commit");

// ============================================================================
// KONFIGURASI
// ============================================================================
const ADMIN_ID = "a5278d69-6c85-445f-b415-22778af74cbd";
const PEWAWANCARA_ID = "06d135c9-4443-4d8a-a587-907235cc2eb7";
const TAHUN_SELEKSI = 2025;
const XLSX_PATH = join(ROOT, "scripts", "DATASET_KIPK_2025.xlsx");

const SHEETS = [
  { name: "SNBT non Eligible", jalurMasuk: "SNBT Non Eligible" },
  { name: "SNBT ELIGIBLE", jalurMasuk: "SNBT Eligible" },
];

// ============================================================================
// HELPER — parsing nilai (diadaptasi dari scripts/csv-to-sql.mjs)
// ============================================================================
const BLANK_TOKENS = new Set(["", "-", "—", "#div/0!", "#value!", "n/a", "tidak ada data"]);

function hasValue(val) {
  if (val === null || val === undefined) return false;
  return !BLANK_TOKENS.has(String(val).trim().toLowerCase());
}

function nn(val) {
  return hasValue(val) ? String(val).trim() : null;
}

function parseNum(val) {
  if (val === null || val === undefined) return null;
  let s = String(val).trim();
  if (BLANK_TOKENS.has(s.toLowerCase())) return null;
  s = s.replace(/rp\.?/gi, "").trim();
  s = s.split("-")[0].trim();
  s = s.replace(/\./g, "").replace(",", ".");
  s = s.replace(/[^\d.]/g, "");
  if (s === "" || s === ".") return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function round(val) {
  return val === null ? null : Math.round(val);
}

function toBool(val) {
  if (!hasValue(val)) return null;
  const s = String(val).trim().toLowerCase();
  if (s === "ada" || s === "true" || s === "ya") return true;
  if (s === "tidak ada" || s === "false" || s === "tidak") return false;
  return null;
}

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

function parseYearInt(val) {
  const n = parseNum(val);
  if (n === null) return null;
  const year = Math.round(n);
  return year >= 1900 && year <= 2100 ? year : null;
}

function mapKepemilikanRumah(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("tidak memiliki")) return 3;
  if (t.includes("menumpang")) return 4;
  if (t.includes("sewa")) return 2;
  if (t.includes("sendiri") || t.includes("milik") || t.includes("kakek") || t.includes("warisan")) return 1;
  return null;
}

function mapSumberAir(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("pdam")) return 2;
  if (t.includes("sumur")) return 1;
  if (t.includes("sungai") || t.includes("mata air")) return 3;
  return null;
}

function mapMck(val) {
  if (!hasValue(val)) return null;
  const t = String(val).toLowerCase();
  if (t.includes("berbagi")) return 1;
  if (t.includes("sendiri")) return 2;
  return null;
}

function mapRekomendasi(text) {
  if (!hasValue(text)) return null;
  const t = String(text).toLowerCase();
  if (t.includes("tidak diusulkan") || t.includes("tidak direkomendasikan") || t.includes("tidak layak")) {
    return "Tidak Layak";
  }
  if (t.includes("diusulkan") || t.includes("direkomendasikan") || t.includes("layak")) return "Layak";
  return null;
}

function mapHasilAkhir(rekomendasi) {
  if (rekomendasi === "Layak") return "Diusulkan";
  if (rekomendasi === "Tidak Layak") return "Tidak Diusulkan";
  return null;
}

function composeAset(sumberListrik, prestasi) {
  const parts = [];
  if (hasValue(sumberListrik)) parts.push(`Sumber listrik: ${String(sumberListrik).trim()}`);
  if (hasValue(prestasi)) parts.push(`Prestasi: ${String(prestasi).replace(/\s+/g, " ").trim()}`);
  return parts.length ? parts.join(" | ") : null;
}

function composeKondisiOrangTua(statusAyah, statusIbu) {
  const parts = [];
  if (hasValue(statusAyah)) parts.push(`Ayah ${String(statusAyah).trim()}`);
  if (hasValue(statusIbu)) parts.push(`Ibu ${String(statusIbu).trim()}`);
  const s = parts.join(", ");
  return s ? s.slice(0, 30) : null;
}

function composeCatatanAdmin(parts) {
  const filtered = parts.filter((p) => hasValue(p));
  return filtered.length ? filtered.join(" | ") : null;
}

/** "Terdata: Desil 4" -> { aktif: "Terdata", desil: "Desil 4" }; "Belum Terdata" -> { aktif: "Belum Terdata", desil: null } */
function parseStatusDtsen(val) {
  if (!hasValue(val)) return { aktif: null, desil: null };
  const s = String(val).trim();
  const m = s.match(/^(.*?):\s*(.*)$/);
  if (m) return { aktif: m[1].trim(), desil: m[2].trim() || null };
  return { aktif: s, desil: null };
}

// SINTESIS IDENTITAS
const MALE_NAMES = [
  "Ahmad", "Muhammad", "Bayu", "Dedi", "Eko", "Fajar", "Galih", "Hendra", "Irfan", "Joko",
  "Krisna", "Luthfi", "Made", "Nanda", "Oscar", "Panji", "Rizky", "Satrio", "Taufik", "Umar",
  "Wahyu", "Yusuf", "Zaki", "Arif", "Bagus", "Candra", "Dimas", "Erlangga", "Fadli", "Gunawan",
];
const FEMALE_NAMES = [
  "Ayu", "Bella", "Citra", "Dewi", "Eka", "Fitri", "Gita", "Hana", "Indah", "Jihan",
  "Kirana", "Laila", "Maya", "Nadia", "Okta", "Putri", "Ratna", "Sari", "Tia", "Uswatun",
  "Vina", "Wulan", "Yuni", "Zahra", "Amelia", "Bunga", "Cinta", "Dian", "Elisa", "Farah",
];
const LAST_NAMES = [
  "Pratama", "Saputra", "Wijaya", "Kusuma", "Setiawan", "Nugroho", "Santoso", "Wibowo",
  "Hidayat", "Ramadhan", "Firmansyah", "Utomo", "Handayani", "Lestari", "Anggraini",
  "Maharani", "Puspita", "Rahayu", "Susanti", "Yulianti", "Permana", "Prasetyo", "Gunawan",
  "Kurniawan", "Siregar", "Nasution", "Simanjuntak", "Halim", "Wahyudi", "Purnomo",
];
const CITIES = [
  { kota: "Kota Semarang", provinsi: "Jawa Tengah", kode: "337404" },
  { kota: "Kabupaten Kendal", provinsi: "Jawa Tengah", kode: "332405" },
  { kota: "Kota Surakarta", provinsi: "Jawa Tengah", kode: "331603" },
  { kota: "Kabupaten Demak", provinsi: "Jawa Tengah", kode: "331802" },
  { kota: "Kota Tegal", provinsi: "Jawa Tengah", kode: "337601" },
  { kota: "Kabupaten Pati", provinsi: "Jawa Tengah", kode: "331901" },
  { kota: "Kota Yogyakarta", provinsi: "D.I. Yogyakarta", kode: "347102" },
  { kota: "Kabupaten Sleman", provinsi: "D.I. Yogyakarta", kode: "340402" },
  { kota: "Kota Surabaya", provinsi: "Jawa Timur", kode: "357801" },
  { kota: "Kabupaten Sidoarjo", provinsi: "Jawa Timur", kode: "351501" },
  { kota: "Kota Malang", provinsi: "Jawa Timur", kode: "357302" },
  { kota: "Kota Bandung", provinsi: "Jawa Barat", kode: "327301" },
  { kota: "Kabupaten Bandung", provinsi: "Jawa Barat", kode: "320402" },
  { kota: "Kota Bekasi", provinsi: "Jawa Barat", kode: "327502" },
  { kota: "Kota Tangerang", provinsi: "Banten", kode: "367101" },
  { kota: "Kota Jakarta Selatan", provinsi: "DKI Jakarta", kode: "317403" },
  { kota: "Kota Bandar Lampung", provinsi: "Lampung", kode: "187101" },
  { kota: "Kota Palembang", provinsi: "Sumatera Selatan", kode: "167101" },
  { kota: "Kota Padang", provinsi: "Sumatera Barat", kode: "137101" },
  { kota: "Kota Medan", provinsi: "Sumatera Utara", kode: "127101" },
  { kota: "Kota Makassar", provinsi: "Sulawesi Selatan", kode: "737301" },
  { kota: "Kota Denpasar", provinsi: "Bali", kode: "517101" },
  { kota: "Kota Banjarmasin", provinsi: "Kalimantan Selatan", kode: "637101" },
  { kota: "Kota Pontianak", provinsi: "Kalimantan Barat", kode: "617101" },
  { kota: "Kota Balikpapan", provinsi: "Kalimantan Timur", kode: "647301" },
];
const SCHOOL_PREFIXES = ["SMA Negeri", "SMA Negeri", "SMK Negeri", "MA Negeri", "SMA Muhammadiyah", "SMA Kristen"];
const STREETS = [
  "Jl. Merdeka", "Jl. Sudirman", "Jl. Diponegoro", "Jl. Ahmad Yani", "Jl. Gajah Mada",
  "Jl. Pahlawan", "Jl. Kartini", "Jl. Melati", "Jl. Anggrek", "Jl. Cendrawasih",
];
const HP_PREFIXES = ["0812", "0813", "0821", "0822", "0852", "0853", "0857", "0858", "0895", "0896"];
const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

function pick(arr) {
  return arr[randomInt(arr.length)];
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function randDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += randomInt(10);
  return s;
}
function randAlnum(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += ALNUM[randomInt(ALNUM.length)];
  return s;
}
function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function synthIdentity(prodiPool) {
  const gender = randomInt(2) === 0 ? "L" : "P";
  const first = pick(gender === "L" ? MALE_NAMES : FEMALE_NAMES);
  const last = pick(LAST_NAMES);
  const nama = `${first} ${last}`;
  const city = pick(CITIES);
  const birthYear = 2006 + randomInt(3);
  const birthMonth = 1 + randomInt(12);
  const birthDay = 1 + randomInt(28);
  const tanggalLahir = `${birthYear}-${pad2(birthMonth)}-${pad2(birthDay)}`;
  const genderDigit = gender === "P" ? birthDay + 40 : birthDay;
  const nik = `${city.kode}${pad2(genderDigit)}${pad2(birthMonth)}${String(birthYear).slice(-2)}${randDigits(4)}`;
  const noKartuKeluarga = `${city.kode}${randDigits(10)}`;
  const nikKepalaKeluarga = `${city.kode}${randDigits(10)}`;
  const nisn = `00${randDigits(8)}`;
  const regMonth = 1 + randomInt(12);
  const noPendaftaran = `${pad2(regMonth)}25.${randDigits(3)}.${randDigits(5)}.${randDigits(4)}.001`;
  const noKip = randAlnum(6);
  const noKks = `KKS${randDigits(3)}`;
  const prodi = pick(prodiPool);
  const email = `${slug(first)}.${slug(last)}${randDigits(2)}@gmail.com`;
  const noHp = `${pick(HP_PREFIXES)}${randDigits(8)}`;
  const alamat = `${pick(STREETS)} No. ${1 + randomInt(99)}, ${city.kota}`;
  const asalSekolah = `${pick(SCHOOL_PREFIXES)} ${1 + randomInt(20)} ${city.kota}`;

  return {
    nama,
    jenisKelamin: gender,
    tempatLahir: city.kota,
    tanggalLahir,
    nik,
    noKartuKeluarga,
    nikKepalaKeluarga,
    nisn,
    noPendaftaran,
    noKip,
    noKks,
    prodi,
    email,
    noHp,
    alamat,
    asalSekolah,
    kabKota: city.kota,
    provinsi: city.provinsi,
  };
}

// PEMBACAAN SHEET & PEMETAAN KOLOM
function sheetToRows(workbook, sheetName) {
  const ws = workbook.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" tidak ditemukan di ${XLSX_PATH}`);
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true });
  const header = rows[0].map((h) => (h === null ? "" : String(h).trim()));
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  return { header, idx, dataRows: rows.slice(1) };
}

function buildRecords(workbook, sheetDef, prodiPool) {
  const { idx, dataRows } = sheetToRows(workbook, sheetDef.name);
  const g = (row, colName) => {
    const i = idx[colName];
    if (i === undefined) return null;
    const v = row[i];
    return v === undefined ? null : v;
  };

  const records = [];
  let skippedBlank = 0;

  for (const row of dataRows) {
    const rekomendasiRaw = g(row, "Rekomendasi");
    if (!hasValue(rekomendasiRaw)) {
      skippedBlank++;
      continue;
    }

    const identity = synthIdentity(prodiPool);

    const statusDtsen = parseStatusDtsen(g(row, "Status DTSEN"));

    const penghasilanAyahAngka =
      parseNum(g(row, "Ket. Penghasilan Ayah/ bln")) ?? parseNum(g(row, "Detail Penghasilan Ayah"));
    const penghasilanIbuAngka =
      parseNum(g(row, "Ket. Penghasilan Ibu/ bln")) ?? parseNum(g(row, "Detail Penghasilan Ibu"));
    const jumlahTanggungan = parseNum(g(row, "Jumlah Tanggungan"));
    const jmlSebenarnya = parseNum(g(row, "Jml Tanggungan Sebenarnya") ?? g(row, "Jumlah Tanggungan sebenarnya"));
    const penghasilanLain = parseNum(g(row, "Penghasilan lain/ bln") ?? g(row, "Tambahan penghasilan dari Wali/ diri sendiri"));
    const jarak = parseNum(g(row, "Jarak Pusat Kota (KM)"));

    const rekomendasi = mapRekomendasi(rekomendasiRaw);
    const hasilAkhir = mapHasilAkhir(rekomendasi);
    const aset = composeAset(g(row, "Sumber Listrik"), g(row, "Prestasi"));
    const kondisiRumahText = nn(g(row, "Kondisi Rumah") ?? g(row, "Kelayakan Rumah"));
    const kondisiOrangTua = composeKondisiOrangTua(g(row, "Status Ayah"), g(row, "Status Ibu"));
    const validasiKip = toBool(g(row, "Verifikasi KIP"));

    const pewawancaraAsli = nn(g(row, "Pewawancara") ?? g(row, "Nama Pewawancara"));
    const catatanAdmin = composeCatatanAdmin([
      pewawancaraAsli ? `Pewawancara lapangan (data asal file): ${pewawancaraAsli}` : null,
      hasValue(g(row, "Nominal Per Kapita") ?? g(row, "Nominal per kapita"))
        ? `Nominal per kapita: Rp${parseNum(g(row, "Nominal Per Kapita") ?? g(row, "Nominal per kapita"))}`
        : null,
      nn(g(row, "Urgensi untuk disurvey lebih lanjut")) ? `Urgensi survei: ${nn(g(row, "Urgensi untuk disurvey lebih lanjut"))}` : null,
      nn(g(row, "Alasan Penguat nanti jadi role model undip (untuk divisitasi Pimpinan Undip)"))
        ? `Catatan tambahan: ${nn(g(row, "Alasan Penguat nanti jadi role model undip (untuk divisitasi Pimpinan Undip)"))}`
        : null,
      nn(g(row, "Wali (jika ada)")) ? `Wali: ${nn(g(row, "Wali (jika ada)"))}` : null,
    ]);

    const kandidatId = randomUUID();
    const hasilWawancaraId = randomUUID();
    const no = g(row, "#") ?? g(row, "No");

    records.push({
      kandidat: {
        id: kandidatId,
        no: Number.isFinite(Number(no)) ? Number(no) : null,
        no_pendaftaran_kipk: identity.noPendaftaran,
        no_kip: identity.noKip,
        no_kks: identity.noKks,
        nama_pendaftar: identity.nama,
        prodi_pendaftar: identity.prodi,
        nik: identity.nik,
        no_kartu_keluarga: identity.noKartuKeluarga,
        nik_kepala_keluarga: identity.nikKepalaKeluarga,
        nisn: identity.nisn,
        asal_sekolah: identity.asalSekolah,
        aktif_dtsen: statusDtsen.aktif,
        desil_dtsen: statusDtsen.desil,
        tempat_lahir: identity.tempatLahir,
        tanggal_lahir: identity.tanggalLahir,
        jenis_kelamin: identity.jenisKelamin,
        alamat: identity.alamat,
        no_hp: identity.noHp,
        email: identity.email,
        pekerjaan_ayah: nn(g(row, "Pekerjaan Ayah")),
        pekerjaan_ibu: nn(g(row, "Pekerjaan Ibu")),
        penghasilan_ayah: round(penghasilanAyahAngka),
        penghasilan_ibu: round(penghasilanIbuAngka),
        jumlah_tanggungan: round(jumlahTanggungan),
        kab_kota: identity.kabKota,
        provinsi: identity.provinsi,
        jalur_masuk: sheetDef.jalurMasuk,
        jarak_pusat_kota: jarak,
      },
      hasilWawancara: {
        id: hasilWawancaraId,
        kandidat_id: kandidatId,
        pewawancara_id: PEWAWANCARA_ID,
        validasi_kks: null,
        validasi_kip: validasiKip,
        validasi_sktm: null,
        sosial_media: null,
        ket_pekerjaan_ayah: nn(g(row, "Detail Pekerjaan Ayah")),
        ket_penghasilan_ayah: round(penghasilanAyahAngka),
        ket_pekerjaan_ibu: nn(g(row, "Detail Pekerjaan Ibu")),
        ket_penghasilan_ibu: round(penghasilanIbuAngka),
        penghasilan_lain: round(penghasilanLain),
        jumlah_orang_rumah: round(jmlSebenarnya),
        validasi_orang_rumah: round(jmlSebenarnya),
        kepemilikan_rumah: mapKepemilikanRumah(g(row, "Kepemilikan Rumah")),
        kepemilikan_kendaraan: nn(g(row, "Kepemilikan Kendaraan")),
        kepemilikan_elektronik: nn(g(row, "Kepemilikan Elektronik")),
        kondisi_orang_tua: kondisiOrangTua,
        aset,
        kondisi_rumah: kondisiRumahText ? kondisiRumahText.slice(0, 60) : null,
        rekomendasi,
        alasan: nn(g(row, "Alasan")),
        is_draft: false,
        interviewed_at: new Date(),
        hasil_akhir: hasilAkhir,
        catatan_admin: catatanAdmin,
      },
      detailEkonomi: {
        id: randomUUID(),
        hasil_wawancara_id: hasilWawancaraId,
        penghasilan_lain: round(penghasilanLain),
        jml_tanggungan_sebenarnya: round(jmlSebenarnya),
        tahun_perolehan: parseYearInt(g(row, "Tahun Perolehan")),
        luas_tanah: parseAreaRange(g(row, "Luas Tanah")),
        luas_bangunan: parseAreaRange(g(row, "Luas Bangunan")),
        daya_listrik: null,
        sumber_air: mapSumberAir(g(row, "Sumber Air")),
        mck: mapMck(g(row, "MCK")),
      },
    });
  }

  return { records, skippedBlank, totalRows: dataRows.length };
}

// MAIN
async function main() {
  const client = new pg.Client({ connectionString: env.DIRECT_URL });
  await client.connect();

  try {
    const pwCheck = await client.query("SELECT id, nama FROM pewawancara");
    if (pwCheck.rows.length !== 1 || pwCheck.rows[0].id !== PEWAWANCARA_ID) {
      throw new Error(
        `Pewawancara di database tidak sesuai asumsi script (diharapkan 1 baris id=${PEWAWANCARA_ID}). ` +
        `Ditemukan: ${JSON.stringify(pwCheck.rows)}`,
      );
    }

    const prodiRes = await client.query("SELECT nama_prodi, prodi AS jenjang FROM prodi");
    const prodiPool = prodiRes.rows.map((r) => `${r.jenjang} ${r.nama_prodi.toUpperCase()}`);
    if (prodiPool.length === 0) throw new Error("Tabel prodi kosong, tidak bisa sintesis prodi_pendaftar.");

    const workbook = XLSX.readFile(XLSX_PATH);

    let grandKandidat = 0;
    let grandWawancara = 0;
    const batches = [];

    for (const sheetDef of SHEETS) {
      const { records, skippedBlank, totalRows } = buildRecords(workbook, sheetDef, prodiPool);
      const imporDataId = randomUUID();
      batches.push({ sheetDef, imporDataId, records, skippedBlank, totalRows });
      grandKandidat += records.length;
      grandWawancara += records.length;

      console.log(
        `[${sheetDef.name}] total baris: ${totalRows}, berisi data: ${records.length}, dilewati (kosong): ${skippedBlank}`,
      );
    }

    console.log(`\nTotal akan diinsert: ${grandKandidat} kandidat, ${grandWawancara} hasil_wawancara + detail_ekonomi_wawancara`);
    console.log(`Semua baris disambungkan ke pewawancara: ${pwCheck.rows[0].nama} (${PEWAWANCARA_ID})`);

    console.log("\nContoh identitas sintetis (baris pertama batch 1):");
    if (batches[0]?.records[0]) {
      const k = batches[0].records[0].kandidat;
      console.log(
        `  ${k.nama_pendaftar} | ${k.jenis_kelamin} | NIK ${k.nik} | ${k.prodi_pendaftar} | ${k.asal_sekolah}, ${k.kab_kota}`,
      );
    }

    if (!COMMIT) {
      console.log("\n(DRY RUN -- tidak ada perubahan ke database. Jalankan ulang dengan --commit untuk insert sungguhan.)");
      return;
    }

    await client.query("BEGIN");
    try {
      for (const batch of batches) {
        await client.query(
          `INSERT INTO public.impor_data
            (id, admin_id, jenis_impor, file_name, total_rows, valid_rows, error_rows, dup_rows, tahun_seleksi, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, now())`,
          [
            batch.imporDataId,
            ADMIN_ID,
            batch.sheetDef.jalurMasuk,
            "DATASET_KIPK_2025.xlsx",
            batch.totalRows,
            batch.records.length,
            batch.skippedBlank,
            0,
            TAHUN_SELEKSI,
          ],
        );

        for (const rec of batch.records) {
          const k = rec.kandidat;
          await client.query(
            `INSERT INTO public.kandidat
              (id, impor_data_id, no, no_pendaftaran_kipk, no_kip, no_kks, nama_pendaftar, prodi_pendaftar,
               nik, no_kartu_keluarga, nik_kepala_keluarga, nisn, asal_sekolah, aktif_dtsen, desil_dtsen,
               tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, no_hp, email,
               pekerjaan_ayah, pekerjaan_ibu, penghasilan_ayah, penghasilan_ibu, jumlah_tanggungan,
               kab_kota, provinsi, jalur_masuk, jarak_pusat_kota)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)`,
            [
              k.id, batch.imporDataId, k.no, k.no_pendaftaran_kipk, k.no_kip, k.no_kks, k.nama_pendaftar, k.prodi_pendaftar,
              k.nik, k.no_kartu_keluarga, k.nik_kepala_keluarga, k.nisn, k.asal_sekolah, k.aktif_dtsen, k.desil_dtsen,
              k.tempat_lahir, k.tanggal_lahir, k.jenis_kelamin, k.alamat, k.no_hp, k.email,
              k.pekerjaan_ayah, k.pekerjaan_ibu, k.penghasilan_ayah, k.penghasilan_ibu, k.jumlah_tanggungan,
              k.kab_kota, k.provinsi, k.jalur_masuk, k.jarak_pusat_kota,
            ],
          );

          const hw = rec.hasilWawancara;
          await client.query(
            `INSERT INTO public.hasil_wawancara
              (id, kandidat_id, pewawancara_id, validasi_kks, validasi_kip, validasi_sktm, sosial_media,
               ket_pekerjaan_ayah, ket_penghasilan_ayah, ket_pekerjaan_ibu, ket_penghasilan_ibu,
               penghasilan_lain, jumlah_orang_rumah, validasi_orang_rumah, kepemilikan_rumah,
               kepemilikan_kendaraan, kepemilikan_elektronik, kondisi_orang_tua,
               aset, kondisi_rumah, rekomendasi, alasan, is_draft, interviewed_at, hasil_akhir, catatan_admin)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)`,
            [
              hw.id, hw.kandidat_id, hw.pewawancara_id, hw.validasi_kks, hw.validasi_kip, hw.validasi_sktm, hw.sosial_media,
              hw.ket_pekerjaan_ayah, hw.ket_penghasilan_ayah, hw.ket_pekerjaan_ibu, hw.ket_penghasilan_ibu,
              hw.penghasilan_lain, hw.jumlah_orang_rumah, hw.validasi_orang_rumah, hw.kepemilikan_rumah,
              hw.kepemilikan_kendaraan, hw.kepemilikan_elektronik, hw.kondisi_orang_tua,
              hw.aset, hw.kondisi_rumah, hw.rekomendasi, hw.alasan, hw.is_draft, hw.interviewed_at, hw.hasil_akhir, hw.catatan_admin,
            ],
          );

          const de = rec.detailEkonomi;
          await client.query(
            `INSERT INTO public.detail_ekonomi_wawancara
              (id, hasil_wawancara_id, penghasilan_lain, jml_tanggungan_sebenarnya, tahun_perolehan,
               luas_tanah, luas_bangunan, daya_listrik, sumber_air, mck)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              de.id, de.hasil_wawancara_id, de.penghasilan_lain, de.jml_tanggungan_sebenarnya, de.tahun_perolehan,
              de.luas_tanah, de.luas_bangunan, de.daya_listrik, de.sumber_air, de.mck,
            ],
          );
        }
      }

      await client.query(
        `UPDATE public.pewawancara
         SET total_assigned = COALESCE(total_assigned, 0) + $1,
             total_completed = COALESCE(total_completed, 0) + $1,
             updated_at = now()
         WHERE id = $2`,
        [grandWawancara, PEWAWANCARA_ID],
      );

      await client.query("COMMIT");
      console.log(`\n✅ Berhasil di-insert: ${grandKandidat} kandidat + hasil_wawancara + detail_ekonomi_wawancara.`);
      console.log(`   impor_data batch id: ${batches.map((b) => `${b.sheetDef.jalurMasuk}=${b.imporDataId}`).join(", ")}`);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ Gagal:", err.message);
  process.exit(1);
});
