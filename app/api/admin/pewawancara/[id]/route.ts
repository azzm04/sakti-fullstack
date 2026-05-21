import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";

// PATCH — update pewawancara
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nama, email, sso_id, is_active } = body;

    const update: Record<string, unknown> = {};
    if (nama !== undefined) update.nama = nama;
    if (email !== undefined) update.email = email.toLowerCase().trim();
    if (sso_id !== undefined) update.sso_id = sso_id;
    if (is_active !== undefined) update.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("pewawancara")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Sync is_active ke sso_whitelist agar akses login ikut berubah
    if (is_active !== undefined && data?.email) {
      await prisma.ssoWhitelist.updateMany({
        where: { email: data.email, role: "PEWAWANCARA" },
        data: { isActive: is_active },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal update", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// DELETE — hapus pewawancara + relasi terkait + nonaktifkan di sso_whitelist
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pewawancaraId = BigInt(id);

    // Ambil email dulu sebelum hapus
    const { data: existing, error: getErr } = await supabaseAdmin
      .from("pewawancara")
      .select("email")
      .eq("id", id)
      .single();

    if (getErr) throw getErr;

    // Hapus relasi dari kuota_pewawancara terlebih dahulu
    const { error: delKuotaErr } = await supabaseAdmin
      .from("kuota_pewawancara")
      .delete()
      .eq("pewawancara_id", id);
    
    if (delKuotaErr) throw delKuotaErr;

    // Hapus data dari hasil_wawancara yang referensi pewawancara ini
    const { error: delResultErr } = await supabaseAdmin
      .from("hasil_wawancara")
      .delete()
      .eq("pewawancara_id", id);
    
    if (delResultErr) throw delResultErr;

    // Hapus dari pewawancara
    const { error: deleteErr } = await supabaseAdmin
      .from("pewawancara")
      .delete()
      .eq("id", id);
    
    if (deleteErr) throw deleteErr;

    // Nonaktifkan di sso_whitelist (tidak dihapus agar history tetap ada)
    // Tidak critical jika gagal, so wrap dalam try-catch
    if (existing?.email) {
      try {
        await prisma.ssoWhitelist.updateMany({
          where: { email: existing.email, role: "PEWAWANCARA" },
          data: { isActive: false },
        });
      } catch (prismaErr) {
        console.warn("[DELETE pewawancara] Prisma update warning:", prismaErr);
        // Jangan throw, karena pewawancara sudah berhasil dihapus
      }
    }

    return NextResponse.json({ success: true, message: "Pewawancara berhasil dihapus" });
  } catch (err) {
    console.error("[DELETE pewawancara] Error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
