/**
 * Seed data DUMMY untuk jalur UM & SBUB (testing modul Filtering Kuota).
 * Semua nilai identitas (nama, NIK, email, dst) FIKTIF — ditandai dengan
 * prefix "Dummy" & domain email @dummy.test supaya mudah dikenali/dihapus.
 *
 * Jalankan: node --env-file=.env.local scripts/seed-dummy-um-sbub.cjs
 */
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ADMIN_ID = "a5278d69-6c85-445f-b415-22778af74cbd"; // admin01 / Admin Dirmawa
const PEWAWANCARA_ID = "06d135c9-4443-4d8a-a587-907235cc2eb7"; // Azzam
const TAHUN_SELEKSI = 2026;

const PRODI_LIST = [
  "S1 TEKNIK INFORMATIKA",
  "S1 AKUNTANSI",
  "S1 ILMU HUKUM",
  "S1 KEDOKTERAN",
  "S1 ILMU KOMUNIKASI",
  "S1 TEKNIK SIPIL",
  "S1 KESEHATAN MASYARAKAT",
  "D4 MANAJEMEN DAN ADMINISTRASI LOGISTIK",
];
const KAB_KOTA_LIST = [
  ["Kota Semarang", "Jawa Tengah"],
  ["Kab. Purworejo", "Jawa Tengah"],
  ["Kab. Garut", "Jawa Barat"],
  ["Kota Surabaya", "Jawa Timur"],
  ["Kab. Kudus", "Jawa Tengah"],
];

function pick(list, i) {
  return list[i % list.length];
}

/**
 * Definisi satu baris kandidat + hasil wawancaranya.
 * `null` di kondisi_orang_tua/rekomendasi = kandidat belum selesai diwawancarai (draft).
 */
