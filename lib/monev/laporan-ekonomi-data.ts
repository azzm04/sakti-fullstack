import { prisma } from "@/lib/db";
import { susunLaporanEkonomi } from "./laporan-ekonomi";

export async function getLaporanEkonomi(periodeId: string) {
  const [periode, laporan, penerima, mundur] = await Promise.all([
    prisma.periode_monev.findMany({ where: { id: periodeId } }),
    prisma.pengisian_monev.findMany({
      where: { periode_monev_id: periodeId },
      include: { alasan_penangguhan_monev: { select: { kode: true } } },
    }),
    prisma.penerimaKipk.findMany({ select: { userId: true, nim: true, nama: true, angkatan: true, telegramId: true, prodi: { select: { nama_prodi: true, fakultas: true } } } }),
    prisma.pengunduran_diri.findMany({ where: { status: "DITERIMA" }, select: { user_id: true, diputuskan_at: true, updated_at: true } }),
  ]);
  return susunLaporanEkonomi({
    periode, mundur,
    laporan: laporan.map(({ alasan_penangguhan_monev, ...l }) => ({ ...l, alasan_manual: alasan_penangguhan_monev.map((a) => a.kode) })),
    penerima: penerima.map((m) => ({ ...m, prodi: m.prodi?.nama_prodi ?? "Tanpa prodi", fakultas: m.prodi?.fakultas, email: null })),
  }, periodeId);
}
