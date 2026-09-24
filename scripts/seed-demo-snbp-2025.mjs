/**
 * Jalankan:
 *   node scripts/seed-demo-snbp-2025.mjs             -> dry run (tanpa insert)
 *   node scripts/seed-demo-snbp-2025.mjs --commit     -> insert sungguhan (1 transaksi)
 */

import { randomUUID, randomInt } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, "..");

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

const ADMIN_ID = "a5278d69-6c85-445f-b415-22778af74cbd";
const PEWAWANCARA_ID = "06d135c9-4443-4d8a-a587-907235cc2eb7";
const TAHUN_SELEKSI = 2025;

const JALUR_LIST = [
  { jalurMasuk: "SNBP Eligible", total: 20, belumWawancara: 5 },
  { jalurMasuk: "SNBP Non Eligible", total: 20, belumWawancara: 5 },
];

// POOL DATA SINTETIS
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
];
const SCHOOL_PREFIXES = ["SMA Negeri", "SMA Negeri", "SMK Negeri", "MA Negeri", "SMA Muhammadiyah", "SMA Kristen"];
const STREETS = [
  "Jl. Merdeka", "Jl. Sudirman", "Jl. Diponegoro", "Jl. Ahmad Yani", "Jl. Gajah Mada",
  "Jl. Pahlawan", "Jl. Kartini", "Jl. Melati", "Jl. Anggrek", "Jl. Cendrawasih",
];
const HP_PREFIXES = ["0812", "0813", "0821", "0822", "0852", "0853", "0857", "0858", "0895", "0896"];
const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

const PEKERJAAN_POOL = [
  "Buruh Harian", "Wirausaha Kecil", "Petani", "Nelayan", "Pedagang Kaki Lima",
  "Sopir", "Tukang Ojek", "TIDAK BEKERJA", "Wiraswasta", "Buruh Pabrik", "Tukang Bangunan",
];
const PEKERJAAN_IBU_POOL = ["Ibu Rumah Tangga", "Ibu Rumah Tangga", "Buruh Harian", "Pedagang Kecil", "TIDAK BEKERJA"];
const KEPEMILIKAN_RUMAH_POOL = ["Sendiri", "Sewa Bulanan", "Sewa Tahunan", "Menumpang", "Tidak Memiliki"];
const SUMBER_AIR_POOL = ["PDAM", "Sumur", "Sungai/Mata Air"];
const MCK_POOL = ["Berbagi Pakai", "Kepemilikan Sendiri Didalam", "Kepemilikan Sendiri Diluar"];
const KENDARAAN_POOL = ["Tidak memiliki kendaraan", "1 motor bekas", "1 sepeda motor", "1 sepeda"];
const ELEKTRONIK_POOL = ["TV tabung, kulkas kecil", "1 HP, kipas angin", "TV, rice cooker", "1 HP android"];
const ALASAN_LAYAK_POOL = [
  "Kondisi ekonomi keluarga tergolong kurang mampu, direkomendasikan menerima KIP Kuliah.",
  "Penghasilan orang tua di bawah UMR dan tanggungan keluarga banyak, layak menerima bantuan.",
  "Kondisi rumah dan aset keluarga menunjukkan keterbatasan ekonomi, diusulkan sebagai penerima KIP.",
];
const ALASAN_TIDAK_LAYAK_POOL = [
  "Penghasilan orang tua tergolong cukup, tidak memenuhi kriteria penerima KIP Kuliah.",
  "Aset dan kondisi rumah tidak menunjukkan indikasi kurang mampu.",
  "Data ekonomi keluarga tidak konsisten dengan kriteria penerima KIP Kuliah.",
];
const STATUS_ORTU_POOL = ["Hidup", "Hidup", "Hidup", "Hidup", "Bercerai", "Wafat"];

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
function randInRange(min, max) {
  return min + randomInt(max - min + 1);
}
function roundTo(n, step) {
  return Math.round(n / step) * step;
}

function synthIdentity() {
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
  const email = `${slug(first)}.${slug(last)}${randDigits(2)}@gmail.com`;
  const noHp = `${pick(HP_PREFIXES)}${randDigits(8)}`;
  const alamat = `${pick(STREETS)} No. ${1 + randomInt(99)}, ${city.kota}`;
  const asalSekolah = `${pick(SCHOOL_PREFIXES)} ${1 + randomInt(20)} ${city.kota}`;

  return {
    nama, jenisKelamin: gender, tempatLahir: city.kota, tanggalLahir,
    nik, noKartuKeluarga, nikKepalaKeluarga, nisn, noPendaftaran, noKip, noKks,
    email, noHp, alamat, asalSekolah, kabKota: city.kota, provinsi: city.provinsi,
  };
}

function composeKondisiOrangTua(statusAyah, statusIbu) {
  const s = `Ayah ${statusAyah}, Ibu ${statusIbu}`;
  return s.slice(0, 30);
}

/**
 * Bangun satu record kandidat + (opsional) hasil_wawancara & detail_ekonomi_wawancara.
 * @param {boolean} sudahWawancara
 */
