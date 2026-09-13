import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

async function getUserId(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("sakti_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return (payload.sub ?? null) as string | null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const row = await prisma.pengunduran_diri.findFirst({
      where:  { user_id: userId },
      select: { storage_path: true },
      orderBy: { created_at: "desc" },
    });

    if (!row) return NextResponse.json({ error: "Tidak ditemukan." }, { status: 404 });

    const { data, error } = await supabaseAdmin.storage
      .from("pengunduran-diri")
      .createSignedUrl(row.storage_path, 60);

    if (error || !data) {
      return NextResponse.json({ error: "Gagal membuat link unduhan." }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err: any) {
    console.error("GET mahasiswa surat signed URL error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
