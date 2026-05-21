/**
 * Admin Layout - Server Component
 * 
 * This is now a SERVER COMPONENT which means:
 * - Auth check happens on server (no client waterfall)
 * - Faster page loads
 * - Reduced JavaScript bundle
 * - Better security (no token exposed to client)
 */

import { requireAdminRole } from "@/lib/auth-server"
import AdminNavigation from "@/components/admin/AdminNavigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Server-side auth check
  // This happens BEFORE the page loads, not after
  // If user is not admin, they get redirected immediately
  const user = await requireAdminRole()

  return (
    <div className="flex min-h-screen bg-background">
      {/* Navigation - Client Component */}
      <AdminNavigation adminName={user.nama} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
