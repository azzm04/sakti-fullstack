/**
 * lib/dashboard-monev/dummy.ts
 * Data contoh untuk meninjau tampilan dashboard Monev tanpa data asli.
 * Dipakai otomatis di luar production; `/admin?tab=monev&demo=0` untuk data asli.
 * Tidak pernah aktif di production dan tidak menulis apa pun ke database.
 *
 * Hanya membuat baris mentah (periode, penerima, laporan, log pengingat, data
 * seleksi); semua angka dihitung oleh `hitungDashboard`, sama seperti data asli.
 * Deterministik untuk tanggal yang sama.
 */
import { hitungDashboard, type AcuanSeleksi, type LaporanRow, type LogRow, type Masukan, type MonevDashboard, type PenerimaRow, type PeriodeRow } from "./data";
import { tandaLaporan } from "@/lib/monev/evaluasi";
import { HARI_PENGINGAT, PEKERJAAN_DITANDAI } from "./rules";

function acak(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PRODI = [
  "Informatika", "Sistem Informasi", "Teknik Elektro", "Teknik Sipil", "Akuntansi", "Manajemen",
  "Ilmu Komunikasi", "Pendidikan Matematika", "Hukum", "Agribisnis", "Keperawatan", "Kesehatan Masyarakat",
];
const DEPAN = ["Ahmad", "Siti", "Dimas", "Nur", "Rizky", "Dewi", "Bagus", "Intan", "Fajar", "Putri", "Yoga", "Ayu", "Hendra", "Laila", "Rina", "Andi", "Wulan", "Galih", "Sari", "Bima"];
const BELAKANG = ["Fauzi", "Rahmawati", "Prasetyo", "Aisyah", "Maulana", "Lestari", "Saputra", "Permata", "Nugroho", "Anggraini", "Pratama", "Wulandari", "Wijaya", "Safitri", "Hidayat", "Kurniawan"];
const PEKERJAAN = ["Petani", "Buruh", "Wiraswasta", "Karyawan Swasta", "Nelayan", "Tidak Bekerja", "Ibu Rumah Tangga", "Pensiunan"];
const HARI = 86_400_000;

export function buatMasukan(now: Date): Masukan {
  const r = acak(20261013);

  // Enam periode: empat final, satu ditutup (tinjauan belum selesai), satu
  // berlangsung (hari ke-31 dari 45)
  const periode: PeriodeRow[] = [];
  const sekarangMulai = new Date(now.getTime() - 31 * HARI);
  for (let i = 0; i < 6; i++) {
    const mulai = new Date(sekarangMulai.getTime() - (5 - i) * 182 * HARI);
    const tahun = 2023 + Math.floor((i + 1) / 2);
    const semester = i % 2 === 0 ? "Genap" : "Gasal";
    const tahunAkademik = semester === "Genap" ? tahun - 1 : tahun;
    const deadline = new Date(mulai.getTime() + 45 * HARI - 7 * 3_600_000);
    const ditutup = i <= 4 ? new Date(deadline.getTime() + 3 * HARI) : null;
    periode.push({
      id: `contoh-${i}`, label: `${semester} ${tahunAkademik}/${tahunAkademik + 1}`,
      waktu_mulai: mulai, deadline, created_at: mulai,
      is_active: true, tahun_akademik: tahunAkademik, semester,
      ditutup_at: ditutup, difinalisasi_at: ditutup && i <= 3 ? new Date(ditutup.getTime() + 14 * HARI) : null,
    });
  }

  // Penerima: sebagian sudah lewat 8 semester, sebagian belum punya akun / belum Telegram
  const penerima: PenerimaRow[] = Array.from({ length: 560 }, (_, i) => {
    const punyaAkun = r() > 0.04;
    return {
      userId: punyaAkun ? `u${i}` : null,
      nim: `2${String(10_000_000 + i * 7919).slice(-9)}`,
      nama: `${DEPAN[i % DEPAN.length]} ${BELAKANG[(i * 7) % BELAKANG.length]}`,
      angkatan: 2026 - Math.floor(Math.pow(r(), 1.8) * 8),
      telegramId: punyaAkun && r() > 0.22 ? 1_000 + i : null,
      prodi: PRODI[Math.floor(r() * r() * PRODI.length)],
      email: punyaAkun ? `mhs${i}@students.contoh.ac.id` : null,
    };
  });
  const mundur = penerima.filter((_, i) => i % 97 === 5 && penerima[i].userId).map((p) => ({
    user_id: p.userId!, diputuskan_at: new Date(now.getTime() - 400 * HARI), updated_at: new Date(now.getTime() - 400 * HARI),
  }));

  // Profil ekonomi dasar per mahasiswa, berubah sedikit tiap periode
  // Sebagian kecil keluarga besar berpenghasilan > Rp 4 jt (lolos lewat per kapita)
  const dasar = penerima.map(() => {
    const besar = r() < 0.05;
    return {
      ayah: besar ? 3_600_000 + Math.round(r() * 1_200_000 / 50_000) * 50_000 : 900_000 + Math.round(r() * 2_400_000 / 50_000) * 50_000,
      ibu: besar ? 600_000 : r() < 0.5 ? 0 : Math.round(r() * 1_500_000 / 50_000) * 50_000,
      anggota: besar ? 7 + Math.floor(r() * 3) : 3 + Math.floor(r() * 5),
      besar, rajin: r(),
    };
  });

  const laporan: LaporanRow[] = [];
  const log: LogRow[] = [];
  periode.forEach((p, pi) => {
    const berlangsung = pi === periode.length - 1;
    const hariBerjalan = berlangsung ? 31 : 45;
    penerima.forEach((m, i) => {
      if (!m.userId) return;
      const d = dasar[i];
      const ikut = d.rajin > (berlangsung ? 0.32 : 0.12) || r() < 0.05;
      if (!ikut) return;
      // Mahasiswa yang baru akan mengirim setelah hari ini belum masuk hitungan
      const hari = Math.min(45, Math.floor(Math.pow(r(), 0.7) * 46));
      if (hari > hariBerjalan) return;
      const lonjak = r() < 0.06 * (pi + 1) / 3 ? 1_500_000 + Math.round(r() * 2_000_000 / 50_000) * 50_000 : 0;
      const anggota = Math.max(2, d.anggota - (r() < 0.04 * pi ? 1 : 0));
      const ayah = d.ayah + pi * 60_000 + lonjak;
      const scan = !(berlangsung && r() < 0.1);
      const yolo = !scan ? null : r() < 0.015 ? 0 : r() < (d.besar ? 0.35 : 0.05) ? Math.max(1, anggota - 3) : anggota;
      laporan.push({
        id: `${p.id}-${i}`, user_id: m.userId, periode_monev_id: p.id,
        pekerjaan_ayah: r() < 0.02 ? PEKERJAAN_DITANDAI[0] : PEKERJAAN[i % 5],
        pekerjaan_ibu: PEKERJAAN[5 + (i % 3)],
        penghasilan_ayah: ayah, penghasilan_ibu: d.ibu, penghasilan_lain: r() < 0.1 ? 500_000 : 0,
        jumlah_tanggungan: anggota, hasil_deteksi_yolo: yolo,
        status_anomali: scan ? r() < 0.04 : null, hasil_scan_ai: scan ? {} : null,
        waktu_lapor: new Date(p.waktu_mulai!.getTime() + hari * HARI + 10 * 3_600_000),
        penghasilan_final: null, anggota_final: null, ditinjau_at: null, alasan_manual: [],
      });
    });
    for (const h of HARI_PENGINGAT) {
      const hari = 45 - h;
      if (hari > hariBerjalan) continue;
      log.push({
        periode_monev_id: p.id, triggerDay: h, sentAt: new Date(p.waktu_mulai!.getTime() + hari * HARI + 3_600_000),
        totalSent: Math.round(180 * (1 - hari / 60)), totalFailed: Math.floor(r() * 4),
      });
    }
  });

  // Tinjauan admin: periode final sudah ditinjau semua, periode ditutup baru
  // sebagian. Sebagian KK yang berbeda dikoreksi ke angka KK, dan sebagian
  // pekerjaan yang ditandai ditetapkan sebagai E2.
  for (const l of laporan) {
    const p = periode.find((x) => x.id === l.periode_monev_id)!;
    if (!p.ditutup_at) continue;
    const tanda = tandaLaporan(l);
    if (tanda.length === 0 || (!p.difinalisasi_at && r() < 0.45)) continue;
    l.ditinjau_at = new Date(p.ditutup_at.getTime() + Math.floor(r() * 10) * HARI);
    if ((tanda.includes("kk-berbeda") || tanda.includes("dokumen")) && l.hasil_deteksi_yolo && r() < 0.5) l.anggota_final = l.hasil_deteksi_yolo;
    if (tanda.includes("pekerjaan") && r() < 0.6) l.alasan_manual = ["E2"];
  }

  // Data seleksi hanya untuk angkatan 2024 ke atas (angkatan sebelumnya belum lewat SAKTI)
  const acuan = new Map<string, AcuanSeleksi>();
  penerima.forEach((m, i) => {
    if (m.angkatan < 2024 || r() < 0.1) return;
    acuan.set(m.nim, {
      penghasilan: dasar[i].ayah + dasar[i].ibu - 200_000, anggota: dasar[i].anggota + (r() < 0.06 ? 1 : 0),
      ditandai: false, sumber: r() < 0.7 ? "wawancara" : "pendaftaran",
    });
  });

  // Periode mendatang tanpa laporan melengkapi pratinjau status Belum dimulai.
  // Ditambahkan setelah pembuatan laporan agar tidak menerima isian fiktif.
  const terakhir = periode[periode.length - 1];
  const tahunBerikutnya = terakhir.tahun_akademik + (terakhir.semester === "Genap" ? 1 : 0);
  const semesterBerikutnya = terakhir.semester === "Gasal" ? "Genap" : "Gasal";
  periode.push({
    id: "contoh-belum-dimulai",
    label: `${semesterBerikutnya} ${tahunBerikutnya}/${tahunBerikutnya + 1}`,
    tahun_akademik: tahunBerikutnya, semester: semesterBerikutnya,
    waktu_mulai: new Date(now.getTime() + 60 * HARI),
    deadline: new Date(now.getTime() + 105 * HARI), created_at: now,
    is_active: true, ditutup_at: null, difinalisasi_at: null,
  });

  return { periode, laporan, penerima, mundur, log, acuan };
}

export function getMonevDummy(periodeId?: string, now: Date = new Date()): MonevDashboard {
  // Dibulatkan ke awal hari supaya angka sama sepanjang hari
  const hariIni = new Date(Math.floor(now.getTime() / HARI) * HARI + 9 * 3_600_000);
  return hitungDashboard(buatMasukan(hariIni), periodeId, hariIni, true);
}
