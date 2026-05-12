import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email as string;

    // Cari data pewawancara dari email
    const { data: pw, error: pwErr } = await supabaseAdmin
      .from("pewawancara")
      .select("id, total_assigned, total_completed")
      .eq("email", email)
      .single();

    if (pwErr || !pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const mode   = searchParams.get("mode") ?? "saya";
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // Hitung progress jatah sendiri berdasarkan hasil_wawancara
    // Selesai = kandidat yang ditugaskan ke pewawancara ini dan sudah ada hasil evaluasi
    const { count: jatahTotal } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id);

    const { count: jatahSelesai } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id)
      .not("hasil_akhir", "is", null);

    const jatahSudahSelesai = (jatahTotal ?? 0) > 0 && (jatahSelesai ?? 0) >= (jatahTotal ?? 0);

    // Mode hari_ini dan semua hanya boleh jika jatah sendiri sudah selesai
    if ((mode === "hari_ini" || mode === "semua") && !jatahSudahSelesai) {
      return NextResponse.json({
        error: "Selesaikan semua wawancara jatahmu terlebih dahulu",
        locked: true,
        jatah_selesai: jatahSelesai ?? 0,
        jatah_total:   jatahTotal ?? 0,
      }, { status: 403 });
    }

    // ── Bangun query berdasarkan mode ────────────────────────────────────────
    // Ambil kandidat yang ter-assign via hasil_wawancara
    let assignmentQuery = supabaseAdmin
      .from("hasil_wawancara")
      .select("kandidat_id");

    if (mode === "saya") {
      // Hanya kandidat yang ditugaskan ke pewawancara ini
      assignmentQuery = assignmentQuery.eq("pewawancara_id", pw.id);
    } else if (mode === "hari_ini") {
      // Kandidat yang di-assign hari ini (based on created_at)
      const today = new Date().toISOString().split("T")[0];
      assignmentQuery = assignmentQuery
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lte("created_at", `${today}T23:59:59.999Z`);
    } else {
      // Semua kandidat yang sudah di-assign (untuk mode "semua")
      assignmentQuery = assignmentQuery.not("pewawancara_id", "is", null);
    }

    const { data: assignmentData } = await assignmentQuery;
    const kandidatIds = (assignmentData ?? []).map((a) => a.kandidat_id);

    if (!kandidatIds.length) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        totalPages: 0,
        jatah_selesai: jatahSelesai,
        jatah_total: jatahTotal ?? 0,
      });
    }

    // Ambil data kandidat dengan filter
    const selectFields = `id, no, no_pendaftaran_kipk, nama, prodi`;

    let query = supabaseAdmin
      .from("kandidat")
      .select(selectFields, { count: "exact" })
      .in("id", kandidatIds)
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(`nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%`);
    }

    const { data: rawData, count, error } = await query;

    if (error) {
      console.error("[GET Pewawancara Mahasiswa] DB Error:", error);
      throw error;
    }

    const data = (rawData ?? []).map((row) => {
      return {
        id:                  String(row.id),
        no:                  row.no,
        no_pendaftaran_kipk: row.no_pendaftaran_kipk,
        nama:                row.nama,
        prodi:               row.prodi,
      };
    });

    return NextResponse.json({
      data,
      total:               count ?? 0,
      page,
      totalPages:          Math.ceil((count ?? 0) / limit),
      jatah_selesai:       jatahSelesai ?? 0,
      jatah_total:         jatahTotal ?? 0,
      jatah_sudah_selesai: jatahSudahSelesai,
    });

  } catch (err) {
    console.error("[GET /api/pewawancara/mahasiswa]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}