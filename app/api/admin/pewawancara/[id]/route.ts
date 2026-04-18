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

// DELETE — hapus pewawancara + nonaktifkan di sso_whitelist
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Ambil email dulu sebelum hapus
    const { data: existing } = await supabaseAdmin
      .from("pewawancara")
      .select("email")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin.from("pewawancara").delete().eq("id", id);
    if (error) throw error;

    // Nonaktifkan di sso_whitelist (tidak dihapus agar history tetap ada)
    if (existing?.email) {
      await prisma.ssoWhitelist.updateMany({
        where: { email: existing.email, role: "PEWAWANCARA" },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
