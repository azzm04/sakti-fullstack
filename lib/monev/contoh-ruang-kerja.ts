import { buatMasukan } from "../dashboard-monev/dummy";
import { hitungDashboard } from "../dashboard-monev/data";
import { susunLaporanEkonomi } from "./laporan-ekonomi";
import type { PeriodeRuangKerja } from "./ruang-kerja";

/** Demo memakai sumber yang sama dengan dashboard, tidak pernah menulis database. */
export function getContohRuangKerja(periodeId?: string, now = new Date()) {
  const sumber = buatMasukan(new Date(Math.floor(now.getTime() / 86400000) * 86400000 + 9 * 3600000));
  const periods: PeriodeRuangKerja[] = [...sumber.periode].reverse().map((p) => {
    const d = hitungDashboard(sumber, p.id, now, true);
    const rows = susunLaporanEkonomi(sumber, p.id);
    return {
      ...p, created_at: p.created_at.toISOString(), updated_at: null,
      waktu_mulai: p.waktu_mulai?.toISOString() ?? null, deadline: p.deadline.toISOString(),
      ditutup_at: p.ditutup_at?.toISOString() ?? null, difinalisasi_at: p.difinalisasi_at?.toISOString() ?? null,
      jumlah_laporan: sumber.laporan.filter((l) => l.periode_monev_id === p.id).length,
      fase: d.selected!.fase, sisaHari: d.selected!.sisaHari,
      ringkasan: { ...d.progres, tidakLolos: rows.filter((l) => l.hasil === "TIDAK_LOLOS").length },
    };
  });
  const dashboard = hitungDashboard(sumber, periodeId, now, true);
  return { periods, dashboard, laporan: susunLaporanEkonomi(sumber, dashboard.selected!.id) };
}
