import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";

// GET — list semua pewawancara
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    let query = supabaseAdmin
      .from("pewawancara")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST — tambah pewawancara baru
// Menyimpan ke tabel `pewawancara` (Supabase) DAN `sso_whitelist` (Prisma)
// agar pewawancara bisa login via OTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nama } = body;

    if (!email || !nama) {
      return NextResponse.json({ error: "Email dan nama wajib diisi" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Generate SSO ID unik: PWC-XXXX
    let sso_id: string;
    let attempts = 0;
    while (true) {
      const rand = Math.floor(1000 + Math.random() * 9000); // 4 digit
      sso_id = `PWC-${rand}`;
      const { data: existing } = await supabaseAdmin
        .from("pewawancara")
        .select("id")
        .eq("sso_id", sso_id)
        .maybeSingle();
      if (!existing) break; // unik, keluar loop
      if (++attempts > 20) {
        return NextResponse.json({ error: "Gagal generate SSO ID unik, coba lagi" }, { status: 500 });
      }
    }

    // 1. Insert ke tabel pewawancara (Supabase)
    const { data, error } = await supabaseAdmin
      .from("pewawancara")
      .insert({ email: normalizedEmail, nama, sso_id })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/admin/pewawancara] supabase insert:", error);
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email sudah terdaftar sebagai pewawancara" }, { status: 409 });
      }
      throw error;
    }

    // 2. Upsert ke sso_whitelist dengan role PEWAWANCARA agar bisa login OTP
    try {
      await prisma.ssoWhitelist.upsert({
        where: { email: normalizedEmail },
        create: { email: normalizedEmail, nama, role: "PEWAWANCARA", isActive: true },
        update: { nama, role: "PEWAWANCARA", isActive: true },
      });
    } catch (prismaErr) {
      console.error("[POST /api/admin/pewawancara] prisma upsert:", prismaErr);
      // Jangan gagalkan seluruh request — pewawancara sudah tersimpan di Supabase
      // Whitelist bisa di-sync manual nanti
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/pewawancara] unexpected:", err);
    return NextResponse.json(
      { error: "Gagal menambah pewawancara", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
