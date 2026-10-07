import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

/** Fail closed: tanpa JWT_SECRET tidak ada token yang dianggap valid. */
function getJwtSecret(): Uint8Array | null {
  const raw = process.env.JWT_SECRET;
  if (!raw) {
    console.error("[auth] JWT_SECRET belum di-set");
    return null;
  }
  return new TextEncoder().encode(raw);
}

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: "MAHASISWA_KIPK" | "PEWAWANCARA" | "ADMIN_DIRMAWA";
}

export async function signSessionToken(user: {
  id: string;
  email: string;
  role: AuthUser["role"];
}): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
  return new SignJWT({ sub: user.id, role: user.role, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 hari
  path: "/",
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("sakti_token")?.value;

    if (!token) {
      return null;
    }

    const secret = getJwtSecret();
    if (!secret) return null;
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

    // Admin token pakai `sub` sebagai id (lihat route admin login)
    // User token pakai `id` secara langsung
    const id = (payload.sub ?? payload.id) as string;

    return {
      id,
      nama: payload.nama as string,
      email: (payload.email ?? payload.username ?? "") as string,
      role: payload.role as AuthUser["role"],
    };
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}

export async function requireAdminRole(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN_DIRMAWA") {
    // Redirect to appropriate dashboard based on role
    const roleRoutes: Record<string, string> = {
      MAHASISWA_KIPK: "/mahasiswa",
      PEWAWANCARA: "/pewawancara",
    };
    redirect(roleRoutes[user.role] || "/login");
  }

  return user;
}

export async function requireRole(
  requiredRole: AuthUser["role"],
): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== requiredRole) {
    const roleRoutes: Record<string, string> = {
      MAHASISWA_KIPK: "/mahasiswa",
      PEWAWANCARA: "/pewawancara",
      ADMIN_DIRMAWA: "/admin",
    };
    redirect(roleRoutes[user.role] || "/login");
  }

  return user;
}

export interface ApiUser {
  id: string;
  role: AuthUser["role"];
}

/**
 * Autentikasi untuk API route (PRD v2.1 K9). Mengembalikan user jika cookie
 * sesi valid dan (bila diminta) role-nya cocok; null jika tidak.
 * Membedakan 401/403 diserahkan ke pemanggil lewat `reason`.
 */
export async function getApiUser(
  req: NextRequest,
  requiredRole?: AuthUser["role"],
): Promise<{ user: ApiUser; reason?: never } | { user?: never; reason: 401 | 403 }> {
  const token = req.cookies.get("sakti_token")?.value;
  const secret = getJwtSecret();
  if (!token || !secret) return { reason: 401 };

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const id = (payload.sub ?? payload.id) as string | undefined;
    const role = payload.role as AuthUser["role"] | undefined;
    if (!id || !role) return { reason: 401 };
    if (requiredRole && role !== requiredRole) return { reason: 403 };
    return { user: { id, role } };
  } catch {
    return { reason: 401 };
  }
}
