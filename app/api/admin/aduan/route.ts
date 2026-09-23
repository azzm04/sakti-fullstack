import { NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Sesuaikan dengan path file Prisma Anda

export async function GET() {
  try {
    // Mengambil semua laporan dari yang terbaru ke terlama
    const aduanList = await prisma.aduan.findMany({
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: aduanList }, { status: 200 });
  } catch (error) {
    console.error("[ADMIN_ADUAN_GET]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil data laporan" },
      { status: 500 }
    );
  }
}