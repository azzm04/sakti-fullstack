import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — ambil semua kandidat dengan kolom wawancara
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search  = searchParams.get("search") ?? "";
    const filter  = searchParams.get("filter") ?? "semua"; // semua | selesai | belum
    const page    = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit   = 50;
    const from    = (page - 1) * limit;
    const to      = from + limit - 1;

    let query = supabase
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama, prodi, nik, no_hp, email, " +
        "rekomendasi, pewawancara, import_batch_id, created_at",
        { count: "exact" }
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi.ilike.%${search}%`
      );
    }

    // Filter berdasarkan status evaluasi
    if (filter === "selesai") {
      query = query.not("rekomendasi", "is", null).not("pewawancara", "is", null)
        .neq("rekomendasi", "").neq("pewawancara", "");
    } else if (filter === "belum") {
      query = query.or("rekomendasi.is.null,rekomendasi.eq.,pewawancara.is.null,pewawancara.eq.");
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data:       data ?? [],
      total:      count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error("[GET /api/admin/evaluasi]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