function buildDataset(jalur) {
  const rows = [
    // ── 12 kandidat "Diusulkan" — variasi golongan UKT & kondisi ortu untuk uji ranking ──
    { golongan_ukt: 1, kondisi: "Yatim Piatu", ayah: 0, ibu: 0, lain: 800000, tanggungan: 4, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Yatim Piatu", ayah: 500000, ibu: 700000, lain: 0, tanggungan: 4, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Yatim", ayah: 500000, ibu: 0, lain: 0, tanggungan: 2, rekomendasi: "Layak" },
    { golongan_ukt: 2, kondisi: "Yatim Piatu", ayah: 0, ibu: 0, lain: 600000, tanggungan: 3, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Piatu", ayah: 400000, ibu: 0, lain: 0, tanggungan: 2, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Aman", ayah: 300000, ibu: 200000, lain: 0, tanggungan: 5, rekomendasi: "Layak" },
    { golongan_ukt: 2, kondisi: "Yatim", ayah: 600000, ibu: 0, lain: 0, tanggungan: 3, rekomendasi: "Layak" },
    { golongan_ukt: 3, kondisi: "Yatim Piatu", ayah: 0, ibu: 0, lain: 500000, tanggungan: 2, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Cerai Menafkahi", ayah: 1000000, ibu: 500000, lain: 0, tanggungan: 3, rekomendasi: "Layak" },
    { golongan_ukt: 2, kondisi: "Piatu", ayah: 700000, ibu: 0, lain: 0, tanggungan: 4, rekomendasi: "Layak" },
    { golongan_ukt: 1, kondisi: "Cerai Tidak Menafkahi", ayah: 0, ibu: 800000, lain: 0, tanggungan: 3, rekomendasi: "Layak" },
    { golongan_ukt: 4, kondisi: "Yatim", ayah: 500000, ibu: 0, lain: 0, tanggungan: 2, rekomendasi: "Layak" },
    // ── 2 kandidat "Tidak Diusulkan" — harus TIDAK muncul di pool Filtering Kuota ──
    { golongan_ukt: 1, kondisi: "Aman", ayah: 3000000, ibu: 2000000, lain: 0, tanggungan: 5, rekomendasi: "Tidak Layak" },
    { golongan_ukt: 2, kondisi: "Yatim", ayah: 2500000, ibu: 0, lain: 0, tanggungan: 3, rekomendasi: "Tidak Layak" },
    // ── 1 kandidat belum selesai wawancara (draft) — harus TIDAK muncul di pool ──
    { golongan_ukt: 3, kondisi: null, ayah: null, ibu: null, lain: null, tanggungan: null, rekomendasi: null },
  ];

  return rows.map((r, i) => {
    const no = i + 1;
    const [kabKota, provinsi] = pick(KAB_KOTA_LIST, i);
    const isDraft = r.rekomendasi === null;
    const hasilAkhir =
      r.rekomendasi === "Layak" ? "Diusulkan" : r.rekomendasi === "Tidak Layak" ? "Tidak Diusulkan" : null;

    return {
      kandidat: {
        no,
        no_pendaftaran_kipk: `DUMMY-${jalur}-${String(no).padStart(2, "0")}`,
        no_kip: `KIP-DUMMY-${jalur}-${no}`,
        no_kks: `KKS-DUMMY-${jalur}-${no}`,
        nama_pendaftar: `Dummy ${jalur} ${String(no).padStart(2, "0")}`,
        prodi_pendaftar: pick(PRODI_LIST, i),
        nik: `99990000${jalur === "UM" ? "1" : "2"}${String(no).padStart(6, "0")}`,
        no_kartu_keluarga: `88880000${String(no).padStart(8, "0")}`,
        nisn: `007700${String(no).padStart(4, "0")}`,
        asal_sekolah: "SMA DUMMY TESTING",
        jumlah_tanggungan: r.tanggungan,
        pekerjaan_ayah: "Wirausaha",
        pekerjaan_ibu: "Ibu Rumah Tangga",
        penghasilan_ayah: r.ayah,
        penghasilan_ibu: r.ibu,
        kab_kota: kabKota,
        provinsi,
        alamat: `Jl. Dummy Testing No. ${no}`,
        no_hp: `08123456${String(no).padStart(4, "0")}`,
        email: `dummy.${jalur.toLowerCase()}.${no}@dummy.test`,
        jalur_masuk: jalur,
        jenis_kelamin: i % 2 === 0 ? "L" : "P",
        tempat_lahir: "Semarang",
        tanggal_lahir: "2007-01-15",
        jarak_pusat_kota: 10 + i,
        golongan_ukt: r.golongan_ukt,
        aktif_dtsen: "Terdata",
        desil_dtsen: "Terdata: Desil 3",
      },
      hasilWawancara: {
        pewawancara_id: PEWAWANCARA_ID,
        is_draft: isDraft,
        validasi_kks: isDraft ? null : true,
        validasi_kip: isDraft ? null : true,
        validasi_sktm: isDraft ? null : false,
        sosial_media: isDraft ? null : `@dummy${jalur.toLowerCase()}${no}`,
        ket_pekerjaan_ayah: isDraft ? null : "Buruh harian",
        ket_penghasilan_ayah: r.ayah,
        ket_pekerjaan_ibu: isDraft ? null : "Ibu Rumah Tangga",
        ket_penghasilan_ibu: r.ibu,
        penghasilan_lain: r.lain,
        validasi_orang_rumah: isDraft ? null : r.tanggungan,
        kepemilikan_rumah: isDraft ? null : 1,
        kondisi_rumah: isDraft ? null : "Layak Menerima Beasiswa",
        aset: isDraft ? null : "Motor",
        kondisi_orang_tua: r.kondisi,
        rekomendasi: r.rekomendasi,
        alasan: isDraft ? null : "Data dummy untuk pengujian Filtering Kuota",
        hasil_akhir: hasilAkhir,
        interviewed_at: isDraft ? null : new Date().toISOString(),
        status_final: null,
        ranking_kuota: null,
      },
      detailEkonomi: isDraft
        ? null
        : {
            jml_tanggungan_sebenarnya: r.tanggungan,
            luas_tanah: 100 + i * 5,
            luas_bangunan: 50 + i * 3,
            sumber_air: 1,
            mck: 1,
            tahun_perolehan: 2010 + (i % 10),
          },
    };
  });
}

async function seedJalur(jalur) {
  const dataset = buildDataset(jalur);

  const batchId = randomUUID();
  const { error: batchErr } = await supabase.from("impor_data").insert({
    id: batchId,
    admin_id: ADMIN_ID,
    jenis_impor: jalur,
    file_name: `dummy-seed-${jalur.toLowerCase()}.xlsx`,
    total_rows: dataset.length,
    valid_rows: dataset.length,
    error_rows: 0,
    dup_rows: 0,
    tahun_seleksi: TAHUN_SELEKSI,
  });
  if (batchErr) throw new Error(`[${jalur}] gagal insert impor_data: ${batchErr.message}`);
  console.log(`[${jalur}] impor_data batch dibuat: ${batchId}`);

  let countDiusulkan = 0;
  let countTidak = 0;
  let countDraft = 0;

  for (const row of dataset) {
    const { data: kandidat, error: kErr } = await supabase
      .from("kandidat")
      .insert({ ...row.kandidat, impor_data_id: batchId })
      .select("id")
      .single();
    if (kErr) throw new Error(`[${jalur}] gagal insert kandidat: ${kErr.message}`);

    const { data: hw, error: hwErr } = await supabase
      .from("hasil_wawancara")
      .insert({ ...row.hasilWawancara, kandidat_id: kandidat.id })
      .select("id")
      .single();
    if (hwErr) throw new Error(`[${jalur}] gagal insert hasil_wawancara: ${hwErr.message}`);

    if (row.detailEkonomi) {
      const { error: dewErr } = await supabase
        .from("detail_ekonomi_wawancara")
        .insert({ ...row.detailEkonomi, hasil_wawancara_id: hw.id });
      if (dewErr) throw new Error(`[${jalur}] gagal insert detail_ekonomi_wawancara: ${dewErr.message}`);
    }

    if (row.hasilWawancara.hasil_akhir === "Diusulkan") countDiusulkan++;
    else if (row.hasilWawancara.hasil_akhir === "Tidak Diusulkan") countTidak++;
    else countDraft++;
  }

  console.log(
    `[${jalur}] selesai: ${dataset.length} kandidat (Diusulkan: ${countDiusulkan}, Tidak Diusulkan: ${countTidak}, Draft/belum wawancara: ${countDraft})`,
  );
}

async function main() {
  await seedJalur("UM");
  await seedJalur("SBUB");
  console.log("\nSelesai. Tahun seleksi:", TAHUN_SELEKSI);
  console.log("Cek di /admin/evaluasi (tahun 2026, jalur UM/SBUB) atau /admin/filtering.");
}

main().catch((err) => {
  console.error("GAGAL:", err.message);
  process.exit(1);
});
