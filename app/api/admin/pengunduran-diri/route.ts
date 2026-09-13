import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url    = new URL(req.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { alasan: { contains: search, mode: "insensitive" } },
        {
          user: {
            penerimaKipk: {
              OR: [
                { nama: { contains: search, mode: "insensitive" } },
                { nim:  { contains: search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const list = await prisma.pengunduran_diri.findMany({
      where,
      include: {
        user: {
          include: {
            penerimaKipk: {
              select: {
                nama: true,
                nim:  true,
                angkatan: true,
                prodi: { select: { nama_prodi: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const stats = {
      total:      await prisma.pengunduran_diri.count(),
      menunggu:   await prisma.pengunduran_diri.count({ where: { status: "MENUNGGU_VERIFIKASI" } }),
      diproses:   await prisma.pengunduran_diri.count({ where: { status: "DIPROSES" } }),
      diterima:   await prisma.pengunduran_diri.count({ where: { status: "DITERIMA" } }),
    };

    return NextResponse.json({ data: list, stats });
  } catch (err: any) {
    console.error("GET admin pengunduran-diri error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
