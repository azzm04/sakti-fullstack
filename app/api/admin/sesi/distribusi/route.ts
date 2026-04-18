import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST — distribusikan mahasiswa ke pewawancara berdasarkan slot
// Pewawancara slot_ke=N mendapat mahasiswa urutan N, N+20, N+40, N+60, N+80, N+100
// (step = kuota_pewawancara, default 20)
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

    // 2. Ambil semua slot yang sudah terisi, urut by slot_ke
    const { data: slots, error: slotErr } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("slot_ke, pewawancara_id")
      .eq("sesi_id", sesi_id)
      .order("slot_ke", { ascending: true });

    if (slotErr) throw slotErr;
    if (!slots || slots.length === 0) {
      return NextResponse.json({ error: "Belum ada pewawancara yang mengisi slot" }, { status: 400 });
    }

    const step = sesi.kuota_pewawancara; // 20

    // 3. Ambil kandidat yang belum punya assignment, urut by no (urutan pendaftaran)
    const { data: kandidats, error: kandErr } = await supabaseAdmin
      .from("kandidat")
      .select("id, no, nama")
      .is("pewawancara_id", null)
      .order("no", { ascending: true })
      .limit(sesi.kuota_mahasiswa);

    if (kandErr) throw kandErr;
    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json({ error: "Tidak ada kandidat yang belum ditugaskan" }, { status: 400 });
    }

    // 4. Distribusi: slot_ke=N → kandidat index N-1, N-1+step, N-1+2*step, ...
    // Contoh step=20, slot_ke=1 → index 0,20,40,60,80,100
    //                  slot_ke=2 → index 1,21,41,61,81,101
    const assignments: {
      kandidat_id: number;
      pewawancara_id: number;
      scheduled_at: string;
      status: string;
    }[] = [];

    const scheduledAt = `${sesi.tanggal}T07:00:00.000Z`;

    for (const slot of slots) {
      const startIdx = slot.slot_ke - 1; // slot_ke=1 → index 0
      for (let i = startIdx; i < kandidats.length; i += step) {
        assignments.push({
          kandidat_id: kandidats[i].id,
          pewawancara_id: slot.pewawancara_id,
          scheduled_at: scheduledAt,
          status: "pending",
        });
      }
    }

    if (assignments.length === 0) {
      return NextResponse.json({ error: "Tidak ada assignment yang bisa dibuat" }, { status: 400 });
    }

    // 5. Bulk insert ke wawancara_assignment
    const { error: insertErr } = await supabaseAdmin
      .from("wawancara_assignment")
      .insert(assignments);

    if (insertErr) {
      console.error("[distribusi] wawancara_assignment insert:", insertErr);
      throw insertErr;
    }

    // 6. Update status_wawancara & pewawancara_id di tabel kandidat
    for (const a of assignments) {
      const { error: updErr } = await supabaseAdmin
        .from("kandidat")
        .update({
          status_wawancara: "scheduled",
          pewawancara_id: a.pewawancara_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", a.kandidat_id);
      if (updErr) console.error("[distribusi] kandidat update:", updErr);
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
      pewawancara_count: slots.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/sesi/distribusi]", err);
    return NextResponse.json(
      { error: "Gagal distribusi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
