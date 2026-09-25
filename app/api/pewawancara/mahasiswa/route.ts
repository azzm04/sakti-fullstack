import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";
import { JALUR_LABELS, jalurKeyFromValue, resolveJalurAliases, type JalurKey } from "@/lib/jalur";

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
  jalur_masuk: string | null;
  hasil_wawancara: HasilWawancaraRef | HasilWawancaraRef[] | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

const SELECT_FIELDS = `
  id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar, jalur_masuk,
  hasil_wawancara ( pewawancara_id, rekomendasi, is_draft, pewawancara:pewawancara_id ( nama ) )
`;

// Varian !inner — dipakai saat perlu MENYARING kandidat berdasarkan kolom di
// hasil_wawancara (mis. mode "hari_ini"). Tanpa !inner, filter di kolom
// relasi cuma menyaring isi array embed-nya, bukan baris kandidat itu sendiri.
const SELECT_FIELDS_INNER = `
  id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar, jalur_masuk,
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
    jalur_masuk: row.jalur_masuk,
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
    const status = searchParams.get("status") ?? "semua"; // "semua" | "sudah" | "belum"
    const jalur = searchParams.get("jalur") ?? ""; // JalurKey, kosong = semua jalur
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

    const wantStatusFilter = status === "sudah" || status === "belum";

    let query;

    if (mode === "saya") {
      // Kandidat yang di-assign ke saya (lewat tugaskan), belum tentu selesai.
      // Filter langsung lewat !inner (JOIN di level SQL) — BUKAN ambil semua
      // kandidat_id dulu lalu .in("id", [...]): dengan penugasan yang banyak,
      // daftar ID sepanjang itu melebihi batas panjang URL PostgREST dan
      // gagal dengan "Bad Request" (sempat terjadi saat pengujian). Filter
      // status pun ikut lewat !inner ini, bukan lewat daftar ID, dengan
      // alasan yang sama.
      query = supabaseAdmin
        .from("kandidat")
        .select(SELECT_FIELDS_INNER, { count: "exact" })
        .eq("hasil_wawancara.pewawancara_id", pw.id);
      if (wantStatusFilter) {
        query = query.eq("hasil_wawancara.is_draft", status === "sudah" ? false : true);
      }
    } else if (mode === "hari_ini") {
      // Kandidat yang sudah ditugaskan (ke siapa pun) tapi belum selesai —
      // supaya pewawancara yang jatahnya sudah tuntas bisa bantu sisa yang ada.
      // !inner wajib supaya filter ini benar-benar membatasi baris kandidat,
      // bukan cuma menyaring isi array hasil_wawancara yang ter-embed.
      // Mode ini sudah selalu "belum diwawancarai" by definisi, jadi filter
      // status di sini tidak relevan/diabaikan.
      query = supabaseAdmin
        .from("kandidat")
        .select(SELECT_FIELDS_INNER, { count: "exact" })
        .eq("hasil_wawancara.is_draft", true)
        .not("hasil_wawancara.pewawancara_id", "is", null);
    } else if (wantStatusFilter) {
      // Semua + filter status: pakai !inner supaya is_draft membatasi baris
      // kandidat itu sendiri. Konsekuensinya kandidat yang belum pernah
      // ditugaskan (belum punya baris hasil_wawancara) tidak ikut ke "belum".
      query = supabaseAdmin
        .from("kandidat")
        .select(SELECT_FIELDS_INNER, { count: "exact" })
        .eq("hasil_wawancara.is_draft", status === "sudah" ? false : true);
    } else {
      // Semua: seluruh kandidat, tanpa filter status.
      query = supabaseAdmin.from("kandidat").select(SELECT_FIELDS, { count: "exact" });
    }

    query = query.order("no", { ascending: true }).range(from, to);
    if (search) {
      query = query.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%`,
      );
    }

    // Filter jalur masuk — kolomnya langsung di tabel kandidat, jadi aman
    // dipakai di mode manapun tanpa perlu !inner.
    if (jalur) {
      const jalurValues = resolveJalurAliases([jalur]);
      if (jalurValues.length > 0) query = query.in("jalur_masuk", jalurValues);
    }

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    const data = ((rawData ?? []) as unknown as KandidatRow[]).map(toListItem);

    // Daftar jalur masuk yang ditangani pewawancara ini — dipakai untuk
    // opsi filter jalur (1 pewawancara bisa dapat kandidat dari >1 jalur).
    const { data: jalurRows } = await supabaseAdmin
      .from("kandidat")
      .select("jalur_masuk, hasil_wawancara!inner(pewawancara_id)")
      .eq("hasil_wawancara.pewawancara_id", pw.id);

    const jalurKeysAssigned = new Set<JalurKey>();
    for (const row of (jalurRows ?? []) as unknown as { jalur_masuk: string | null }[]) {
      const key = jalurKeyFromValue(row.jalur_masuk);
      if (key) jalurKeysAssigned.add(key);
    }
    const jalurList = Array.from(jalurKeysAssigned).map((key) => ({ key, label: JALUR_LABELS[key] }));

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
      jalur_list: jalurList,
    });
  } catch (err) {
    console.error("[GET /api/pewawancara/mahasiswa]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
