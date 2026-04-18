import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "semua";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // ── Query halaman (dengan filter & search) ────────────────────────────────
    let query = supabaseAdmin
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama, prodi, nik, no_hp, email, " +
        "rekomendasi, pewawancara, hasil_akhir, import_batch_id, created_at, " +
        "status_wawancara, pewawancara_id",
        { count: "exact" }
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi.ilike.%${search}%`
      );
    }

    if (filter === "selesai") {
      query = query.not("hasil_akhir", "is", null).not("pewawancara", "is", null)
        .neq("pewawancara", "");
    } else if (filter === "belum") {
      query = query.or("hasil_akhir.is.null,pewawancara.is.null,pewawancara.eq.");
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const [{ count: totalSelesai }, { count: totalBelum }] = await Promise.all([
      supabaseAdmin
        .from("kandidat")
        .select("id", { count: "exact", head: true })
        .not("hasil_akhir", "is", null)
        .not("pewawancara", "is", null)
        .neq("pewawancara", ""),
      supabaseAdmin
        .from("kandidat")
        .select("id", { count: "exact", head: true })
        .or("hasil_akhir.is.null,pewawancara.is.null,pewawancara.eq."),
    ]);

    return NextResponse.json({
      data:         data ?? [],
      total:        count ?? 0,
      page,
      totalPages:   Math.ceil((count ?? 0) / limit),
      totalSelesai: totalSelesai ?? 0,
      totalBelum:   totalBelum  ?? 0,
    });
  } catch (err) {
    console.error("[GET /api/admin/evaluasi]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
