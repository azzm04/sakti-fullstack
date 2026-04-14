import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sakti_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({
      id: payload.sub,
      nama: payload.nama,
      email: payload.email,
      role: payload.role,
    })
  } catch {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
  }
}
