import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

type Ctx = { params: Promise<{ id: string }> };

// ==========================================
// 1. EDIT JUDUL HISTORY (PATCH)
// ==========================================
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const judul = typeof body?.judul === "string" ? body.judul.trim() : "";

    if (!judul || judul.length > 255) {
      return NextResponse.json(
        { error: "Judul wajib diisi (maksimal 255 karakter)" },
        { status: 400 }
      );
    }

    // updateMany dengan syarat userId: sesi orang lain tidak akan ikut berubah
    const hasil = await prisma.chatSession.updateMany({
      where: { id, userId: user.id },
      data: { judul },
    });

    if (hasil.count === 0) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ id, judul });
  } catch (error) {
    console.error("Gagal memperbarui judul:", error);
    return NextResponse.json({ error: "Gagal memperbarui judul" }, { status: 500 });
  }
}

// ==========================================
// 2. HAPUS HISTORY (DELETE)
// ==========================================
export async function DELETE(_request: Request, context: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const { id } = await context.params;

    // Pesan ikut terhapus karena relasi onDelete: Cascade
    const hasil = await prisma.chatSession.deleteMany({
      where: { id, userId: user.id },
    });

    if (hasil.count === 0) {
      return NextResponse.json({ error: "Percakapan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Gagal menghapus percakapan:", error);
    return NextResponse.json({ error: "Gagal menghapus percakapan" }, { status: 500 });
  }
}