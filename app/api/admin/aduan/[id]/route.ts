import { NextRequest, NextResponse } from "next/server";
import { StatusAduan } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSesiAdmin } from "@/lib/auth/sesi-admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Wajib login sebagai admin
    const sesi = await getSesiAdmin();
    if (!sesi) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    // 2. Status harus salah satu nilai enum yang sah
    if (!status || !Object.values(StatusAduan).includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    // 3. Pastikan pengirimnya memang ada di tabel admin_users.
    //    (admin_id memiliki foreign key ke tabel itu, sehingga id dari
    //    tabel lain akan membuat penyimpanan gagal)
    const admin = await prisma.adminUser.findUnique({
      where: { id: sesi.id },
      select: { id: true },
    });

    // 4. Simpan status beserta admin yang menangani
    const updated = await prisma.aduan.update({
      where: { id },
      data: {
        status,
        ...(admin ? { admin_id: admin.id } : {}),
      },
      select: { id: true, status: true, admin_id: true },
    });

    return NextResponse.json(
      { message: "Status laporan berhasil diperbarui", data: updated },
      { status: 200 }
    );
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan" },
        { status: 404 }
      );
    }
    console.error("[ADMIN_ADUAN_PATCH]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui status laporan" },
      { status: 500 }
    );
  }
}