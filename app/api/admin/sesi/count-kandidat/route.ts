import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jalurMasuk = searchParams.get("jalur_masuk");

    if (!jalurMasuk) {
      return NextResponse.json({ error: "jalur_masuk wajib diisi" }, { status: 400 });
    }

    // 1. Cari semua ID batch impor yang memiliki jenis_impor sesuai (misal: "SNBT")
    const { data: batches, error: batchErr } = await supabaseAdmin
      .from("impor_data")
      .select("id")
      .ilike("jenis_impor", `${jalurMasuk}%`);

    if (batchErr) throw batchErr;

    const batchIds = batches?.map((b) => b.id) || [];

    // Jika belum ada data impor sama sekali untuk jalur ini, langsung kembalikan 0
    if (batchIds.length === 0) {
      return NextResponse.json({
        jalur_masuk: jalurMasuk,
        total: 0,
        total_assigned: 0,
        total_belum_assign: 0,
      });
    }

    // 2. Hitung total kandidat yang tergabung dalam batch_ids tersebut
    const { count, error: countErr } = await supabaseAdmin
      .from("kandidat")
      .select("id", { count: "exact", head: true })
      .in("impor_data_id", batchIds); // Filter menggunakan foreign key

    if (countErr) throw countErr;

    // 3. Hitung kandidat yang sudah di-assign (sudah punya pewawancara)
    // Filter INNER JOIN melalui kandidat -> impor_data_id
    const { data: assignedKandidats, error: assignErr } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("kandidat_id, kandidat!inner(impor_data_id)")
      .in("kandidat.impor_data_id", batchIds)
      .not("pewawancara_id", "is", null);

    if (assignErr) throw assignErr;

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
