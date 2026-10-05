import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/monev/schedule — untuk mahasiswa
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("periode_monev")
      .select(`id, label, waktu_mulai, deadline, is_active, created_at`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const normalized = (data ?? []).map((row) => ({
      id:          row.id,
      label:       row.label,
      waktu_mulai: row.waktu_mulai,
      deadline:    row.deadline,
      is_active:   row.is_active,
      created_at:  row.created_at,
    }));

    return NextResponse.json({ data: normalized });
  } catch (err) {
    console.error("[GET /api/monev/schedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil jadwal" },
      { status: 500 }
    );
  }
}
