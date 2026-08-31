import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

interface HasilWawancaraRef {
  pewawancara_id: string | null;
  rekomendasi: string | null;
  is_draft: boolean | null;
  pewawancara: { nama: string | null } | { nama: string | null }[] | null;
}

interface KandidatRow {
  id: string;
  no: number | null;
  no_pendaftaran_kipk: string | null;
  nama_pendaftar: string | null;
  prodi_pendaftar: string | null;
  hasil_wawancara: HasilWawancaraRef | HasilWawancaraRef[] | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

const SELECT_FIELDS = `
  id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar,
  hasil_wawancara ( pewawancara_id, rekomendasi, is_draft, pewawancara:pewawancara_id ( nama ) )
`;

// Varian !inner — dipakai saat perlu MENYARING kandidat berdasarkan kolom di
// hasil_wawancara (mis. mode "hari_ini"). Tanpa !inner, filter di kolom
// relasi cuma menyaring isi array embed-nya, bukan baris kandidat itu sendiri.
const SELECT_FIELDS_INNER = `
  id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar,
  hasil_wawancara!inner ( pewawancara_id, rekomendasi, is_draft, pewawancara:pewawancara_id ( nama ) )
`;

function toListItem(row: KandidatRow) {
  const hw = firstOf(row.hasil_wawancara);
  const pewawancaraData = hw ? firstOf(hw.pewawancara) : null;

  return {
    id: row.id,
    no: row.no,
    no_pendaftaran_kipk: row.no_pendaftaran_kipk,
    nama: row.nama_pendaftar,
    prodi: row.prodi_pendaftar,
    pewawancara_id: hw?.pewawancara_id ?? null,
    pewawancara: pewawancaraData?.nama ?? null,
    rekomendasi: hw?.rekomendasi ?? null,
    is_draft: hw?.is_draft ?? null,
  };
}

// GET — daftar kandidat untuk portal pewawancara. Penugasan sesungguhnya
// hidup di hasil_wawancara.pewawancara_id (diisi lewat
// /api/admin/evaluasi/[id]/tugaskan) — sistem sesi/kuota lama
// (sesi_wawancara, kuota_pewawancara, tabel bigint) sudah tidak sinkron
// dengan skema UUID saat ini, jadi tidak lagi dipakai di sini.
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.sub ?? payload.id) as string;

    // Cari data pewawancara lewat relasi user_id (bukan kolom email — tabel
    // pewawancara tidak punya kolom email).
    const { data: pw, error: pwErr } = await supabaseAdmin
      .from("pewawancara")
      .select("id, total_assigned, total_completed")
      .eq("user_id", userId)
      .single();

    if (pwErr || !pw) {
      return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "saya";
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // ── Jatah (assigned ke saya vs sudah selesai) — tanpa konsep sesi ───────
    const { count: jatahTotal } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id);

    const { count: jatahSelesai } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id", { count: "exact", head: true })
      .eq("pewawancara_id", pw.id)
      .eq("is_draft", false);

    const jatahTotalHariIni = jatahTotal ?? 0;
    const jatahSelesaiHariIni = jatahSelesai ?? 0;
    const jatahSudahSelesai = jatahTotalHariIni > 0 && jatahSelesaiHariIni >= jatahTotalHariIni;

    // Mode "hari_ini" (bantu selesaikan sisa kandidat yang belum diwawancara
    // siapa pun) hanya boleh diakses setelah jatah sendiri tuntas.
    if (mode === "hari_ini" && !jatahSudahSelesai) {
      return NextResponse.json(
        {
          error: "Selesaikan semua wawancara jatahmu terlebih dahulu",
          locked: true,
          jatah_selesai: jatahSelesaiHariIni,
          jatah_total: jatahTotalHariIni,
        },
        { status: 403 },
      );
    }

    let query;

    if (mode === "saya") {
      // Kandidat yang di-assign ke saya (lewat tugaskan), belum tentu selesai.
      // Filter langsung lewat !inner (JOIN di level SQL) — BUKAN ambil semua
      // kandidat_id dulu lalu .in("id", [...]): dengan penugasan yang banyak,
      // daftar ID sepanjang itu melebihi batas panjang URL PostgREST dan
      // gagal dengan "Bad Request" (sempat terjadi saat pengujian).
      query = supabaseAdmin
        .from("kandidat")
        .select(SELECT_FIELDS_INNER, { count: "exact" })
        .eq("hasil_wawancara.pewawancara_id", pw.id);
    } else if (mode === "hari_ini") {
      // Kandidat yang sudah ditugaskan (ke siapa pun) tapi belum selesai —
      // supaya pewawancara yang jatahnya sudah tuntas bisa bantu sisa yang ada.
      // !inner wajib supaya filter ini benar-benar membatasi baris kandidat,
      // bukan cuma menyaring isi array hasil_wawancara yang ter-embed.
      query = supabaseAdmin
        .from("kandidat")
        .select(SELECT_FIELDS_INNER, { count: "exact" })
        .eq("hasil_wawancara.is_draft", true)
        .not("hasil_wawancara.pewawancara_id", "is", null);
    } else {
      // Semua: seluruh kandidat.
      query = supabaseAdmin.from("kandidat").select(SELECT_FIELDS, { count: "exact" });
    }

    query = query.order("no", { ascending: true }).range(from, to);
    if (search) {
      query = query.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%`,
      );
    }

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    const data = ((rawData ?? []) as unknown as KandidatRow[]).map(toListItem);

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      jatah_selesai: jatahSelesaiHariIni,
      jatah_total: jatahTotalHariIni,
      jatah_sudah_selesai: jatahSudahSelesai,
      // Penguncian per-tanggal sesi sudah tidak berlaku (sesi tidak lagi
      // dilacak di hasil_wawancara) — pengisian selalu terbuka.
      can_edit: true,
      sesi_list: [],
      sesi_id_aktif: null,
    });
  } catch (err) {
    console.error("[GET /api/pewawancara/mahasiswa]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
