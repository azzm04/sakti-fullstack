import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const body = await req.json();
    const { admin_id } = body;
    const { id } = await params;

    const updated = await prisma.prestasi_mahasiswa.update({
      where: { id },
      data: {
        status_verifikasi: "TERVERIFIKASI",
        admin_id:          admin_id || null,
        diverifikasi_at:   new Date(),
      },
    });

    return NextResponse.json({ message: "Prestasi ditandai sebagai Terverifikasi", data: updated });
  } catch (error: any) {
    console.error("PUT Verify Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
