/**
 * Seed data SIMULASI untuk uji coba alur "Buat Sesi Wawancara" / pembukaan
 * slot WAR pada jalur UM (Ujian Mandiri), tahun_seleksi 2025.
 *
 * Beda dengan scripts/seed-dummy-um-sbub.cjs (yang sengaja bernama "Dummy X"
 * dan SUDAH selesai diwawancara — buat uji modul Filtering Kuota): skrip ini
 * memakai nama & data yang menyerupai data asli (BUKAN data seseorang yang
 * nyata — hanya kombinasi nama umum Indonesia), dan kandidatnya SENGAJA
 * dibiarkan belum punya baris hasil_wawancara sama sekali (belum
 * diwawancara, belum ditugaskan ke pewawancara manapun) supaya alur
 * Buat Sesi -> buka WAR -> klaim slot -> Distribusi Mahasiswa bisa diuji
 * dari nol.
 *
 * Penanda supaya gampang dibedakan & dihapus lagi nanti (walau nama
 * terlihat asli): seluruh baris terhubung ke SATU batch impor_data dengan
 * file_name "SIMULASI-uji-slot-um-2025.xlsx" dan email berdomain
 * @sim-test.local (domain ini tidak ditampilkan di UI kandidat).
 *
 * Jalankan : node --env-file=.env.local scripts/seed-simulasi-slot-um-2025.cjs
 * Hapus lagi: node --env-file=.env.local scripts/seed-simulasi-slot-um-2025.cjs --cleanup
 */
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const JALUR = "UM";
const TAHUN_SELEKSI = 2025;
const BATCH_FILE_NAME = "SIMULASI-uji-slot-um-2025.xlsx";
const EMAIL_DOMAIN = "sim-test.local";
const JUMLAH_KANDIDAT = 40;

const NAMA_LIST = [
  ["Ahmad Fauzan", "L"], ["Siti Nur Aisyah", "P"], ["Muhammad Rizki Pratama", "L"],
  ["Dewi Anggraini", "P"], ["Bayu Setiawan", "L"], ["Putri Ramadhani", "P"],
  ["Andi Saputra", "L"], ["Rina Kusuma Wardani", "P"], ["Fajar Nugroho", "L"],
  ["Yuni Astuti", "P"], ["Doni Prasetyo", "L"], ["Wulan Sari", "P"],
  ["Rizal Maulana", "L"], ["Intan Permata Sari", "P"], ["Agus Hidayat", "L"],
  ["Nabila Zahra", "P"], ["Eko Purnomo", "L"], ["Lestari Handayani", "P"],
  ["Hendra Gunawan", "L"], ["Novi Rahmawati", "P"], ["Dedi Kurniawan", "L"],
  ["Fitria Ningsih", "P"], ["Yusuf Ibrahim", "L"], ["Sri Wahyuni", "P"],
  ["Arif Rahman", "L"], ["Mega Puspita", "P"], ["Wahyu Setiaji", "L"],
  ["Retno Wulandari", "P"], ["Ilham Ramadhan", "L"], ["Diah Ayu Lestari", "P"],
  ["Taufik Hidayat", "L"], ["Ratna Sari Dewi", "P"], ["Bagus Prasetya", "L"],
  ["Anisa Fitriani", "P"], ["Rudi Hartono", "L"], ["Yulia Ningsih", "P"],
  ["Krisna Aditya", "L"], ["Windi Astari", "P"], ["Galih Permana", "L"],
  ["Citra Kartika", "P"],
];

const PRODI_LIST = [
  "S1 TEKNIK INFORMATIKA", "S1 AKUNTANSI", "S1 ILMU HUKUM", "S1 KEDOKTERAN",
  "S1 ILMU KOMUNIKASI", "S1 TEKNIK SIPIL", "S1 KESEHATAN MASYARAKAT",
  "D4 MANAJEMEN DAN ADMINISTRASI LOGISTIK", "S1 MANAJEMEN", "S1 PSIKOLOGI",
];
const KAB_KOTA_LIST = [
  ["Kota Semarang", "Jawa Tengah"], ["Kab. Purworejo", "Jawa Tengah"],
  ["Kab. Garut", "Jawa Barat"], ["Kota Surabaya", "Jawa Timur"],
  ["Kab. Kudus", "Jawa Tengah"], ["Kota Bandung", "Jawa Barat"],
  ["Kab. Sleman", "D.I. Yogyakarta"], ["Kota Malang", "Jawa Timur"],
];
const PEKERJAAN_LIST = ["Wirausaha", "Buruh Harian", "Petani", "Karyawan Swasta", "Sopir", "Pedagang"];
const SEKOLAH_LIST = [
  "SMA Negeri 1 Semarang", "SMA Negeri 3 Purworejo", "SMK Negeri 2 Garut",
  "SMA Negeri 5 Surabaya", "MA Negeri 1 Kudus", "SMA Negeri 2 Bandung",
];

function pick(list, i) {
  return list[i % list.length];
}
function randDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}
function pad2(n) {
  return String(n).padStart(2, "0");
}
function slugify(nama) {
  return nama.toLowerCase().replace(/[^a-z]+/g, ".");
}

