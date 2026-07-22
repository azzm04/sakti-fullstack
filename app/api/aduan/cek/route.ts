import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; // Sesuaikan dengan jalur file prisma Anda

export async function GET(req: NextRequest) {
  try {
    // Mengambil parameter kode dari URL (contoh: /api/aduan/cek?kode=ADUAN-123)
    const searchParams = req.nextUrl.searchParams;
    const kode = searchParams.get("kode");

    if (!kode) {
      return NextResponse.json({ error: "Kode resi wajib diisi" }, { status: 400 });
    }

    // Mencari laporan di database
    const aduan = await prisma.aduan.findUnique({
      where: { kode_laporan: kode },
      // HANYA pilih kolom yang aman untuk ditampilkan ke publik
      select: {
        kode_laporan: true,
        status: true,
        jenis_aduan: true,
        created_at: true,
      },
    });

    if (!aduan) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan. Pastikan penulisan kode resi sudah benar." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: aduan }, { status: 200 });
  } catch (error) {
    console.error("[CEK_ADUAN_GET]", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}