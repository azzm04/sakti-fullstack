import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH /api/admin/monev/schedule/[id]  — toggle aktif / edit field lain
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const now = new Date().toISOString();

    // Map snake_case dari frontend → camelCase kolom DB
    const payload: Record<string, unknown> = { updatedAt: now, updated_at: now };

    if (body.is_active !== undefined) payload["isActive"]    = body.is_active;
    if (body.tipe_monev !== undefined) payload["tipe_monev"] = body.tipe_monev;
    if (body.label !== undefined)      payload["label"]      = body.label;
    if (body.waktu_mulai !== undefined) payload["waktu_mulai"] = body.waktu_mulai;
    if (body.deadline !== undefined)   payload["deadline"]   = body.deadline;

    const { data, error } = await supabaseAdmin
      .from("periode_monev")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

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

    return NextResponse.json({ data: normalized });
  } catch (err) {
    console.error("[PATCH /api/admin/monev/schedule/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update jadwal" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monev/schedule/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("periode_monev")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/monev/schedule/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal hapus jadwal" },
      { status: 500 }
    );
  }
}
