import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
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

    const pengajuan = await prisma.pengunduran_diri.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: pengajuan });
  } catch (err: any) {
    console.error("GET pengunduran-diri error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.pengunduran_diri.findFirst({
      where: {
        user_id: userId,
        status: { notIn: ["DITERIMA", "DITOLAK"] },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah memiliki pengajuan yang sedang diproses." },
        { status: 409 },
      );
    }

    const formData = await req.formData();
    const semester = parseInt(formData.get("semester") as string, 10);
    const alasan   = formData.get("alasan") as string;
    const file     = formData.get("surat") as File;

    if (!semester || !alasan || !file) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 5 MB." }, { status: 400 });
    }

    const ext         = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `${userId}/surat_${Date.now()}.${ext}`;
    const bytes       = await file.arrayBuffer();

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("pengunduran-diri")
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return NextResponse.json({ error: "Gagal mengunggah surat." }, { status: 500 });
    }

    const pengajuan = await prisma.pengunduran_diri.create({
      data: { user_id: userId, semester, alasan, storage_path: storagePath },
    });

    return NextResponse.json({ data: pengajuan }, { status: 201 });
  } catch (err: any) {
    console.error("POST pengunduran-diri error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
