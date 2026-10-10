import { prisma } from "@/lib/db";
import MonevClient from "@/components/admin/monev/MonevClient";

export interface MonevSchedule {
  id: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  tahun_akademik: number | null;
  semester: string | null;
  jumlah_laporan: number;
}

async function getInitialSchedules(): Promise<MonevSchedule[]> {
  try {
    // Bentuknya harus sama dengan GET /api/admin/monev/schedule — client
    // memakai initialSchedules sampai refetch pertama, jadi updated_at
    // (optimistic lock) dan jumlah_laporan (penentu status) wajib ada.
    const rows = await prisma.periode_monev.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id:             true,
        label:          true,
        waktu_mulai:    true,
        deadline:       true,
        is_active:      true,
        created_at:     true,
        updated_at:     true,
        tahun_akademik: true,
        semester:       true,
        _count: { select: { pengisian_monev: true } },
      },
    });

    return rows.map((r) => ({
      id:             r.id,
      label:          r.label,
      waktu_mulai:    r.waktu_mulai?.toISOString() ?? null,
      deadline:       r.deadline.toISOString(),
      is_active:      r.is_active,
      created_at:     r.created_at.toISOString(),
      updated_at:     r.updated_at?.toISOString() ?? null,
      tahun_akademik: r.tahun_akademik,
      semester:       r.semester,
      jumlah_laporan: r._count.pengisian_monev,
    }));
  } catch (err) {
    console.error("[Server] getInitialSchedules error:", err);
    return [];
  }
}

export default async function AdminMonevPage({ searchParams }: { searchParams: Promise<{ tab?: string; periode?: string }> }) {
  const params = await searchParams;
  const initialSchedules = await getInitialSchedules();

  return <MonevClient key={`${params.tab ?? "jadwal"}-${params.periode ?? ""}`} initialSchedules={initialSchedules} initialTab={params.tab === "hasil" ? "hasil" : "jadwal"} initialPeriodId={params.periode} />;
}
