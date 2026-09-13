import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const { status, catatan_admin } = body;

    const allowed = ["MENUNGGU_VERIFIKASI", "DIPROSES", "DITERIMA", "DITOLAK"] as const;
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.pengunduran_diri.update({
      where: { id },
      data: {
        status,
        catatan_admin: catatan_admin ?? null,
        diproses_at:   status === "DIPROSES"  ? now : undefined,
        diputuskan_at: (status === "DITERIMA" || status === "DITOLAK") ? now : undefined,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("PUT pengunduran-diri status error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
