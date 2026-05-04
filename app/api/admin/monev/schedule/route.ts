import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

// GET  /api/admin/monev/schedule
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("monev_schedules")
      .select(`id, tipe_monev, label, waktu_mulai, deadline, "isActive", "createdAt", updated_at`)
      .order('"createdAt"', { ascending: false });

    if (error) throw error;

    // Normalisasi ke snake_case untuk konsistensi di frontend
    const normalized = (data ?? []).map((row) => ({
      id:          row.id,
      tipe_monev:  row.tipe_monev,
      label:       row.label,
      waktu_mulai: row.waktu_mulai,
      deadline:    row.deadline,
      is_active:   row["isActive"],
      created_at:  row["createdAt"],
      updated_at:  row.updated_at,
    }));

    return NextResponse.json({ data: normalized });
  } catch (err) {
    console.error("[GET /api/admin/monev/schedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil jadwal" },
      { status: 500 }
    );
  }
}

// POST /api/admin/monev/schedule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipe_monev, label, waktu_mulai, deadline } = body as {
      tipe_monev: string;
      label: string;
      waktu_mulai?: string | null;
      deadline: string;
    };

    if (!tipe_monev || !label || !deadline) {
      return NextResponse.json(
        { error: "tipe_monev, label, dan deadline wajib diisi" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = randomUUID();

    const { data, error } = await supabaseAdmin
      .from("monev_schedules")
      .insert({
        id,
        tipe_monev,
        label,
        waktu_mulai:  waktu_mulai ?? null,
        deadline,
        isActive:     true,   // camelCase sesuai kolom DB
        createdAt:    now,    // camelCase sesuai kolom DB
        updatedAt:    now,    // camelCase sesuai kolom DB
        updated_at:   now,    // snake_case kolom kedua
      })
      .select()
      .single();

    if (error) throw error;

    // Normalisasi response
    const normalized = {
      id:          data.id,
      tipe_monev:  data.tipe_monev,
      label:       data.label,
      waktu_mulai: data.waktu_mulai,
      deadline:    data.deadline,
      is_active:   data["isActive"],
      created_at:  data["createdAt"],
      updated_at:  data.updated_at,
    };

    return NextResponse.json({ data: normalized }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/monev/schedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat jadwal" },
      { status: 500 }
    );
  }
}
