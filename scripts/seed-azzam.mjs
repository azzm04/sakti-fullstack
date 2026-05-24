/**
 * Script: Isi data evaluasi wawancara untuk pewawancara Azzam
 * Nomor urut kandidat: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38
 *
 * Jalankan: node scripts/seed-azzam.mjs
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cpljziscjujobhvlutcw.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwbGp6aXNjanVqb2Jodmx1dGN3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk3NzU5NSwiZXhwIjoyMDkxNTUzNTk1fQ.QlOZPrbN_ZxwkgQU3D_sJlK2ncdUTZ3h5xSeXom1Ucw";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Nomor urut kandidat yang harus diisi Azzam
const NOMOR_URUT = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38];

// ── Data dummy realistis untuk evaluasi ──────────────────────────────────────
// Variasi data agar tidak monoton
const PEKERJAAN_AYAH = [
  "Buruh Harian", "Petani", "Pedagang Kecil", "Tukang Bangunan", "Sopir",
  "Nelayan", "Karyawan Swasta", "Wiraswasta Kecil", "Buruh Pabrik", "Ojek Online",
  "Satpam", "Tukang Las", "Montir", "Penjahit", "Kuli Angkut",
  "Pedagang Asongan", "Tukang Parkir", "Pemulung", "Buruh Tani",
];

const PEKERJAAN_IBU = [
  "Ibu Rumah Tangga", "Buruh Cuci", "Pedagang Warung", "Pembantu RT",
  "Penjahit", "Petani", "Pedagang Pasar", "Ibu Rumah Tangga", "Buruh Pabrik",
  "Ibu Rumah Tangga", "Pedagang Kecil", "Ibu Rumah Tangga", "Buruh Cuci",
  "Ibu Rumah Tangga", "Pedagang Warung", "Ibu Rumah Tangga", "Pembantu RT",
  "Ibu Rumah Tangga", "Pedagang Kecil",
];

function generateEvaluasi(index) {
  // Variasi penghasilan (rendah, sesuai konteks penerima KIP-K)
  const penghasilanAyah = [800000, 1000000, 1200000, 1500000, 900000, 700000, 1100000, 1300000, 600000, 1400000,
    1000000, 850000, 950000, 1100000, 750000, 1200000, 800000, 500000, 900000][index];
  const penghasilanIbu = [0, 300000, 500000, 0, 200000, 0, 400000, 0, 300000, 0,
    500000, 0, 200000, 0, 0, 300000, 0, 0, 400000][index];
  const penghasilanLain = [0, 0, 200000, 0, 0, 100000, 0, 0, 0, 300000,
    0, 0, 0, 200000, 0, 0, 100000, 0, 0][index];

  const tanggungan = [4, 3, 5, 3, 4, 6, 3, 4, 5, 3, 4, 3, 5, 4, 3, 4, 5, 6, 3][index];
  const orangRumah = [5, 4, 6, 4, 5, 7, 4, 5, 6, 4, 5, 4, 6, 5, 4, 5, 6, 7, 4][index];

  // Kepemilikan rumah: 1=Milik Sendiri, 2=Sewa, 3=Tidak Memiliki, 4=Menumpang
  const kepemilikan = [1, 4, 1, 2, 1, 4, 1, 2, 1, 4, 1, 2, 1, 4, 1, 1, 2, 4, 1][index];
  const tahunPerolehan = ["1995", "2000", "1998", "2020", "2005", "2010", "1990", "2019", "2003", "2015",
    "1997", "2021", "2001", "2012", "1999", "2008", "2022", "2018", "2004"][index];
  const luasTanah = [60, 45, 80, 0, 72, 0, 90, 0, 65, 0, 75, 0, 55, 0, 70, 85, 0, 0, 68][index];
  const luasBangunan = [36, 30, 45, 24, 40, 20, 50, 18, 35, 22, 42, 20, 30, 25, 38, 48, 16, 18, 36][index];

  // Sumber air: 1=Sumur, 2=PDAM, 3=Sungai
  const sumberAir = [1, 2, 1, 2, 1, 3, 2, 1, 1, 2, 1, 2, 3, 1, 2, 1, 2, 3, 1][index];
  // MCK: 1=Berbagi, 2=Sendiri
  const mck = [2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 2, 2, 1, 1, 2][index];

  const asetList = [
    "Sepeda motor (1 unit)", "Tidak ada", "TV, Sepeda motor", "Tidak ada",
    "Sepeda motor (1 unit)", "Tidak ada", "TV", "Tidak ada",
    "Sepeda motor, HP", "Tidak ada", "TV, Kulkas", "Tidak ada",
    "Tidak ada", "Sepeda motor", "TV", "Sepeda motor, TV",
    "Tidak ada", "Tidak ada", "Sepeda motor",
  ][index];

  const kondisi = [
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Layak Menerima Beasiswa",
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Layak Menerima Beasiswa",
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Layak Menerima Beasiswa",
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Layak Menerima Beasiswa",
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Layak Menerima Beasiswa",
    "Layak Menerima Beasiswa", "Layak Menerima Beasiswa", "Tidak Layak Beasiswa",
    "Layak Menerima Beasiswa",
  ][index];

  // Rekomendasi: mayoritas "Layak", beberapa "Dipertimbangkan"
  const rekomendasi = [
    "Layak", "Layak", "Layak", "Dipertimbangkan", "Layak",
    "Layak", "Layak", "Dipertimbangkan", "Layak", "Layak",
    "Layak", "Layak", "Layak", "Dipertimbangkan", "Layak",
    "Layak", "Layak", "Tidak Layak", "Layak",
  ][index];

  const alasan = [
    "Kondisi ekonomi keluarga sesuai dengan data yang dilaporkan",
    "Keluarga tinggal menumpang, penghasilan sangat terbatas",
    "Tanggungan banyak, rumah sederhana, layak menerima bantuan",
    "Penghasilan cukup untuk kebutuhan dasar, perlu dipertimbangkan",
    "Kondisi rumah sederhana, penghasilan pas-pasan",
    "Keluarga menumpang di rumah saudara, sangat membutuhkan",
    "Ekonomi keluarga terbatas, layak mendapat bantuan",
    "Ada penghasilan tambahan, kondisi tidak terlalu mendesak",
    "Rumah sederhana, penghasilan rendah, layak dibantu",
    "Menumpang di rumah kerabat, tidak punya aset berarti",
    "Kondisi ekonomi sesuai laporan, layak menerima beasiswa",
    "Rumah sewa kecil, penghasilan terbatas",
    "Sumber air dari sungai, MCK berbagi, kondisi sangat sederhana",
    "Punya motor dan TV, penghasilan cukup, perlu pertimbangan",
    "Penghasilan rendah, tanggungan banyak",
    "Rumah milik sendiri tapi kondisi sangat sederhana",
    "Rumah sewa, penghasilan sangat rendah",
    "Kondisi ekonomi tidak sesuai laporan, ada indikasi data tidak valid",
    "Keluarga petani dengan penghasilan tidak menentu, layak dibantu",
  ][index];

  const jarakKota = [3, 5, 2, 8, 4, 12, 6, 3, 7, 10, 4, 5, 15, 6, 3, 8, 4, 2, 9][index];

  return {
    validasi_kks: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, true, false, false, true][index],
    validasi_kip: [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, false, true][index],
    validasi_sktm: [true, true, true, false, true, true, true, false, true, true, true, true, true, false, true, true, true, false, true][index],
    sosial_media: `@kandidat_${NOMOR_URUT[index]}`,
    ket_pekerjaan_ayah: PEKERJAAN_AYAH[index],
    ket_penghasilan_ayah: penghasilanAyah,
    ket_pekerjaan_ibu: PEKERJAAN_IBU[index],
    ket_penghasilan_ibu: penghasilanIbu,
    penghasilan_lain: penghasilanLain,
    jml_tanggungan_sebenarnya: tanggungan,
    validasi_orang_rumah: orangRumah,
    kepemilikan_rumah: kepemilikan,
    tahun_perolehan: tahunPerolehan,
    luas_tanah: luasTanah,
    luas_bangunan: luasBangunan,
    sumber_air: sumberAir,
    mck: mck,
    aset: asetList,
    kondisi_rumah: kondisi,
    jarak_pusat_kota: jarakKota,
    rekomendasi: rekomendasi,
    alasan: alasan,
    is_draft: false,
    interviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("🚀 Mulai mengisi data evaluasi untuk pewawancara Azzam...\n");

  // 1. Cari pewawancara Azzam
  const { data: azzam, error: azzamErr } = await supabase
    .from("pewawancara")
    .select("id, nama, email")
    .ilike("nama", "%azzam%")
    .single();

  if (azzamErr || !azzam) {
    console.error("❌ Pewawancara Azzam tidak ditemukan!", azzamErr);
    process.exit(1);
  }
  console.log(`✅ Pewawancara ditemukan: ${azzam.nama} (ID: ${azzam.id})\n`);

  // 2. Cari kandidat dengan nomor urut 2, 4, 6, ..., 38
  const { data: kandidats, error: kandErr } = await supabase
    .from("kandidat")
    .select("id, no, nama")
    .in("no", NOMOR_URUT)
    .order("no", { ascending: true });

  if (kandErr || !kandidats || kandidats.length === 0) {
    console.error("❌ Kandidat tidak ditemukan!", kandErr);
    process.exit(1);
  }
  console.log(`📋 Ditemukan ${kandidats.length} kandidat untuk diisi:\n`);

  // 3. Isi data evaluasi untuk setiap kandidat
  let sukses = 0;
  let gagal = 0;

  for (let i = 0; i < kandidats.length; i++) {
    const kandidat = kandidats[i];
    const indexInArray = NOMOR_URUT.indexOf(kandidat.no);
    if (indexInArray === -1) continue;

    const evaluasi = generateEvaluasi(indexInArray);

    // Cek apakah sudah ada record di hasil_wawancara
    const { data: existing } = await supabase
      .from("hasil_wawancara")
      .select("id")
      .eq("kandidat_id", kandidat.id)
      .maybeSingle();

    let error;

    if (existing) {
      // Update
      ({ error } = await supabase
        .from("hasil_wawancara")
        .update({ ...evaluasi, pewawancara_id: azzam.id })
        .eq("kandidat_id", kandidat.id));
    } else {
      // Insert
      ({ error } = await supabase
        .from("hasil_wawancara")
        .insert({
          ...evaluasi,
          kandidat_id: kandidat.id,
          pewawancara_id: azzam.id,
          sesi_id: null, // Akan di-set jika ada sesi aktif
          created_at: new Date().toISOString(),
        }));
    }

    if (error) {
      console.error(`  ❌ No.${kandidat.no} ${kandidat.nama} — GAGAL:`, error.message);
      gagal++;
    } else {
      const action = existing ? "UPDATED" : "INSERTED";
      console.log(`  ✅ No.${kandidat.no} ${kandidat.nama} — ${action} → ${evaluasi.rekomendasi}`);
      sukses++;
    }
  }

  // 4. Update total_completed pewawancara
  const { error: updateErr } = await supabase
    .from("pewawancara")
    .update({ total_completed: sukses })
    .eq("id", azzam.id);

  if (updateErr) {
    console.warn("\n⚠️  Gagal update total_completed:", updateErr.message);
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Sukses: ${sukses} | ❌ Gagal: ${gagal} | Total: ${kandidats.length}`);
  console.log(`════════════════════════════════════════\n`);
}

main().catch(console.error);
