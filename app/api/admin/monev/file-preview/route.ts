import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "monev";

// GET /api/admin/monev/file-preview?path=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storagePath = searchParams.get("path");

    if (!storagePath) {
      return NextResponse.json(
        { error: "Parameter path wajib diisi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60);

    if (error) throw error;

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error("[GET /api/admin/monev/file-preview]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat preview URL" },
      { status: 500 }
    );
  }
}
