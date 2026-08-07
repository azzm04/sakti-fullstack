import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Redirect ke signed URL — berlaku 60 menit
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    const { data: row, error } = await supabase
      .from("sk_dokumen")
      .select("storage_path, nama_file")
      .eq("id", id)
      .single();

    if (error || !row) return NextResponse.json({ error: "SK tidak ditemukan" }, { status: 404 });

    const { data: signed, error: signErr } = await supabase.storage
      .from("sk-dokumen")
      .createSignedUrl(row.storage_path, 60 * 60); // 1 jam

    if (signErr || !signed) throw signErr ?? new Error("Gagal buat signed URL");

    return NextResponse.redirect(signed.signedUrl);
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal membuka preview", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
