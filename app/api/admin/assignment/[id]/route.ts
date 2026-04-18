import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// PATCH — update status assignment (complete / cancel)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, scheduled_at } = body;

    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (scheduled_at) update.scheduled_at = scheduled_at;
    if (status === "completed") update.completed_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("wawancara_assignment")
      .update(update)
      .eq("id", id)
      .select("*, kandidat_id, pewawancara_id")
      .single();

    if (error) throw error;

    // Sync status_wawancara di tabel kandidat
    if (status === "completed" || status === "cancelled") {
      await supabaseAdmin
        .from("kandidat")
        .update({
          status_wawancara: status === "completed" ? "completed" : "cancelled",
          interviewed_at: status === "completed" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.kandidat_id);

      if (status === "completed") {
        await supabaseAdmin.rpc("increment_completed", { p_id: data.pewawancara_id });
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal update assignment", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
