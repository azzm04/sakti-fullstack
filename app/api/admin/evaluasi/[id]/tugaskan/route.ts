import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

/**
 * Tugaskan (atau pindahkan) pewawancara untuk satu kandidat. Penugasan hidup
 * di hasil_wawancara.pewawancara_id (kandidat tidak punya kolom ini) — kalau
 * kandidat ini belum pernah punya baris hasil_wawancara sama sekali, baris
 * baru dibuat di sini dengan is_draft = true (menunggu wawancara diisi).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const pewawancaraId: string | undefined = body.pewawancara_id;

    if (!pewawancaraId) {
      return NextResponse.json({ error: "pewawancara_id wajib diisi" }, { status: 400 });
    }

    const { data: pewawancara, error: pwErr } = await supabaseAdmin
      .from("pewawancara")
      .select("id, nama, is_active, total_assigned")
      .eq("id", pewawancaraId)
      .single();

    if (pwErr || !pewawancara) {
      return NextResponse.json({ error: "Pewawancara tidak ditemukan" }, { status: 404 });
    }
    if (!pewawancara.is_active) {
      return NextResponse.json({ error: "Pewawancara ini sudah tidak aktif" }, { status: 400 });
    }

    const { data: kandidat, error: kErr } = await supabaseAdmin
      .from("kandidat")
      .select("id, nama_pendaftar")
      .eq("id", id)
      .single();

    if (kErr || !kandidat) {
      return NextResponse.json({ error: "Kandidat tidak ditemukan" }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id, pewawancara_id")
      .eq("kandidat_id", id)
      .maybeSingle();

    if (existing && existing.pewawancara_id === pewawancaraId) {
      return NextResponse.json({ success: true, data: { hasil_wawancara_id: existing.id, pewawancara } });
    }

    let hasilWawancaraId: string;

    if (existing) {
      const previousPewawancaraId = existing.pewawancara_id as string | null;

      const { error: updateErr } = await supabaseAdmin
        .from("hasil_wawancara")
        .update({ pewawancara_id: pewawancaraId, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (updateErr) throw updateErr;

      hasilWawancaraId = existing.id;

      if (previousPewawancaraId && previousPewawancaraId !== pewawancaraId) {
        const { data: prevPw } = await supabaseAdmin
          .from("pewawancara")
          .select("total_assigned")
          .eq("id", previousPewawancaraId)
          .maybeSingle();
        if (prevPw) {
          await supabaseAdmin
            .from("pewawancara")
            .update({ total_assigned: Math.max(0, (prevPw.total_assigned ?? 1) - 1) })
            .eq("id", previousPewawancaraId);
        }
      }
    } else {
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("hasil_wawancara")
        .insert({ kandidat_id: id, pewawancara_id: pewawancaraId, is_draft: true })
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      hasilWawancaraId = inserted.id;
    }

    await supabaseAdmin
      .from("pewawancara")
      .update({ total_assigned: (pewawancara.total_assigned ?? 0) + 1 })
      .eq("id", pewawancaraId);

    try {
      let aktor = "Sistem";
      const admin = await getCurrentUser();
      if (admin?.nama) aktor = admin.nama;

      await supabaseAdmin.from("kandidat_riwayat").insert({
        kandidat_id: id,
        tipe: "penugasan",
        deskripsi: `Ditugaskan ke pewawancara: ${pewawancara.nama}`,
        aktor,
      });
    } catch (riwayatErr) {
      console.error(`[POST /api/admin/evaluasi/${id}/tugaskan] gagal mencatat riwayat:`, riwayatErr);
    }

    return NextResponse.json({ success: true, data: { hasil_wawancara_id: hasilWawancaraId, pewawancara } });
  } catch (err) {
    console.error(`[POST /api/admin/evaluasi/${id}/tugaskan]`, err);
    return NextResponse.json(
      { error: "Gagal menugaskan pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
