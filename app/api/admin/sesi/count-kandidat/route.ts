import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/sesi/count-kandidat?jalur_masuk=SNBT
 * Menghitung total kandidat berdasarkan jalur masuk yang belum di-assign wawancara.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jalurMasuk = searchParams.get("jalur_masuk");

    if (!jalurMasuk) {
      return NextResponse.json({ error: "jalur_masuk wajib diisi" }, { status: 400 });
    }

    // Hitung total kandidat untuk jalur masuk tertentu
    const { count, error } = await supabaseAdmin
      .from("kandidat")
      .select("id", { count: "exact", head: true })
      .eq("jalur_masuk", jalurMasuk);

    if (error) throw error;

    // Hitung yang sudah di-assign (sudah punya pewawancara di hasil_wawancara)
    // Kita ambil kandidat_id dari hasil_wawancara yang jalur_masuknya sesuai
    const { data: assignedKandidats } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("kandidat_id, kandidat!inner(jalur_masuk)")
      .eq("kandidat.jalur_masuk", jalurMasuk)
      .not("pewawancara_id", "is", null);

    const totalAssigned = assignedKandidats?.length ?? 0;
    const totalBelumAssign = (count ?? 0) - totalAssigned;

    return NextResponse.json({
      jalur_masuk: jalurMasuk,
      total: count ?? 0,
      total_assigned: totalAssigned,
      total_belum_assign: Math.max(0, totalBelumAssign),
    });
  } catch (err) {
    console.error("[GET /api/admin/sesi/count-kandidat]", err);
    return NextResponse.json(
      { error: "Gagal menghitung kandidat", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
