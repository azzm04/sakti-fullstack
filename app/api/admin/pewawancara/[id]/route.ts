import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
// FIX: prisma tidak dipakai lagi — sso_whitelist sudah digantikan tabel users

// PATCH — update pewawancara
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, email, is_active } = body;

    // Update kolom yang ada di tabel pewawancara
    const pwUpdate: Record<string, unknown> = {};
    if (nama      !== undefined) pwUpdate.nama      = nama;
    if (is_active !== undefined) pwUpdate.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("pewawancara")
      .update(pwUpdate)
      .eq("id", id)
      .select("*, user_id")
      .single();

    if (error) throw error;

    // Sync ke tabel users jika ada perubahan
    if (data?.user_id) {
      const usersUpdate: Record<string, unknown> = {};
      if (is_active !== undefined) {
        usersUpdate.status_akun = is_active ? "AKTIF" : "NONAKTIF";
      }
      // Email disimpan di users.email_sso, bukan di pewawancara
      if (email !== undefined) {
        usersUpdate.email_sso = email.toLowerCase().trim();
      }

      if (Object.keys(usersUpdate).length > 0) {
        const { error: userErr } = await supabaseAdmin
          .from("users")
          .update(usersUpdate)
          .eq("id", data.user_id);

        if (userErr) {
          console.warn("[PATCH pewawancara] Gagal sync ke users:", userErr);
        }
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

// DELETE — hapus pewawancara + nonaktifkan user terkait
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Ambil user_id + bigint numeric id sebelum hapus
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("pewawancara")
      .select("user_id, id")
      .eq("id", id)
      .single();

    if (getErr) throw getErr;

    // Hapus pewawancara (CASCADE akan handle relasi di DB jika ada)
    const { error: deleteErr } = await supabaseAdmin
      .from("pewawancara")
      .delete()
      .eq("id", id);

    if (deleteErr) throw deleteErr;

    // Nonaktifkan user terkait agar tidak bisa login lagi
    if (existing?.user_id) {
      const { error: userErr } = await supabaseAdmin
        .from("users")
        .update({ status_akun: "NONAKTIF" })
        .eq("id", existing.user_id);

      if (userErr) {
        console.warn("[DELETE pewawancara] Gagal nonaktifkan users:", userErr);
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