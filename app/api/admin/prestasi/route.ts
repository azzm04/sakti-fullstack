import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url    = new URL(req.url);
    const status = url.searchParams.get("status");
    const tingkat = url.searchParams.get("tingkat");
    const jenis  = url.searchParams.get("jenis");
    const search = url.searchParams.get("search");

    const where: any = {};

    if (status)  where.status_verifikasi = status;
    if (tingkat) where.tingkat = tingkat;
    if (jenis)   where.jenis_prestasi = jenis;

    if (search) {
      where.OR = [
        { nama_kegiatan:   { contains: search, mode: "insensitive" } },
        { prestasi_dicapai: { contains: search, mode: "insensitive" } },
        { penyelenggara:   { contains: search, mode: "insensitive" } },
      ];
    }

    const prestasi = await prisma.prestasi_mahasiswa.findMany({
      where,
      include: {
        users: {
          include: {
            penerimaKipk: {
              select: {
                nama: true,
                nim: true,
                prodi: { select: { nama_prodi: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const totalPrestasi      = await prisma.prestasi_mahasiswa.count();
    const totalTerverifikasi = await prisma.prestasi_mahasiswa.count({ where: { status_verifikasi: "TERVERIFIKASI" } });
    const mahasiswaAktif     = await prisma.prestasi_mahasiswa.findMany({
      select: { user_id: true },
      distinct: ["user_id"],
    });

    return NextResponse.json({
      data: prestasi,
      stats: {
        totalPrestasi,
        totalTerverifikasi,
        totalMahasiswaAktif: mahasiswaAktif.length,
      },
    });
  } catch (error: any) {
    console.error("GET Admin Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
