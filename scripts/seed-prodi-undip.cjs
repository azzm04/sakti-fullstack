/**
 * Seed data master prodi Undip — BEST-EFFORT berdasarkan nama prodi yang
 * muncul di dokumen (PDF SK & data pendaftar) yang di-share user, dikelompokkan
 * ke fakultas Undip setahu saya. Silakan koreksi manual lewat tabel `prodi`
 * kalau ada nama_prodi/fakultas yang meleset.
 *
 * Jalankan: node --env-file=.env.local scripts/seed-prodi-undip.cjs
 */
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// [nama_prodi, fakultas, jenjang]
const PRODI_LIST = [
  // Fakultas Hukum
  ["Ilmu Hukum", "FAKULTAS HUKUM", "S1"],

  // Fakultas Ekonomika dan Bisnis
  ["Manajemen", "FAKULTAS EKONOMIKA DAN BISNIS", "S1"],
  ["Ekonomi", "FAKULTAS EKONOMIKA DAN BISNIS", "S1"],
  ["Ekonomi Islam", "FAKULTAS EKONOMIKA DAN BISNIS", "S1"],
  ["Akuntansi", "FAKULTAS EKONOMIKA DAN BISNIS", "S1"],

  // Fakultas Ilmu Budaya
  ["Sastra Indonesia", "FAKULTAS ILMU BUDAYA", "S1"],
  ["Sastra Inggris", "FAKULTAS ILMU BUDAYA", "S1"],
  ["Bahasa Dan Kebudayaan Jepang", "FAKULTAS ILMU BUDAYA", "S1"],
  ["Sejarah", "FAKULTAS ILMU BUDAYA", "S1"],
  ["Ilmu Perpustakaan Dan Informasi", "FAKULTAS ILMU BUDAYA", "S1"],
  ["Antropologi Sosial", "FAKULTAS ILMU BUDAYA", "S1"],

  // FISIP
  ["Ilmu Pemerintahan", "FAKULTAS ILMU SOSIAL DAN ILMU POLITIK", "S1"],
  ["Administrasi Publik", "FAKULTAS ILMU SOSIAL DAN ILMU POLITIK", "S1"],
  ["Administrasi Bisnis", "FAKULTAS ILMU SOSIAL DAN ILMU POLITIK", "S1"],
  ["Ilmu Komunikasi", "FAKULTAS ILMU SOSIAL DAN ILMU POLITIK", "S1"],
  ["Hubungan Internasional", "FAKULTAS ILMU SOSIAL DAN ILMU POLITIK", "S1"],

  // Fakultas Psikologi
  ["Psikologi", "FAKULTAS PSIKOLOGI", "S1"],

  // Fakultas Teknik
  ["Teknik Sipil", "FAKULTAS TEKNIK", "S1"],
  ["Arsitektur", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Kimia", "FAKULTAS TEKNIK", "S1"],
  ["Perencanaan Wilayah Dan Kota", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Mesin", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Elektro", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Industri", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Lingkungan", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Perkapalan", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Geologi", "FAKULTAS TEKNIK", "S1"],
  ["Teknik Geodesi", "FAKULTAS TEKNIK", "S1"],
  // "Teknik Komputer" S1 sudah ada di DB — dilewati otomatis oleh skip-check di bawah.
  ["Teknik Komputer", "FAKULTAS TEKNIK", "S1"],

  // Fakultas Kedokteran (termasuk rumpun kesehatan)
  ["Kedokteran", "FAKULTAS KEDOKTERAN", "S1"],
  ["Farmasi", "FAKULTAS KEDOKTERAN", "S1"],
  ["Keperawatan", "FAKULTAS KEDOKTERAN", "S1"],
  ["Gizi", "FAKULTAS KEDOKTERAN", "S1"],

  // Fakultas Peternakan dan Pertanian
  ["Peternakan", "FAKULTAS PETERNAKAN DAN PERTANIAN", "S1"],
  ["Teknologi Pangan", "FAKULTAS PETERNAKAN DAN PERTANIAN", "S1"],
  ["Agroekoteknologi", "FAKULTAS PETERNAKAN DAN PERTANIAN", "S1"],
  ["Agribisnis", "FAKULTAS PETERNAKAN DAN PERTANIAN", "S1"],

  // Fakultas Sains dan Matematika
  ["Matematika", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Biologi", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Bioteknologi", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Kimia", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Fisika", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Statistika", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],
  ["Informatika", "FAKULTAS SAINS DAN MATEMATIKA", "S1"],

  // Fakultas Kesehatan Masyarakat
  ["Kesehatan Masyarakat", "FAKULTAS KESEHATAN MASYARAKAT", "S1"],
  ["Keselamatan Dan Kesehatan Kerja", "FAKULTAS KESEHATAN MASYARAKAT", "S1"],

  // Fakultas Perikanan dan Ilmu Kelautan
  ["Manajemen Sumber Daya Perairan", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Akuakultur", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Perikanan Tangkap", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Ilmu Kelautan", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Oseanografi", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Teknologi Hasil Perikanan", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],
  ["Teknologi Dan Bisnis Perikanan Dan Kelautan", "FAKULTAS PERIKANAN DAN ILMU KELAUTAN", "S1"],

  // Sekolah Vokasi (D4)
  ["Manajemen Dan Administrasi Logistik", "SEKOLAH VOKASI", "D4"],
  ["Akuntansi Perpajakan", "SEKOLAH VOKASI", "D4"],
  ["Bahasa Asing Terapan", "SEKOLAH VOKASI", "D4"],
  ["Informasi Dan Humas", "SEKOLAH VOKASI", "D4"],
  ["Teknik Infrastruktur Sipil Dan Perancangan Arsitektur", "SEKOLAH VOKASI", "D4"],
  ["Perencanaan Tata Ruang Dan Pertanahan", "SEKOLAH VOKASI", "D4"],
  ["Teknologi Rekayasa Kimia Industri", "SEKOLAH VOKASI", "D4"],
  ["Rekayasa Perancangan Mekanik", "SEKOLAH VOKASI", "D4"],
  ["Teknologi Rekayasa Otomasi", "SEKOLAH VOKASI", "D4"],
  ["Teknologi Rekayasa Konstruksi Perkapalan", "SEKOLAH VOKASI", "D4"],
];

async function main() {
  const { data: existing, error: exErr } = await supabase.from("prodi").select("nama_prodi, prodi");
  if (exErr) throw exErr;

  const existingKeys = new Set((existing ?? []).map((p) => `${p.nama_prodi.toLowerCase()}|${p.prodi}`));

  const rows = PRODI_LIST.filter(([nama, , jenjang]) => !existingKeys.has(`${nama.toLowerCase()}|${jenjang}`)).map(
    ([nama_prodi, fakultas, jenjang]) => ({
      nama_prodi,
      fakultas,
      prodi: jenjang,
    }),
  );

  if (rows.length === 0) {
    console.log("Tidak ada prodi baru untuk di-insert (semua sudah ada).");
    return;
  }

  const { error } = await supabase.from("prodi").insert(rows);
  if (error) throw error;

  console.log(`Berhasil insert ${rows.length} prodi baru.`);
  console.log("Total prodi di DB sekarang:", (existing?.length ?? 0) + rows.length);
}

main().catch((err) => {
  console.error("GAGAL:", err.message);
  process.exit(1);
});
