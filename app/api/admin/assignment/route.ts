import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET — list assignments untuk tanggal tertentu
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal"); // format: YYYY-MM-DD
    const pewawancaraId = searchParams.get("pewawancara_id");
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("wawancara_assignment")
      .select(`
        id, blok, status, scheduled_at, completed_at, created_at,
        kandidat_id, pewawancara_id
      `, { count: "exact" })
      .order("created_at", { ascending: true });

    // Filter by tanggal (scheduled_at)
    if (tanggal) {
      const start = `${tanggal}T00:00:00.000Z`;
      const end   = `${tanggal}T23:59:59.999Z`;
      query = query.gte("scheduled_at", start).lte("scheduled_at", end);
    }

    if (pewawancaraId) query = query.eq("pewawancara_id", pewawancaraId);
    if (status) query = query.eq("status", status);

    const { data, count, error } = await query;
    if (error) throw error;

    // Ambil detail kandidat & pewawancara secara terpisah
    const kandidatIds = [...new Set((data ?? []).map((d) => d.kandidat_id))];
    const pewawancaraIds = [...new Set((data ?? []).map((d) => d.pewawancara_id))];

    const [{ data: kandidats }, { data: pewawancaras }] = await Promise.all([
      kandidatIds.length > 0
        ? supabaseAdmin
            .from("kandidat")
            .select("id, nama, prodi, no_pendaftaran_kipk, status_wawancara")
            .in("id", kandidatIds)
        : Promise.resolve({ data: [] }),
      pewawancaraIds.length > 0
        ? supabaseAdmin
            .from("pewawancara")
            .select("id, nama, email")
            .in("id", pewawancaraIds)
        : Promise.resolve({ data: [] }),
    ]);

    const kandidatMap = Object.fromEntries((kandidats ?? []).map((k) => [k.id, k]));
    const pewawancaraMap = Object.fromEntries((pewawancaras ?? []).map((p) => [p.id, p]));

    const enriched = (data ?? []).map((a) => ({
      ...a,
      kandidat: kandidatMap[a.kandidat_id] ?? null,
      pewawancara: pewawancaraMap[a.pewawancara_id] ?? null,
    }));

    return NextResponse.json({ data: enriched, total: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST — buat assignment: assign kandidat ke pewawancara untuk tanggal tertentu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { kandidat_id, pewawancara_id, scheduled_at } = body;

    if (!kandidat_id || !pewawancara_id || !scheduled_at) {
      return NextResponse.json(
        { error: "kandidat_id, pewawancara_id, dan scheduled_at wajib diisi" },
        { status: 400 }
      );
    }

    // Cek apakah kandidat sudah punya assignment pending/scheduled
    const { data: existing } = await supabaseAdmin
      .from("wawancara_assignment")
      .select("id")
      .eq("kandidat_id", kandidat_id)
      .in("status", ["pending", "scheduled"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Kandidat sudah memiliki jadwal wawancara aktif" },
        { status: 409 }
      );
    }

    // Insert assignment
    const { data, error } = await supabaseAdmin
      .from("wawancara_assignment")
      .insert({ kandidat_id, pewawancara_id, scheduled_at, status: "pending" })
      .select()
      .single();

    if (error) throw error;

    // Update kandidat: status_wawancara → scheduled, set pewawancara_id
    await supabaseAdmin
      .from("kandidat")
      .update({
        status_wawancara: "scheduled",
        pewawancara_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", kandidat_id);

    // Increment total_assigned pewawancara (manual, tanpa RPC)
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("total_assigned")
      .eq("id", pewawancara_id)
      .single();

    if (pw) {
      await supabaseAdmin
        .from("pewawancara")
        .update({ total_assigned: (pw.total_assigned ?? 0) + 1 })
        .eq("id", pewawancara_id);
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal membuat assignment", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// DELETE — batalkan assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });

    const { data: assignment } = await supabaseAdmin
      .from("wawancara_assignment")
      .select("kandidat_id, pewawancara_id")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin
      .from("wawancara_assignment")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;

    if (assignment) {
      // Reset status kandidat
      await supabaseAdmin
        .from("kandidat")
        .update({
          status_wawancara: "pending",
          pewawancara_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment.kandidat_id);

      // Kurangi total_assigned
      const { data: pw } = await supabaseAdmin
        .from("pewawancara")
        .select("total_assigned")
        .eq("id", assignment.pewawancara_id)
        .single();

      if (pw) {
        await supabaseAdmin
          .from("pewawancara")
          .update({ total_assigned: Math.max(0, (pw.total_assigned ?? 1) - 1) })
          .eq("id", assignment.pewawancara_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal membatalkan assignment", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
