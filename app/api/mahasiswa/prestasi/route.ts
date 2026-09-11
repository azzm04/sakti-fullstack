import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prestasi = await prisma.prestasi_mahasiswa.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: prestasi });
  } catch (error: any) {
    console.error("GET Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const user_id        = formData.get("user_id") as string;
    const jenis_prestasi = formData.get("jenis_prestasi") as any;
    const tingkat        = formData.get("tingkat") as any;
    const nama_kegiatan  = formData.get("nama_kegiatan") as string;
    const prestasi_dicapai = formData.get("prestasi_dicapai") as string;
    const penyelenggara  = formData.get("penyelenggara") as string;
    const tanggal_mulai  = formData.get("tanggal_mulai") as string;
    const tanggal_selesai = formData.get("tanggal_selesai") as string;
    const file           = formData.get("file_bukti") as File;

    if (!user_id || !jenis_prestasi || !tingkat || !nama_kegiatan || !prestasi_dicapai || !penyelenggara || !tanggal_mulai || !tanggal_selesai || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const timestamp   = Date.now();
    const ext         = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `${user_id}/bukti_${timestamp}.${ext}`;
    const bytes       = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("prestasi")
      .upload(storagePath, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Supabase Upload Error:", uploadError);
      return NextResponse.json({ error: "Gagal mengunggah file bukti" }, { status: 500 });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("prestasi")
      .getPublicUrl(storagePath);

    const newPrestasi = await prisma.prestasi_mahasiswa.create({
      data: {
        user_id,
        jenis_prestasi,
        tingkat,
        nama_kegiatan,
        prestasi_dicapai,
        penyelenggara,
        tanggal_mulai:  new Date(tanggal_mulai),
        tanggal_selesai: new Date(tanggal_selesai),
        url_bukti: publicUrlData.publicUrl,
      },
    });

    return NextResponse.json({ message: "Prestasi berhasil ditambahkan", data: newPrestasi }, { status: 201 });
  } catch (error: any) {
    console.error("POST Prestasi Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
