import { prisma } from "@/lib/db";
import { getOperationalStatus, type OperationalStatus } from "@/lib/monev-schedule";

export interface SelectionGroup {
  year: number | null;
  route: string;
  total: number;
  completed: number;
  proposed: number;
  recent: { id: string; name: string; prodi: string; result: string; at: string }[];
}
export interface MonevPeriodSummary {
  id: string;
  label: string;
  deadline: string;
  status: OperationalStatus;
  reports: number;
  students: number;
  pending: number;
  review: number;
}
export interface MonevDashboardData {
  periods: MonevPeriodSummary[];
  uniqueStudents: number;
}

export async function getSelectionDashboard(): Promise<SelectionGroup[]> {
  const rows = await prisma.kandidat.findMany({
    select: {
      id: true, nama_pendaftar: true, prodi_pendaftar: true, jalur_masuk: true,
      impor_data: { select: { tahun_seleksi: true } },
      hasil_wawancara: {
        where: { is_draft: false }, orderBy: { updated_at: "desc" }, take: 1,
        select: { hasil_akhir: true, interviewed_at: true, updated_at: true },
      },
    },
  });
  const groups = new Map<string, SelectionGroup>();
  for (const row of rows) {
    const year = row.impor_data?.tahun_seleksi ?? null;
    const route = row.jalur_masuk || "Tanpa jalur";
    const key = JSON.stringify([year, route]);
    const group = groups.get(key) ?? { year, route, total: 0, completed: 0, proposed: 0, recent: [] };
    group.total++;
    const interview = row.hasil_wawancara[0];
    if (interview) {
      group.completed++;
      if (interview.hasil_akhir === "Diusulkan") group.proposed++;
      group.recent.push({
        id: row.id, name: row.nama_pendaftar || "Nama belum tersedia",
        prodi: row.prodi_pendaftar || "-", result: interview.hasil_akhir || "Belum ditetapkan",
        at: (interview.interviewed_at ?? interview.updated_at).toISOString(),
      });
      group.recent.sort((a, b) => b.at.localeCompare(a.at));
      group.recent = group.recent.slice(0, 6);
    }
    groups.set(key, group);
  }
  return [...groups.values()];
}

export async function getMonevDashboard(): Promise<MonevDashboardData> {
  const [periods, submissions] = await Promise.all([
    prisma.periode_monev.findMany({
      orderBy: [{ deadline: "asc" }, { created_at: "asc" }],
      select: { id: true, label: true, deadline: true, waktu_mulai: true, is_active: true },
    }),
    prisma.pengisian_monev.findMany({
      select: { periode_monev_id: true, user_id: true, hasil_deteksi_yolo: true, status_anomali: true, hasil_scan_ai: true },
    }),
  ]);
  const groups = new Map<string, { reports: number; users: Set<string>; pending: number; review: number }>();
  const allUsers = new Set<string>();
  for (const row of submissions) {
    const group = groups.get(row.periode_monev_id) ?? { reports: 0, users: new Set<string>(), pending: 0, review: 0 };
    group.reports++;
    group.users.add(row.user_id);
    allUsers.add(row.user_id);
    if (row.hasil_deteksi_yolo === null && row.hasil_scan_ai === null) group.pending++;
    if (row.status_anomali === true || row.hasil_deteksi_yolo === 0) group.review++;
    groups.set(row.periode_monev_id, group);
  }
  return {
    uniqueStudents: allUsers.size,
    periods: periods.map((period) => {
      const group = groups.get(period.id);
      return {
        id: period.id, label: period.label, deadline: period.deadline.toISOString(),
        status: getOperationalStatus({ ...period, jumlah_laporan: group?.reports ?? 0 }),
        reports: group?.reports ?? 0, students: group?.users.size ?? 0,
        pending: group?.pending ?? 0, review: group?.review ?? 0,
      };
    }),
  };
}
