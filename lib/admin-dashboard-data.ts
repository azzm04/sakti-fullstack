import { prisma } from "@/lib/db";

export interface SelectionGroup {
  year: number | null;
  route: string;
  total: number;
  completed: number;
  proposed: number;
  recent: { id: string; name: string; prodi: string; result: string; at: string }[];
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
