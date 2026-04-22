import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

interface RawKandidatData {
  id: number | string;
  no: number;
  no_pendaftaran_kipk: string;
  nama: string;
  prodi: string;
  hasil_wawancara?: {
    id: number;
    rekomendasi?: string | null;
    alasan?: string | null;
    is_draft?: boolean;
    pewawancara_id?: number | null;
    updated_at?: string;
    created_at?: string;
    pewawancara?: {
      nama: string;
    } | { nama: string }[];
  } | any[]; // Terkadang Supabase mereturn array dari relasi 1-to-1
}

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
    const mode   = searchParams.get("mode") ?? "saya"; // saya | hari_ini | semua
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // Cek apakah jatah sendiri sudah selesai semua
    // Di tabel hasil_wawancara yang baru, selesai artinya rekomendasi tidak null
    const { count: jatahSelesai } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id)
      .not("rekomendasi", "is", null);

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

    // Bangun Query Utama
    let query = supabaseAdmin
      .from("kandidat")
      .select(`
        id, no, no_pendaftaran_kipk, nama, prodi,
        hasil_wawancara(id, rekomendasi, alasan, is_draft, pewawancara_id, updated_at, created_at,
          pewawancara:pewawancara_id(nama)
        )
      `, { count: "exact" })
      .order("no", { ascending: true })
      .range(from, to);

    if (mode === "saya") {
      // Hanya mahasiswa yang ditugaskan ke pewawancara ini (!inner memaksa join ketat)
      query = supabaseAdmin
        .from("kandidat")
        .select(`
          id, no, no_pendaftaran_kipk, nama, prodi,
          hasil_wawancara!inner(id, rekomendasi, alasan, is_draft, pewawancara_id, updated_at, created_at,
            pewawancara:pewawancara_id(nama)
          )
        `, { count: "exact" })
        .eq("hasil_wawancara.pewawancara_id", pw.id)
        .order("no", { ascending: true })
        .range(from, to);

    } else if (mode === "hari_ini") {
      // Ambil tugas yang dibuat (created_at) pada hari ini di hasil_wawancara
      const today = new Date().toISOString().split("T")[0];
      const start = `${today}T00:00:00.000Z`;
      const end   = `${today}T23:59:59.999Z`;

      query = supabaseAdmin
        .from("kandidat")
        .select(`
          id, no, no_pendaftaran_kipk, nama, prodi,
          hasil_wawancara!inner(id, rekomendasi, alasan, is_draft, pewawancara_id, updated_at, created_at,
            pewawancara:pewawancara_id(nama)
          )
        `, { count: "exact" })
        .gte("hasil_wawancara.created_at", start)
        .lte("hasil_wawancara.created_at", end)
        .order("no", { ascending: true })
        .range(from, to);

    } else {
      // Mode Semua - Gunakan query awal (semua kandidat)
    }

    if (search) {
      query = query.or(`nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi.ilike.%${search}%`);
    }

    const { data: rawData, count, error } = await query as { data: RawKandidatData[] | null, count: number | null, error: any };
    
    if (error) {
      console.error("[GET Pewawancara Mahasiswa] DB Error:", error);
      throw error;
    }

    const data = (rawData ?? []).map((row: RawKandidatData) => {
      const hwArray = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara : [row.hasil_wawancara];
      const hw = hwArray[0]; 
      
      const pwArray = Array.isArray(hw?.pewawancara) ? hw?.pewawancara : [hw?.pewawancara];
      const pwData = pwArray[0];

      return {
        id: String(row.id),
        no: row.no,
        no_pendaftaran_kipk: row.no_pendaftaran_kipk,
        nama: row.nama,
        prodi: row.prodi,
        pewawancara_id: hw?.pewawancara_id,
        pewawancara: pwData?.nama || null,
        rekomendasi: hw?.rekomendasi,
        alasan: hw?.alasan,
        is_draft: hw?.is_draft,
        status_wawancara: hw?.rekomendasi ? "completed" : "pending",
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
    console.error("[GET /api/pewawancara/mahasiswa]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}