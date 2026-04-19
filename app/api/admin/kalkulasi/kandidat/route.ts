import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET — ambil semua kandidat yang sudah selesai wawancara (hasil_akhir terisi)
// Data ini yang akan dikirim ke API SMART-TOPSIS
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("kandidat")
      .select("*")
      .not("hasil_akhir", "is", null)
      .not("pewawancara", "is", null)
      .neq("pewawancara", "")
      .order("no", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [], total: data?.length ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