function buildDataset() {
  return NAMA_LIST.slice(0, JUMLAH_KANDIDAT).map(([nama, gender], i) => {
    const no = i + 1;
    const [kabKota, provinsi] = pick(KAB_KOTA_LIST, i);
    const regMonth = 1 + (i % 12);

    return {
      no,
      no_pendaftaran_kipk: `${pad2(regMonth)}25.${randDigits(3)}.${randDigits(5)}.${randDigits(4)}.001`,
      no_kip: `KIP${randDigits(6)}`,
      no_kks: `KKS${randDigits(3)}`,
      nama_pendaftar: nama,
      prodi_pendaftar: pick(PRODI_LIST, i),
      nik: `33${pad2(1 + (i % 12))}${randDigits(2)}${String(2006 + (i % 3)).slice(-2)}${randDigits(4)}`,
      no_kartu_keluarga: randDigits(16),
      nisn: `00${randDigits(8)}`,
      asal_sekolah: pick(SEKOLAH_LIST, i),
      jumlah_tanggungan: 1 + (i % 5),
      pekerjaan_ayah: pick(PEKERJAAN_LIST, i),
      pekerjaan_ibu: i % 3 === 0 ? "Ibu Rumah Tangga" : pick(PEKERJAAN_LIST, i + 1),
      penghasilan_ayah: 500000 + (i % 8) * 250000,
      penghasilan_ibu: i % 3 === 0 ? 0 : 300000 + (i % 5) * 200000,
      kab_kota: kabKota,
      provinsi,
      alamat: `Jl. Merdeka No. ${10 + i}`,
      no_hp: `08${randDigits(10)}`,
      email: `${slugify(nama)}${no}@${EMAIL_DOMAIN}`,
      jalur_masuk: JALUR,
      jenis_kelamin: gender,
      tempat_lahir: kabKota.replace(/^Kota |^Kab\. /, ""),
      tanggal_lahir: `${2006 + (i % 2)}-${pad2(1 + (i % 12))}-${pad2(1 + (i % 27))}`,
      jarak_pusat_kota: 5 + (i % 30),
      golongan_ukt: 1 + (i % 4),
      aktif_dtsen: i % 4 === 0 ? "Tidak Terdata" : "Terdata",
      desil_dtsen: i % 4 === 0 ? null : `Terdata: Desil ${1 + (i % 5)}`,
    };
  });
}

async function seed() {
  const { data: admin, error: adminErr } = await supabase
    .from("admin_users")
    .select("id")
    .limit(1)
    .single();
  if (adminErr || !admin) throw new Error(`Gagal ambil admin_id: ${adminErr?.message ?? "tidak ada admin_users"}`);

  const batchId = randomUUID();
  const dataset = buildDataset();

  const { error: batchErr } = await supabase.from("impor_data").insert({
    id: batchId,
    admin_id: admin.id,
    jenis_impor: JALUR,
    file_name: BATCH_FILE_NAME,
    total_rows: dataset.length,
    valid_rows: dataset.length,
    error_rows: 0,
    dup_rows: 0,
    tahun_seleksi: TAHUN_SELEKSI,
  });
  if (batchErr) throw new Error(`Gagal insert impor_data: ${batchErr.message}`);
  console.log(`impor_data batch dibuat: ${batchId}`);

  const { error: kErr } = await supabase
    .from("kandidat")
    .insert(dataset.map((row) => ({ ...row, impor_data_id: batchId })));
  if (kErr) throw new Error(`Gagal insert kandidat: ${kErr.message}`);

  console.log(`Selesai: ${dataset.length} kandidat jalur ${JALUR}, tahun_seleksi ${TAHUN_SELEKSI}.`);
  console.log(`Semua kandidat BELUM punya hasil_wawancara (belum diwawancara/ditugaskan) — siap untuk uji Buat Sesi -> WAR -> Distribusi.`);
  console.log(`\nUntuk hapus lagi nanti:`);
  console.log(`  node --env-file=.env.local scripts/seed-simulasi-slot-um-2025.cjs --cleanup`);
}

async function cleanup() {
  const { data: batches, error: findErr } = await supabase
    .from("impor_data")
    .select("id")
    .eq("file_name", BATCH_FILE_NAME);
  if (findErr) throw new Error(`Gagal cari batch: ${findErr.message}`);
  if (!batches || batches.length === 0) {
    console.log("Tidak ada batch simulasi ditemukan — sudah bersih.");
    return;
  }

  for (const batch of batches) {
    const { data: kandidats } = await supabase
      .from("kandidat")
      .select("id")
      .eq("impor_data_id", batch.id);
    const kandidatIds = (kandidats ?? []).map((k) => k.id);

    if (kandidatIds.length > 0) {
      // Jaga-jaga kalau kandidat ini sempat dipakai testing dan punya baris
      // hasil_wawancara — hapus dulu supaya tidak melanggar FK.
      await supabase.from("hasil_wawancara").delete().in("kandidat_id", kandidatIds);
      await supabase.from("kandidat").delete().in("id", kandidatIds);
    }
    await supabase.from("impor_data").delete().eq("id", batch.id);
    console.log(`Batch ${batch.id} dan ${kandidatIds.length} kandidat simulasi dihapus.`);
  }
}

const isCleanup = process.argv.includes("--cleanup");
(isCleanup ? cleanup() : seed()).catch((err) => {
  console.error("GAGAL:", err.message);
  process.exit(1);
});
