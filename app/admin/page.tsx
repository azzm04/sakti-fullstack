
import AdminDashboardContent from "@/components/admin/AdminDashboardContent"

interface Stats {
  total: number
  valid: number
  incomplete: number
  saved: boolean
}
async function getStats(): Promise<Stats | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/kandidat`, {
      cache: "no-store", // Don't cache - always fresh data
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error("Failed to fetch stats:", error)
    return null
  }
}

export default async function AdminPage() {
  const stats = await getStats()

  return <AdminDashboardContent stats={stats} />
}
