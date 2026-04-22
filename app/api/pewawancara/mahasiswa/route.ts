import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

// GET — ambil mahasiswa dengan 3 mode filter:
//   mode=saya      → jatah pewawancara yang login
//   mode=hari_ini  → semua mahasiswa terjadwal hari ini (hanya jika jatah sendiri sudah selesai)
//   mode=semua     → seluruh kandidat (hanya jika jatah sendiri sudah selesai)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email as string;

    // Cari data pewawancara dari email
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, total_assigned, total_completed")
      .eq("email", email)
      .single();

    if (!pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const mode   = searchParams.get("mode") ?? "saya"; // saya | hari_ini | semua
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // Cek apakah jatah sendiri sudah selesai semua
    // (semua hasil_wawancara untuk pewawancara ini sudah punya rekomendasi)
    const { count: jatahSelesai } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id)
      .not("rekomendasi", "is", null)
      .neq("rekomendasi", "");

    const { count: jatahTotal } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id);

    const jatahSudahSelesai = (jatahTotal ?? 0) > 0 && (jatahSelesai ?? 0) >= (jatahTotal ?? 0);

    // Mode hari_ini dan semua hanya boleh jika jatah sendiri sudah selesai
    if ((mode === "hari_ini" || mode === "semua") && !jatahSudahSelesai) {
      return NextResponse.json({
        error: "Selesaikan semua wawancara jatahmu terlebih dahulu",
        locked: true,
        jatah_selesai: jatahSelesai ?? 0,
        jatah_total: jatahTotal ?? 0,
      }, { status: 403 });
    }

    let query = supabaseAdmin
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama, prodi, pewawancara_id, " +
        "hasil_wawancara(id, rekomendasi, alasan, is_draft, pewawancara_id, updated_at)",
        { count: "exact" }
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (mode === "saya") {
      // Hanya mahasiswa yang ditugaskan ke pewawancara ini
      query = query.eq("pewawancara_id", pw.id);

    } else if (mode === "hari_ini") {
      // Mahasiswa yang dijadwalkan hari ini via wawancara_assignment
      const today = new Date().toISOString().split("T")[0];
      const start = `${today}T00:00:00.000Z`;
      const end   = `${today}T23:59:59.999Z`;

      const { data: assignments } = await supabaseAdmin
        .from("wawancara_assignment")
        .select("kandidat_id")
        .gte("scheduled_at", start)
        .lte("scheduled_at", end)
        .neq("status", "cancelled");

      const ids = (assignments ?? []).map((a) => a.kandidat_id);
      if (ids.length === 0) {
        return NextResponse.json({ data: [], total: 0, page, totalPages: 0, jatah_selesai: jatahSelesai ?? 0, jatah_total: jatahTotal ?? 0 });
      }
      query = query.in("id", ids);

    } else {
      // mode === "semua" — semua kandidat tanpa filter
    }

    if (search) {
      query = query.or(`nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi.ilike.%${search}%`);
    }

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    // Flatten hasil_wawancara untuk client compatibility
    const data = (rawData ?? []).map((row: any) => {
      const hw = row.hasil_wawancara?.[0] || null;
      return {
        id: row.id,
        no: row.no,
        no_pendaftaran_kipk: row.no_pendaftaran_kipk,
        nama: row.nama,
        prodi: row.prodi,
        pewawancara_id: row.pewawancara_id,
        rekomendasi: hw?.rekomendasi,
        alasan: hw?.alasan,
        is_draft: hw?.is_draft,
        status_wawancara: hw ? "completed" : "pending",
      };
    });

    return NextResponse.json({
      data: data,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      jatah_selesai: jatahSelesai ?? 0,
      jatah_total: jatahTotal ?? 0,
      jatah_sudah_selesai: jatahSudahSelesai,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
