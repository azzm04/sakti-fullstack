import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSesiAdmin } from "@/lib/auth/sesi-admin";

export async function GET() {
  try {
    const sesi = await getSesiAdmin();
    if (!sesi) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    // Hanya kolom yang dibutuhkan daftar: identitas pelapor sengaja tidak ikut
    const aduanList = await prisma.aduan.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        kode_laporan: true,
        jenis_aduan: true,
        nama_terlapor: true,
        nim_terlapor: true,
        fakultas_prodi: true,
        angkatan: true,
        status: true,
        created_at: true,
      },
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