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
    const sesiIdParam = searchParams.get("sesi_id"); // Opsional: pilih sesi tertentu
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    const tanggalHariIni = new Date().toISOString().split("T")[0];

    // Tentukan sesi target: dari param atau sesi hari ini
    let sesiTarget: { id: number; tanggal: string } | null = null;

    if (sesiIdParam) {
      // Pewawancara memilih sesi tertentu
      const { data: sesiPilihan } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa")
        .eq("id", Number(sesiIdParam))
        .single();
      sesiTarget = sesiPilihan;
    } else {
      // Default: sesi hari ini
      const { data: sesiHariIni } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa")
        .eq("tanggal", tanggalHariIni)
        .maybeSingle();
      sesiTarget = sesiHariIni;
    }

    const sesiIdTarget = sesiTarget?.id ?? null;
    // Apakah sesi ini sudah boleh diisi (tanggal <= hari ini)
    const canEdit = sesiTarget ? sesiTarget.tanggal <= tanggalHariIni : false;

    // Ambil daftar sesi yang pewawancara ini ikuti (untuk sesi selector di frontend)
    const { data: kuotaSayaData } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("sesi_id, sesi_wawancara(id, tanggal, distribusi_done)")
      .eq("pewawancara_id", pw.id)
      .order("sesi_id", { ascending: true });

    const sesiListSaya = (kuotaSayaData ?? [])
      .filter((k: any) => {
        const sesi = Array.isArray(k.sesi_wawancara) ? k.sesi_wawancara[0] : k.sesi_wawancara;
        return sesi?.distribusi_done === true;
      })
      .map((k: any) => {
        const sesi = Array.isArray(k.sesi_wawancara) ? k.sesi_wawancara[0] : k.sesi_wawancara;
        return { id: sesi.id, tanggal: sesi.tanggal };
      });

    // ── Hitung progress jatah (berdasarkan sesi_id target) ──
    let jatahTotalHariIni = 0;
    let jatahSelesaiHariIni = 0;

    if (sesiIdTarget) {
      const { count: totalHariIni } = await supabaseAdmin
        .from("hasil_wawancara")
        .select("id", { count: "exact", head: true })
        .eq("pewawancara_id", pw.id)
        .eq("sesi_id", sesiIdTarget);

      const { count: selesaiHariIni } = await supabaseAdmin
        .from("hasil_wawancara")
        .select("id", { count: "exact", head: true })
        .eq("pewawancara_id", pw.id)
        .eq("sesi_id", sesiIdTarget)
        .eq("is_draft", false);

      jatahTotalHariIni = totalHariIni ?? 0;
      jatahSelesaiHariIni = selesaiHariIni ?? 0;
    } else {
      // Tidak ada sesi target → fallback: semua jatah pewawancara
      const { count: totalAll } = await supabaseAdmin
        .from("hasil_wawancara")
        .select("id", { count: "exact", head: true })
        .eq("pewawancara_id", pw.id);

      const { count: selesaiAll } = await supabaseAdmin
        .from("hasil_wawancara")
        .select("id", { count: "exact", head: true })
        .eq("pewawancara_id", pw.id)
        .eq("is_draft", false);

      jatahTotalHariIni = totalAll ?? 0;
      jatahSelesaiHariIni = selesaiAll ?? 0;
    }

    const jatahSudahSelesai = jatahTotalHariIni > 0 && jatahSelesaiHariIni >= jatahTotalHariIni;

    // Mode hari_ini hanya boleh jika jatah hari ini sudah selesai
    if (mode === "hari_ini" && !jatahSudahSelesai) {
      return NextResponse.json({
        error: "Selesaikan semua wawancara jatahmu hari ini terlebih dahulu",
        locked: true,
        jatah_selesai: jatahSelesaiHariIni,
        jatah_total:   jatahTotalHariIni,
      }, { status: 403 });
    }

    // ── Bangun query berdasarkan mode ────────────────────────────────────────
    let kandidatIds: number[] = [];

    if (mode === "saya") {
      // Jatah Saya: kandidat yang di-assign ke pewawancara ini untuk sesi target
      let hwQuery = supabaseAdmin
        .from("hasil_wawancara")
        .select("kandidat_id")
        .eq("pewawancara_id", pw.id);

      if (sesiIdTarget) {
        hwQuery = hwQuery.eq("sesi_id", sesiIdTarget);
      }

      const { data: hwData } = await hwQuery;
      kandidatIds = (hwData ?? []).map((a) => a.kandidat_id);

    } else if (mode === "hari_ini") {
      // Hari Ini: semua kandidat yang dijadwalkan untuk sesi target (dari semua pewawancara)
      if (sesiIdTarget) {
        const { data: hwData } = await supabaseAdmin
          .from("hasil_wawancara")
          .select("kandidat_id")
          .eq("sesi_id", sesiIdTarget);

        kandidatIds = (hwData ?? []).map((a) => a.kandidat_id);
      }
      // Jika tidak ada sesi hari ini, tampilkan kosong

    } else {
      // Semua: seluruh kandidat (semua pendaftar KIP-K)
      const selectFields = `id, no, no_pendaftaran_kipk, nama, prodi, hasil_wawancara(rekomendasi, is_draft, pewawancara_id, pewawancara:pewawancara_id(nama))`;

      let query = supabaseAdmin
        .from("kandidat")
        .select(selectFields, { count: "exact" })
        .order("no", { ascending: true })
        .range(from, to);

      if (search) {
        query = query.or(`nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%`);
      }

      const { data: rawData, count, error } = await query;
      if (error) throw error;

      const data = (rawData ?? []).map((row: any) => {
        const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
        const pewawancaraData = hw?.pewawancara
          ? (Array.isArray(hw.pewawancara) ? hw.pewawancara[0] : hw.pewawancara)
          : null;

        return {
          id:                  String(row.id),
          no:                  row.no,
          no_pendaftaran_kipk: row.no_pendaftaran_kipk,
          nama:                row.nama,
          prodi:               row.prodi,
          pewawancara_id:      hw?.pewawancara_id ?? null,
          pewawancara:         pewawancaraData?.nama ?? null,
          rekomendasi:         hw?.rekomendasi ?? null,
          is_draft:            hw?.is_draft ?? null,
        };
      });

      return NextResponse.json({
        data,
        total:               count ?? 0,
        page,
        totalPages:          Math.ceil((count ?? 0) / limit),
        jatah_selesai:       jatahSelesaiHariIni,
        jatah_total:         jatahTotalHariIni,
        jatah_sudah_selesai: jatahSudahSelesai,
        can_edit:            canEdit,
        sesi_list:           sesiListSaya,
        sesi_id_aktif:       sesiIdTarget,
      });
    }

    // Untuk mode "saya" dan "hari_ini"
    if (!kandidatIds.length) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        totalPages: 0,
        jatah_selesai: jatahSelesaiHariIni,
        jatah_total:   jatahTotalHariIni,
        jatah_sudah_selesai: jatahSudahSelesai,
        can_edit:      canEdit,
        sesi_list:     sesiListSaya,
        sesi_id_aktif: sesiIdTarget,
      });
    }

    // Ambil data kandidat dengan join hasil_wawancara
    const selectFields = `id, no, no_pendaftaran_kipk, nama, prodi, hasil_wawancara(rekomendasi, is_draft, pewawancara_id, pewawancara:pewawancara_id(nama))`;

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

    const data = (rawData ?? []).map((row: any) => {
      const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
      const pewawancaraData = hw?.pewawancara
        ? (Array.isArray(hw.pewawancara) ? hw.pewawancara[0] : hw.pewawancara)
        : null;

      return {
        id:                  String(row.id),
        no:                  row.no,
        no_pendaftaran_kipk: row.no_pendaftaran_kipk,
        nama:                row.nama,
        prodi:               row.prodi,
        pewawancara_id:      hw?.pewawancara_id ?? null,
        pewawancara:         pewawancaraData?.nama ?? null,
        rekomendasi:         hw?.rekomendasi ?? null,
        is_draft:            hw?.is_draft ?? true,
      };
    });

    return NextResponse.json({
      data,
      total:               count ?? 0,
      page,
      totalPages:          Math.ceil((count ?? 0) / limit),
      jatah_selesai:       jatahSelesaiHariIni,
      jatah_total:         jatahTotalHariIni,
      jatah_sudah_selesai: jatahSudahSelesai,
      can_edit:            canEdit,
      sesi_list:           sesiListSaya,
      sesi_id_aktif:       sesiIdTarget,
    });

  } catch (err) {
    console.error("[GET /api/pewawancara/mahasiswa]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
