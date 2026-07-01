import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
// FIX: prisma tidak dipakai lagi — sso_whitelist sudah digantikan tabel users

// PATCH — update pewawancara
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, email, sso_id, is_active } = body;

    const update: Record<string, unknown> = {};
    if (nama     !== undefined) update.nama      = nama;
    if (email    !== undefined) update.email     = email.toLowerCase().trim();
    if (sso_id   !== undefined) update.sso_id    = sso_id;
    if (is_active !== undefined) update.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("pewawancara")
      .update(update)
      .eq("id", id)
      .select("*, user_id")
      .single();

    if (error) throw error;

    // FIX: sync is_active ke users.status_akun (bukan sso_whitelist)
    if (is_active !== undefined && data?.user_id) {
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update({ status_akun: is_active ? "AKTIF" : "NONAKTIF" })
        .eq("id", data.user_id);

      if (userErr) {
        console.warn("[PATCH pewawancara] Gagal sync status_akun ke users:", userErr);
        // Tidak throw — pewawancara sudah terupdate
      }
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal update", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// DELETE — hapus pewawancara + relasi terkait + nonaktifkan user terkait
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Ambil user_id sebelum hapus untuk sync ke tabel users
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("pewawancara")
      .select("user_id")
      .eq("id", id)
      .single();

    if (getErr) throw getErr;

    // Hapus relasi kuota_pewawancara terlebih dahulu
    const { error: delKuotaErr } = await supabaseAdmin
      .from("kuota_pewawancara")
      .delete()
      .eq("pewawancara_id", id);

    if (delKuotaErr) throw delKuotaErr;

    // Hapus hasil_wawancara yang referensi pewawancara ini
    const { error: delHasilErr } = await supabaseAdmin
      .from("hasil_wawancara")
      .delete()
      .eq("pewawancara_id", id);

    if (delHasilErr) throw delHasilErr;

    // Hapus dari pewawancara
    const { error: deleteErr } = await supabaseAdmin
      .from("pewawancara")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    // FIX: nonaktifkan user terkait di tabel users (bukan sso_whitelist)
    // Tidak dihapus agar history login tetap ada
    if (existing?.user_id) {
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update({ status_akun: "NONAKTIF" })
        .eq("id", existing.user_id);

      if (userErr) {
        console.warn("[DELETE pewawancara] Gagal nonaktifkan users:", userErr);
        // Tidak throw — pewawancara sudah berhasil dihapus
      }
    }

    return NextResponse.json({ success: true, message: "Pewawancara berhasil dihapus" });
  } catch (err) {
    console.error("[DELETE pewawancara] Error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}