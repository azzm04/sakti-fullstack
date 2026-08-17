/**
 * Admin Layout - Server Component
 * 
 * This is now a SERVER COMPONENT which means:
 * - Auth check happens on server (no client waterfall)
 * - Faster page loads
 * - Reduced JavaScript bundle
 * - Better security (no token exposed to client)
 */

import { Inter } from "next/font/google"
import { requireAdminRole } from "@/lib/auth-server"
import AdminNavigation from "@/components/admin/AdminNavigation"

// SAKTI admin design system fonts — scoped to /admin via this layout only.
// Defining the CSS variables here (not in the root layout) keeps them out
// of the rest of the app; other pages simply don't reference the
// font-admin-* utilities, so having the variable in scope is a no-op for them.
// Both roles load Inter — matches the Undip reference (Inter, Helvetica, sans-serif).
const interBody = Inter({
  subsets: ["latin"],
  variable: "--font-admin-body",
})

const interHeading = Inter({
  subsets: ["latin"],
  variable: "--font-admin-heading",
})

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
    <div className={`flex min-h-screen bg-admin-bg ${interBody.variable} ${interHeading.variable} font-admin-body text-admin-text`}>
      {/* Navigation - Client Component */}
      <AdminNavigation adminName={user.nama} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col md:pt-0 pt-14">
        {children}
      </main>
    </div>
  )
}