function buildRecord(no, prodiPool, jalurMasuk, sudahWawancara) {
  const identity = synthIdentity();
  const penghasilanAyah = roundTo(randInRange(0, 3000000), 50000);
  const penghasilanIbu = roundTo(randInRange(0, 1500000), 50000);
  const jumlahTanggungan = randInRange(2, 7);
  const jarak = randInRange(1, 80);
  const aktifDtsen = Math.random() < 0.7 ? "Terdata" : "Belum Terdata";
  const desilDtsen = aktifDtsen === "Terdata" ? `Desil ${1 + randomInt(6)}` : null;

  const kandidatId = randomUUID();
  const hasilWawancaraId = randomUUID();

  const kandidat = {
    id: kandidatId,
    no,
    no_pendaftaran_kipk: identity.noPendaftaran,
    no_kip: identity.noKip,
    no_kks: identity.noKks,
    nama_pendaftar: identity.nama,
    prodi_pendaftar: pick(prodiPool),
    nik: identity.nik,
    no_kartu_keluarga: identity.noKartuKeluarga,
    nik_kepala_keluarga: identity.nikKepalaKeluarga,
    nisn: identity.nisn,
    asal_sekolah: identity.asalSekolah,
    aktif_dtsen: aktifDtsen,
    desil_dtsen: desilDtsen,
    tempat_lahir: identity.tempatLahir,
    tanggal_lahir: identity.tanggalLahir,
    jenis_kelamin: identity.jenisKelamin,
    alamat: identity.alamat,
    no_hp: identity.noHp,
    email: identity.email,
    pekerjaan_ayah: pick(PEKERJAAN_POOL),
    pekerjaan_ibu: pick(PEKERJAAN_IBU_POOL),
    penghasilan_ayah: penghasilanAyah,
    penghasilan_ibu: penghasilanIbu,
    jumlah_tanggungan: jumlahTanggungan,
    kab_kota: identity.kabKota,
    provinsi: identity.provinsi,
    jalur_masuk: jalurMasuk,
    jarak_pusat_kota: jarak,
  };

  if (!sudahWawancara) {
    return {
      kandidat,
      hasilWawancara: {
        id: hasilWawancaraId,
        kandidat_id: kandidatId,
        pewawancara_id: PEWAWANCARA_ID,
        is_draft: true,
        interviewed_at: null,
        validasi_kks: null,
        validasi_kip: null,
        validasi_sktm: null,
        sosial_media: null,
        ket_pekerjaan_ayah: null,
        ket_penghasilan_ayah: null,
        ket_pekerjaan_ibu: null,
        ket_penghasilan_ibu: null,
        penghasilan_lain: null,
        jumlah_orang_rumah: null,
        validasi_orang_rumah: null,
        kepemilikan_rumah: null,
        kepemilikan_kendaraan: null,
        kepemilikan_elektronik: null,
        kondisi_orang_tua: null,
        aset: null,
        kondisi_rumah: null,
        rekomendasi: null,
        alasan: null,
        hasil_akhir: null,
        catatan_admin: "Demo: kandidat sengaja belum diwawancara untuk uji coba langsung.",
      },
      detailEkonomi: null,
    };
  }

  const rekomendasi = Math.random() < 0.85 ? "Layak" : "Tidak Layak";
  const hasilAkhir = rekomendasi === "Layak" ? "Diusulkan" : "Tidak Diusulkan";
  const statusAyah = pick(STATUS_ORTU_POOL);
  const statusIbu = pick(STATUS_ORTU_POOL);
  const penghasilanLain = Math.random() < 0.4 ? roundTo(randInRange(0, 800000), 50000) : 0;

  return {
    kandidat,
    hasilWawancara: {
      id: hasilWawancaraId,
      kandidat_id: kandidatId,
      pewawancara_id: PEWAWANCARA_ID,
      is_draft: false,
      interviewed_at: new Date(),
      validasi_kks: Math.random() < 0.6,
      validasi_kip: Math.random() < 0.6,
      validasi_sktm: Math.random() < 0.3,
      sosial_media: `@${slug(kandidat.nama_pendaftar)}`,
      ket_pekerjaan_ayah: kandidat.pekerjaan_ayah,
      ket_penghasilan_ayah: penghasilanAyah,
      ket_pekerjaan_ibu: kandidat.pekerjaan_ibu,
      ket_penghasilan_ibu: penghasilanIbu,
      penghasilan_lain: penghasilanLain,
      jumlah_orang_rumah: jumlahTanggungan,
      validasi_orang_rumah: jumlahTanggungan,
      kepemilikan_rumah: (() => {
        const t = pick(KEPEMILIKAN_RUMAH_POOL).toLowerCase();
        if (t.includes("tidak memiliki")) return 3;
        if (t.includes("menumpang")) return 4;
        if (t.includes("sewa")) return 2;
        return 1;
      })(),
      kepemilikan_kendaraan: pick(KENDARAAN_POOL),
      kepemilikan_elektronik: pick(ELEKTRONIK_POOL),
      kondisi_orang_tua: composeKondisiOrangTua(statusAyah, statusIbu),
      aset: `Sumber listrik: PLN`,
      kondisi_rumah: rekomendasi === "Layak" ? "Layak Menerima Beasiswa" : "Kondisi ekonomi tergolong cukup",
      rekomendasi,
      alasan: rekomendasi === "Layak" ? pick(ALASAN_LAYAK_POOL) : pick(ALASAN_TIDAK_LAYAK_POOL),
      hasil_akhir: hasilAkhir,
      catatan_admin: "Demo: data wawancara sintetis untuk uji coba.",
    },
    detailEkonomi: {
      id: randomUUID(),
      hasil_wawancara_id: hasilWawancaraId,
      penghasilan_lain: penghasilanLain,
      jml_tanggungan_sebenarnya: jumlahTanggungan,
      tahun_perolehan: randInRange(1990, 2023),
      luas_tanah: randInRange(30, 250),
      luas_bangunan: randInRange(21, 150),
      daya_listrik: null,
      sumber_air: (() => {
        const t = pick(SUMBER_AIR_POOL).toLowerCase();
        if (t.includes("pdam")) return 2;
        if (t.includes("sumur")) return 1;
        return 3;
      })(),
      mck: (() => {
        const t = pick(MCK_POOL).toLowerCase();
        return t.includes("berbagi") ? 1 : 2;
      })(),
    },
  };
}

