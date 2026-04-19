import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Proxy ke FastAPI SMART-TOPSIS
// Kita kirim semua isi tabel kandidat — backend yang menentukan kriteria & bobotnya
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiUrl, kuota } = body;

    if (!apiUrl) {
      return NextResponse.json({ error: "URL API wajib diisi" }, { status: 400 });
    }

    // Ambil SEMUA kolom kandidat yang sudah selesai wawancara
    const { data: kandidats, error } = await supabaseAdmin
      .from("kandidat")
      .select("*")
      .not("hasil_akhir", "is", null)
      .not("pewawancara", "is", null)
      .neq("pewawancara", "")
      .order("no", { ascending: true });

    if (error) throw error;

    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json(
        { error: "Belum ada kandidat yang selesai diwawancara" },
        { status: 400 }
      );
    }

    // Kirim semua data kandidat ke FastAPI — backend yang proses
    const topsisRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kandidat: kandidats,
        kuota: kuota ?? { SNBP: 0, SNBT: 0, UM: 0 },
      }),
    });

    if (!topsisRes.ok) {
      const errText = await topsisRes.text().catch(() => "");
      return NextResponse.json(
        { error: `API error ${topsisRes.status}: ${errText}` },
        { status: topsisRes.status }
      );
    }

    const result = await topsisRes.json();

    // Response dari FastAPI bisa berupa array atau { data: [...] }
    // Kita teruskan apa adanya ke frontend
    return NextResponse.json({
      success: true,
      ...(Array.isArray(result) ? { data: result } : result),
      kandidat_count: kandidats.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/kalkulasi/topsis]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghubungi API SMART-TOPSIS" },
      { status: 500 }
    );
  }
}
