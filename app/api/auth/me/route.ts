import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const token = req.cookies.get("sakti_token")?.value

  if (!token) {
    return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 })
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    const userId = payload.sub as string
    const penerimaKipk = await prisma.penerimaKipk.findUnique({
      where: { userId },
      select: { nama: true },
    })

    let nama: string | null = penerimaKipk?.nama ?? null

    if (!nama) {
      const pewawancara = await prisma.pewawancara.findFirst({
        where: { userId },
        select: { nama: true },
      })
      nama = pewawancara?.nama ?? null
    }

    return NextResponse.json({
      id: userId,
      nama: nama ?? (payload.email as string).split("@")[0],
      email: payload.email,
      role: payload.role,
    })
  } catch {
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 })
  }
}
