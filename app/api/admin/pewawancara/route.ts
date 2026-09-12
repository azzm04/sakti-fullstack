import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";
import { assignPewawancaraRole } from "@/lib/pewawancara";

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
          status_akun,
          user_roles ( role )
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

    const result = await assignPewawancaraRole({ email, nama, adminId: admin.id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.pewawancara }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pewawancara] unexpected:", err);
    return NextResponse.json(
      { error: "Gagal menambah pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}