import { prisma } from "@/lib/db";
import { daysLeftWIB } from "@/lib/monev-schedule";
import { fasePeriode, hasilMahasiswa, perluDitinjau, statusWajibIsi, sudahDipindai } from "./evaluasi";
import type { PeriodeRuangKerja } from "./ruang-kerja";

/** Satu pengambilan data untuk daftar dan ruang kerja; hasil yang dikirim hanya ringkasan. */
export async function getPeriodeRuangKerja(now = new Date()): Promise<PeriodeRuangKerja[]> {
  const [periods, penerima, mundur] = await Promise.all([
    prisma.periode_monev.findMany({
      orderBy: { created_at: "desc" },
      include: { pengisian_monev: { select: {
        user_id: true, pekerjaan_ayah: true, pekerjaan_ibu: true,
        penghasilan_ayah: true, penghasilan_ibu: true, penghasilan_lain: true,
        jumlah_tanggungan: true, hasil_deteksi_yolo: true, hasil_scan_ai: true,
        status_anomali: true, penghasilan_final: true, anggota_final: true, ditinjau_at: true,
        alasan_penangguhan_monev: { select: { kode: true } },
      } } },
    }),
    prisma.penerimaKipk.findMany({ select: { userId: true, angkatan: true } }),
    prisma.pengunduran_diri.findMany({
      where: { status: "DITERIMA" },
      select: { user_id: true, diputuskan_at: true, updated_at: true },
    }),
  ]);
  const mundurMap = new Map(mundur.map((m) => [m.user_id, m.diputuskan_at ?? m.updated_at]));
  return periods.map(({ pengisian_monev, ...p }) => {
    const laporan = pengisian_monev.map(({ alasan_penangguhan_monev, ...l }) => ({
      ...l, alasan_manual: alasan_penangguhan_monev.map((a) => a.kode),
    }));
    const perUser = new Map(laporan.map((l) => [l.user_id, l]));
    const wajib = penerima.filter((m) => statusWajibIsi(p, m.angkatan, m.userId ? mundurMap.get(m.userId) ?? null : null) === "WAJIB");
    const ringkasan = { wajibIsi: wajib.length, terkirim: 0, belumDipindai: 0, perluDitinjau: 0, tidakLolos: 0 };
    for (const m of wajib) {
      const l = m.userId ? perUser.get(m.userId) ?? null : null;
      if (l) {
        ringkasan.terkirim++;
        if (!sudahDipindai(l)) ringkasan.belumDipindai++;
        if (perluDitinjau(l)) ringkasan.perluDitinjau++;
      }
      if (hasilMahasiswa(l, !!p.ditutup_at).hasil === "TIDAK_LOLOS") ringkasan.tidakLolos++;
    }
    return {
      id: p.id, label: p.label, tahun_akademik: p.tahun_akademik, semester: p.semester,
      is_active: p.is_active, jumlah_laporan: laporan.length,
      waktu_mulai: p.waktu_mulai?.toISOString() ?? null, deadline: p.deadline.toISOString(),
      created_at: p.created_at.toISOString(), updated_at: p.updated_at?.toISOString() ?? null,
      ditutup_at: p.ditutup_at?.toISOString() ?? null, difinalisasi_at: p.difinalisasi_at?.toISOString() ?? null,
      fase: fasePeriode(p, laporan.length, now), sisaHari: daysLeftWIB(p.deadline, now), ringkasan,
    };
  });
}
