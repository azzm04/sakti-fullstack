import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/monev/schedule — untuk mahasiswa
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("monev_schedules")
      .select(`id, tipe_monev, label, waktu_mulai, deadline, "isActive", "createdAt"`)
      .order('"createdAt"', { ascending: false });

    if (error) throw error;

    const normalized = (data ?? []).map((row) => ({
      id:          row.id,
      tipe_monev:  row.tipe_monev,
      label:       row.label,
      waktu_mulai: row.waktu_mulai,
      deadline:    row.deadline,
      is_active:   row["isActive"],
      created_at:  row["createdAt"],
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
