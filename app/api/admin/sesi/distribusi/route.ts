import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sesi_id } = body;

    if (!sesi_id) {
      return NextResponse.json({ error: "sesi_id wajib diisi" }, { status: 400 });
    }

    // 1. Ambil data sesi
    const { data: sesi, error: sesiErr } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, distribusi_done")
      .eq("id", sesi_id)
      .single();

    if (sesiErr || !sesi) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    if (sesi.distribusi_done) {
      return NextResponse.json({ error: "Distribusi sudah pernah dilakukan untuk sesi ini" }, { status: 409 });
    }

    // 2. Ambil semua kuota pewawancara yang terisi, urut by kuota_ke
    const { data: kuotaList, error: kuotaErr } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("kuota_ke, pewawancara_id")
      .eq("sesi_id", sesi_id)
      .order("kuota_ke", { ascending: true });

    if (kuotaErr) throw kuotaErr;
    if (!kuotaList || kuotaList.length === 0) {
      return NextResponse.json({ error: "Belum ada pewawancara yang mengisi kuota" }, { status: 400 });
    }

    // 3. Cari kandidat_id yang SUDAH di-assign di tabel hasil_wawancara
    const { data: assignedData } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("kandidat_id")
      .not("pewawancara_id", "is", null);

    const assignedIds = assignedData?.map((a) => a.kandidat_id) || [];

    // 4. Cari Kandidat yang BELUM di-assign
    let queryKandidat = supabaseAdmin
      .from("kandidat")
      .select("id, no, nama")
      .order("no", { ascending: true });

    // HANYA filter IN jika array tidak kosong untuk menghindari error syntax Supabase
    if (assignedIds.length > 0) {
      queryKandidat = queryKandidat.not("id", "in", `(${assignedIds.join(",")})`);
    }

    // Batasi sesuai kuota mahasiswa
    const { data: kandidats, error: kandErr } = await queryKandidat.limit(sesi.kuota_mahasiswa);

    if (kandErr) throw kandErr;
    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json({ error: "Tidak ada kandidat yang belum ditugaskan" }, { status: 400 });
    }

    // 5. Proses Distribusi Round-Robin (Bagi rata satu-satu)
    const assignments: {
      kandidat_id: number;
      pewawancara_id: number;
      sesi_id: number;
      is_draft: boolean;
      created_at: string;
      updated_at: string;
    }[] = [];

    // Bagi rata mahasiswa ke pewawancara yang ada (Misal Mhs 1 ke P1, Mhs 2 ke P2, Mhs 21 ke P1)
    kandidats.forEach((mhs, index) => {
      // Modulo untuk memutar index pewawancara (0, 1, 2... kembali ke 0)
      const pewawancaraIndex = index % kuotaList.length; 
      const kuotaTujuan = kuotaList[pewawancaraIndex];

      assignments.push({
        kandidat_id: mhs.id,
        pewawancara_id: kuotaTujuan.pewawancara_id,
        sesi_id: sesi.id,
        is_draft: true, // Masih draft (menunggu pewawancara)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    if (assignments.length === 0) {
      return NextResponse.json({ error: "Gagal membuat daftar tugas" }, { status: 400 });
    }

    // 6. Bulk UPSERT ke tabel hasil_wawancara
    const { error: upsertErr } = await supabaseAdmin
      .from("hasil_wawancara")
      .upsert(assignments, { onConflict: "kandidat_id" });

    if (upsertErr) {
      console.error("[distribusi] hasil_wawancara upsert:", upsertErr);
      throw upsertErr;
    }

    // 7. Update total_assigned untuk setiap pewawancara
    const countByPw: Record<number, number> = {};
    for (const a of assignments) {
      countByPw[a.pewawancara_id] = (countByPw[a.pewawancara_id] ?? 0) + 1;
    }
    
    for (const [pwId, count] of Object.entries(countByPw)) {
      const { data: pw } = await supabaseAdmin
        .from("pewawancara")
        .select("total_assigned")
        .eq("id", Number(pwId))
        .single();
        
      if (pw) {
        await supabaseAdmin
          .from("pewawancara")
          .update({ total_assigned: (pw.total_assigned ?? 0) + count })
          .eq("id", Number(pwId));
      }
    }

    // 8. Tandai distribusi selesai
    await supabaseAdmin
      .from("sesi_wawancara")
      .update({ distribusi_done: true })
      .eq("id", sesi_id);

    return NextResponse.json({
      success: true,
      total_assigned: assignments.length,
      pewawancara_count: kuotaList.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/sesi/distribusi]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat distribusi.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
