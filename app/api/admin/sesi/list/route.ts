import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/admin/sesi/list
 * Mengembalikan semua sesi wawancara (terbaru dulu), beserta jumlah kuota terisi.
 */
export async function GET() {
  try {
    // Ambil semua sesi, urut tanggal ascending
    const { data: sesiList, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, distribusi_done, jalur_masuk")
      .order("tanggal", { ascending: true });

    if (error) throw error;

    if (!sesiList || sesiList.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Untuk setiap sesi, hitung berapa kuota yang sudah terisi
    const sesiIds = sesiList.map(s => s.id);
    const { data: kuotaCounts } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("sesi_id")
      .in("sesi_id", sesiIds);

    // Count per sesi_id
    const countMap: Record<number, number> = {};
    (kuotaCounts ?? []).forEach(k => {
      countMap[k.sesi_id] = (countMap[k.sesi_id] ?? 0) + 1;
    });

    const result = sesiList.map(s => ({
      ...s,
      kuota_terisi: countMap[s.id] ?? 0,
    }));

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[GET /api/admin/sesi/list]", err);
    return NextResponse.json(
      { error: "Gagal mengambil daftar sesi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
