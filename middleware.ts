import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Peta role ke route yang diizinkan
const ROLE_ROUTES: Record<string, string[]> = {
  MAHASISWA_KIPK: ["/mahasiswa"],
  PEWAWANCARA:    ["/pewawancara"],
  ADMIN_DIRMAWA:  ["/admin"],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("sakti_token")?.value

  // Jika tidak ada token, redirect ke login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const role = payload.role as string

    // Cek apakah role boleh akses route ini
    const allowed = ROLE_ROUTES[role] ?? []
    const hasAccess = allowed.some((r) => pathname.startsWith(r))

    if (!hasAccess) {
      // Role tidak punya akses ke route ini, redirect ke halaman mereka
      const homeRoute = ROLE_ROUTES[role]?.[0] ?? "/login"
      return NextResponse.redirect(new URL(homeRoute, req.url))
    }

    return NextResponse.next()
  } catch {
    // Token invalid atau expired — hapus cookie dan redirect ke login
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete("sakti_token")
    return res
  }
}

export const config = {
  matcher: [
    "/admin",
    "/admin/((?!login).*)",
    "/mahasiswa/:path*",
    "/pewawancara/:path*",
  ],
}
