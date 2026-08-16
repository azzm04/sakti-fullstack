import AdminDashboardContent from "@/components/admin/AdminDashboardContent"
import { getDashboardStats } from "@/lib/dashboard-stats"
import type { DashboardStats } from "@/schemas"

export default async function AdminPage() {
  let stats: DashboardStats | null = null
  try {
    stats = await getDashboardStats()
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error)
  }

  return <AdminDashboardContent stats={stats} />
}
