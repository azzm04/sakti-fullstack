import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

// GET — daftar semua program studi (lookup), dipakai dropdown Prodi di
// form edit Mahasiswa KIP-K. Tabel `prodi` statis (diisi lewat seed),
// tidak ada create/update/delete dari sini.
export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("prodi")
      .select("id, nama_prodi, fakultas, prodi")
      .order("nama_prodi", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data prodi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
