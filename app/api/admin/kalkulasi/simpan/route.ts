import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST — simpan skor & ranking hasil SMART-TOPSIS ke tabel kandidat
export async function POST(req: NextRequest) {
  try {
    const { hasil } = await req.json();

    if (!Array.isArray(hasil) || hasil.length === 0) {
      return NextResponse.json({ error: "Data hasil tidak valid" }, { status: 400 });
    }

    // Update skor_total, ranking, dan status_seleksi per kandidat
    for (const item of hasil) {
      if (!item.id) continue;
      await supabaseAdmin
        .from("kandidat")
        .update({
          skor_total:     item.skor_total ?? item.skor ?? item.score ?? 0,
          ranking:        item.ranking ?? item.rank ?? null,
          status_seleksi: item.lolos ? "lolos" : "tidak_lolos",
          updated_at:     new Date().toISOString(),
        })
        .eq("id", item.id);
    }

    return NextResponse.json({ success: true, updated: hasil.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menyimpan hasil", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
