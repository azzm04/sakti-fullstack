import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

// GET — list semua pewawancara (join ke users untuk nama & email)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    const query = supabaseAdmin
      .from("pewawancara")
      .select(`
        id,
        admin_id,
        nama,
        user_id,
        total_assigned,
        total_completed,
        created_at,
        updated_at,
        users (
          id,
          email_sso,
          status_akun
        )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      // Search via users — filter di sisi aplikasi karena join
      // Supabase tidak support ilike pada relasi langsung di count query
      const { data, count, error } = await query;
      if (error) throw error;

      const filtered = (data ?? []).filter((p: any) =>
        p.nama?.toLowerCase().includes(search.toLowerCase()) ||
        p.users?.email_sso?.toLowerCase().includes(search.toLowerCase())
      );

      return NextResponse.json({ data: filtered, total: filtered.length });
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// POST — tambah pewawancara baru
// Flow: insert users → insert pewawancara (dengan user_id yang didapat)
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { email, nama } = body;

    if (!email || !nama) {
      return NextResponse.json({ error: "Email dan nama wajib diisi" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cek apakah email sudah terdaftar di users
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email_sso", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar di sistem" },
        { status: 409 },
      );
    }

    // 1. Insert ke users terlebih dahulu
    const { data: newUser, error: userErr } = await supabaseAdmin
      .from("users")
      .insert({
        email_sso:  normalizedEmail,
        role:       "PEWAWANCARA",
        status_akun: "AKTIF",
      })
      .select("id")
      .single();

    if (userErr) {
      console.error("[POST /api/admin/pewawancara] insert users:", userErr);
      throw userErr;
    }

    // 2. Insert ke pewawancara dengan user_id yang didapat
    const { data: newPewawancara, error: pwErr } = await supabaseAdmin
      .from("pewawancara")
      .insert({
        nama: nama,  // kolom nama ada di pewawancara juga
        user_id:  newUser.id,
        admin_id: admin.id,
      })
      .select()
      .single();

    if (pwErr) {
      console.error("[POST /api/admin/pewawancara] insert pewawancara:", pwErr);
      // Rollback: hapus user yang baru dibuat agar tidak orphan
      await supabaseAdmin.from("users").delete().eq("id", newUser.id);
      throw pwErr;
    }

    return NextResponse.json({ success: true, data: newPewawancara }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pewawancara] unexpected:", err);
    return NextResponse.json(
      { error: "Gagal menambah pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}