async function main() {
  const client = new pg.Client({ connectionString: env.DIRECT_URL });
  await client.connect();

  try {
    const pwCheck = await client.query("SELECT id, nama FROM pewawancara WHERE id = $1", [PEWAWANCARA_ID]);
    if (pwCheck.rows.length !== 1) {
      throw new Error(`Pewawancara id=${PEWAWANCARA_ID} tidak ditemukan di database.`);
    }

    const prodiRes = await client.query("SELECT nama_prodi, prodi AS jenjang FROM prodi");
    const prodiPool = prodiRes.rows.map((r) => `${r.jenjang} ${r.nama_prodi.toUpperCase()}`);
    if (prodiPool.length === 0) throw new Error("Tabel prodi kosong.");

    const batches = [];
    for (const jalur of JALUR_LIST) {
      const records = [];
      const sudahCount = jalur.total - jalur.belumWawancara;
      for (let i = 1; i <= jalur.total; i++) {
        const sudahWawancara = i <= sudahCount;
        records.push(buildRecord(i, prodiPool, jalur.jalurMasuk, sudahWawancara));
      }
      batches.push({ jalur, imporDataId: randomUUID(), records });
      console.log(
        `[${jalur.jalurMasuk}] akan diinsert: ${jalur.total} kandidat (${sudahCount} sudah wawancara, ${jalur.belumWawancara} belum wawancara)`,
      );
    }

    const totalKandidat = batches.reduce((s, b) => s + b.records.length, 0);
    console.log(`\nTotal: ${totalKandidat} kandidat, semua ditugaskan ke pewawancara: ${pwCheck.rows[0].nama} (${PEWAWANCARA_ID})`);

    const contoh = batches[0].records[0].kandidat;
    console.log(`\nContoh identitas sintetis: ${contoh.nama_pendaftar} | ${contoh.jenis_kelamin} | ${contoh.prodi_pendaftar} | ${contoh.kab_kota}`);

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
          [batch.imporDataId, ADMIN_ID, batch.jalur.jalurMasuk, "seed-demo-snbp-2025", batch.records.length, batch.records.length, 0, 0, TAHUN_SELEKSI],
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

          if (rec.detailEkonomi) {
            const de = rec.detailEkonomi;
            await client.query(
              `INSERT INTO public.detail_ekonomi_wawancara
                (id, hasil_wawancara_id, penghasilan_lain, jml_tanggungan_sebenarnya, tahun_perolehan,
                 luas_tanah, luas_bangunan, daya_listrik, sumber_air, mck)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
              [de.id, de.hasil_wawancara_id, de.penghasilan_lain, de.jml_tanggungan_sebenarnya, de.tahun_perolehan, de.luas_tanah, de.luas_bangunan, de.daya_listrik, de.sumber_air, de.mck],
            );
          }
        }
      }

      const totalCompleted = batches.reduce((s, b) => s + b.records.filter((r) => r.hasilWawancara.is_draft === false).length, 0);
      await client.query(
        `UPDATE public.pewawancara
         SET total_assigned = COALESCE(total_assigned, 0) + $1,
             total_completed = COALESCE(total_completed, 0) + $2,
             updated_at = now()
         WHERE id = $3`,
        [totalKandidat, totalCompleted, PEWAWANCARA_ID],
      );

      await client.query("COMMIT");
      console.log(`\n✅ Berhasil di-insert: ${totalKandidat} kandidat (SNBP Eligible & SNBP Non Eligible).`);
      console.log(`   impor_data batch id: ${batches.map((b) => `${b.jalur.jalurMasuk}=${b.imporDataId}`).join(", ")}`);
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
