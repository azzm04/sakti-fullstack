import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Proxy ke FastAPI SMART-TOPSIS
// 1. Terima jalur_masuk + kuota dari frontend
// 2. Filter kandidat berdasarkan jalur
// 3. Kirim ke Smart TOPSIS
// 4. Terima skor & ranking, update DB dengan status_seleksi
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jalur_masuk, kuota } = body;

    // Validasi input
    if (!jalur_masuk) {
      return NextResponse.json(
        { error: "jalur_masuk wajib diisi" },
        { status: 400 }
      );
    }
    if (!kuota || kuota <= 0) {
      return NextResponse.json(
        { error: "kuota harus > 0" },
        { status: 400 }
      );
    }

    // Ambil env var — API URL dari environment, bukan dari user input
    const apiUrl = process.env.NEXT_PUBLIC_TOPSIS_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_TOPSIS_API_URL tidak dikonfigurasi di server" },
        { status: 500 }
      );
    }

    // Filter kandidat berdasarkan jalur_masuk
    const { data: kandidats, error } = await supabaseAdmin
      .from("kandidat")
      .select("*")
      .eq("jalur_masuk", jalur_masuk)
      .order("no", { ascending: true });

    if (error) throw error;

    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json(
        { error: `Belum ada kandidat untuk jalur ${jalur_masuk}` },
        { status: 400 }
      );
    }

    console.log(`[TOPSIS] Mengirim ${kandidats.length} kandidat dari jalur ${jalur_masuk} ke ${apiUrl}`);

    // Kirim data kandidat (dari jalur terpilih) ke FastAPI SMART-TOPSIS
    const topsisRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alternatives: kandidats,
        kuota: kuota, // Single kuota value
      }),
    });

    if (!topsisRes.ok) {
      const errText = await topsisRes.text().catch(() => "");
      console.error(`[TOPSIS] Error dari API: ${topsisRes.status} ${errText}`);
      return NextResponse.json(
        { error: `API error ${topsisRes.status}: ${errText}` },
        { status: topsisRes.status }
      );
    }

    const result = await topsisRes.json();
    console.log(`[TOPSIS] Menerima response dari API`, result);

    // Normalisasi response dari FastAPI — bisa array atau { data: [...] }
    const ranked = Array.isArray(result) ? result : (result.data ?? result.hasil ?? []);

    if (!Array.isArray(ranked) || ranked.length === 0) {
      return NextResponse.json(
        { error: "Response dari SMART-TOPSIS tidak valid" },
        { status: 400 }
      );
    }

    // Update tabel kandidat dengan skor_total, ranking, status_seleksi
    // Lolos = ranking <= kuota, Tidak lolos = ranking > kuota
    for (const item of ranked) {
      if (!item.id) continue;

      const ranking = Number(item.ranking ?? item.rank ?? 0);
      const skor = Number(item.skor ?? item.skor_total ?? item.score ?? 0);
      const statusSeleksi = ranking <= kuota ? "LOLOS" : "TIDAK LOLOS";

      console.log(`[TOPSIS UPDATE] ID ${item.id}: skor=${skor}, ranking=${ranking}, status=${statusSeleksi}`);

      const { error: updateError } = await supabaseAdmin
        .from("kandidat")
        .update({
          skor_total: skor,
          ranking: ranking,
          status_seleksi: statusSeleksi,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(`[TOPSIS] Error update ID ${item.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      jalur_masuk: jalur_masuk,
      kuota: kuota,
      data: ranked,
      kandidat_count: ranked.length,
      updated: ranked.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/kalkulasi/topsis]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghubungi API SMART-TOPSIS" },
      { status: 500 }
    );
  }
}
