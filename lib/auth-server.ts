import { cookies } from "next/headers"
import { jwtVerify } from "jose"
import { redirect } from "next/navigation"

export interface AuthUser {
  id: string
  nama: string
  email: string
  role: "MAHASISWA_KIPK" | "PEWAWANCARA" | "ADMIN_DIRMAWA"
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("sakti_token")?.value

    if (!token) {
      return null
    }

    // Verify JWT token on server
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")
    const { payload } = await jwtVerify(token, secret)

    return {
      id: payload.id as string,
      nama: payload.nama as string,
      email: payload.email as string,
      role: payload.role as AuthUser["role"],
    }
  } catch (error) {
    console.error("Auth verification failed:", error)
    return null
  }
}

export async function requireAdminRole(): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "ADMIN_DIRMAWA") {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<string, string> = {
      MAHASISWA_KIPK: "/mahasiswa",
      PEWAWANCARA: "/pewawancara",
    }
    redirect(roleRoutes[user.role] || "/login")
  }

  return user
}

export async function requireRole(
  requiredRole: AuthUser["role"]
): Promise<AuthUser> {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== requiredRole) {
    const roleRoutes: Record<string, string> = {
      MAHASISWA_KIPK: "/mahasiswa",
      PEWAWANCARA: "/pewawancara",
      ADMIN_DIRMAWA: "/admin",
    }
    redirect(roleRoutes[user.role] || "/login")
  }

  return user
}
