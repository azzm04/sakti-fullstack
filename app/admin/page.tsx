import AdminDashboardContent, { type AduanRingkasan } from "@/components/admin/AdminDashboardContent"
import { getDashboardStats } from "@/lib/dashboard-stats"
import { prisma } from "@/lib/db"
import type { DashboardStats } from "@/schemas"

async function getAduanRingkasan(): Promise<AduanRingkasan | null> {
  try {
    const [items, perStatus] = await Promise.all([
      prisma.aduan.findMany({
        orderBy: { created_at: "desc" },
        take: 6,
        select: {
          id: true,
          kode_laporan: true,
          jenis_aduan: true,
          nama_terlapor: true,
          fakultas_prodi: true,
          status: true,
          created_at: true,
        },
      }),
      prisma.aduan.groupBy({ by: ["status"], _count: { _all: true } }),
    ])

    const counts = { MENUNGGU: 0, DIPROSES: 0, SELESAI: 0, DITOLAK: 0 }
    for (const row of perStatus) counts[row.status] = row._count._all

    return {
      items: items.map((a) => ({ ...a, created_at: a.created_at.toISOString() })),
      counts,
    }
  } catch (error) {
    console.error("Failed to fetch aduan summary:", error)
    return null
  }
}

export default async function AdminPage() {
  let stats: DashboardStats | null = null
  try {
    stats = await getDashboardStats()
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
  }

  const aduan = await getAduanRingkasan()

  return <AdminDashboardContent stats={stats} aduan={aduan} />
}
