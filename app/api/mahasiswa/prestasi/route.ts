import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Simulasi mendapatkan userId dari session.
    // TODO: Ganti dengan auth session asli dari SAKTI
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prestasi = await prisma.prestasiMahasiswa.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ data: prestasi });
  } catch (error: any) {
    console.error("GET Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      user_id, 
      jenis_prestasi, 
      tingkat, 
      nama_kegiatan, 
      prestasi_dicapai, 
      penyelenggara, 
      tanggal_mulai, 
      tanggal_selesai, 
      url_bukti 
    } = body;

    // Validasi input dasar
    if (!user_id || !jenis_prestasi || !tingkat || !nama_kegiatan || !prestasi_dicapai || !penyelenggara || !tanggal_mulai || !tanggal_selesai || !url_bukti) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newPrestasi = await prisma.prestasiMahasiswa.create({
      data: {
        user_id,
        jenis_prestasi,
        tingkat,
        nama_kegiatan,
        prestasi_dicapai,
        penyelenggara,
        tanggal_mulai: new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
        url_bukti,
        status_verifikasi: "MENUNGGU",
      }
    });

    return NextResponse.json({ message: "Prestasi berhasil ditambahkan", data: newPrestasi }, { status: 201 });
  } catch (error: any) {
    console.error("POST Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
