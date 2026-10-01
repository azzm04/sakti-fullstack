import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// 1. EDIT JUDUL HISTORY (PATCH)
// ==========================================
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> } // 1. Ubah tipe params menjadi Promise
) {
  try {
    const { judul } = await request.json();
    
    // 2. Tambahkan await saat mendestrukturisasi params
    const { id } = await context.params; 

    const updatedSession = await prisma.chatSession.update({
      where: { id: id },
      data: { judul: judul },
    });

    return Response.json(updatedSession);
  } catch (error) {
    console.error(error);
    return new Response("Gagal memperbarui judul", { status: 500 });
  }
}


// 2. HAPUS HISTORY (DELETE)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> } // Ubah tipe params menjadi Promise
) {
  try {
    const { id } = await context.params; // Tambahkan await di sini
    
    await prisma.chatSession.delete({
      where: { id: id },
    });
    
    return new Response("Berhasil dihapus", { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response("Error", { status: 500 });
  }
}
