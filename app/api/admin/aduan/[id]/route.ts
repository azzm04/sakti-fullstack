import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; 

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 1. Ubah tipe params menjadi Promise
) {
  try {
    // 2. Wajib di-await terlebih dahulu untuk versi Next.js saat ini
    const { id } = await params;
    
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status baru wajib dikirimkan" },
        { status: 400 }
      );
    }

    // Memperbarui status di database berdasarkan ID yang sudah aman
    const updatedAduan = await prisma.aduan.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(
      { 
        message: "Status laporan berhasil diperbarui", 
        data: updatedAduan 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("[ADMIN_ADUAN_PATCH]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status laporan" },
      { status: 500 }
    );
  }
}