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

    // 2. Ambil semua pewawancara yang sudah klaim slot di sesi ini, urut by slot_ke
    const { data: slotList, error: slotErr } = await supabaseAdmin
      .from("slot_sesi")
      .select("slot_ke, pewawancara_id")
      .eq("sesi_id", sesi_id)
      .order("slot_ke", { ascending: true });

    if (slotErr) throw slotErr;
    if (!slotList || slotList.length === 0) {
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
      .select("id, no, nama_pendaftar")
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
    const assignments: { kandidat_id: string; pewawancara_id: string }[] = kandidats.map((mhs, index) => {
      // Modulo untuk memutar index pewawancara (0, 1, 2... kembali ke 0)
      const slotTujuan = slotList[index % slotList.length];
      return { kandidat_id: mhs.id, pewawancara_id: slotTujuan.pewawancara_id };
    });

    if (assignments.length === 0) {
      return NextResponse.json({ error: "Gagal membuat daftar tugas" }, { status: 400 });
    }

    // 6. hasil_wawancara.kandidat_id tidak punya unique constraint di database, jadi
    //    tidak bisa upsert dengan onConflict -- cek per kandidat dulu, lalu UPDATE kalau
    //    barisnya sudah ada (mis. dibuat manual lewat endpoint tugaskan) atau INSERT kalau
    //    belum, mengikuti pola yang sama dengan app/api/admin/evaluasi/[id]/tugaskan.
    const kandidatIds = assignments.map((a) => a.kandidat_id);
    const { data: existingRows, error: existingErr } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id, kandidat_id")
      .in("kandidat_id", kandidatIds);

    if (existingErr) throw existingErr;

    const existingByKandidat = new Map((existingRows ?? []).map((r) => [r.kandidat_id, r.id]));

    const toInsert = assignments
      .filter((a) => !existingByKandidat.has(a.kandidat_id))
      .map((a) => ({ kandidat_id: a.kandidat_id, pewawancara_id: a.pewawancara_id, is_draft: true }));

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabaseAdmin.from("hasil_wawancara").insert(toInsert);
      if (insertErr) throw insertErr;
    }

    for (const a of assignments) {
      const existingId = existingByKandidat.get(a.kandidat_id);
      if (!existingId) continue;
      const { error: updateErr } = await supabaseAdmin
        .from("hasil_wawancara")
        .update({ pewawancara_id: a.pewawancara_id, updated_at: new Date().toISOString() })
        .eq("id", existingId);
      if (updateErr) throw updateErr;
    }

    // 7. Update total_assigned untuk setiap pewawancara
    const countByPw: Record<string, number> = {};
    for (const a of assignments) {
      countByPw[a.pewawancara_id] = (countByPw[a.pewawancara_id] ?? 0) + 1;
    }

    for (const [pwId, count] of Object.entries(countByPw)) {
      const { data: pw } = await supabaseAdmin
        .from("pewawancara")
        .select("total_assigned")
        .eq("id", pwId)
        .single();

      if (pw) {
        await supabaseAdmin
          .from("pewawancara")
          .update({ total_assigned: (pw.total_assigned ?? 0) + count })
          .eq("id", pwId);
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
      pewawancara_count: slotList.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/sesi/distribusi]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat distribusi.", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
