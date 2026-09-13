import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const { id } = await params;

    const row = await prisma.pengunduran_diri.findUnique({
      where: { id },
      select: { storage_path: true },
    });

    if (!row) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

    const { data, error } = await supabaseAdmin.storage
      .from("pengunduran-diri")
      .createSignedUrl(row.storage_path, 60);

    if (error || !data) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: "Gagal membuat link unduhan." }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: any) {
    console.error("GET surat signed URL error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
