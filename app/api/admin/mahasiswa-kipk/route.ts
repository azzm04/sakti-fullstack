import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";
import type { MahasiswaKipk } from "@/types/wawancara";

type ProdiRow = NonNullable<NonNullable<MahasiswaKipk["penerima_kipk"]>["prodi"]>;

interface PenerimaKipkRow {
  id: string;
  nim: string | null;
  nama: string | null;
  angkatan: number | null;
  prodi: ProdiRow | ProdiRow[] | null;
}

interface MahasiswaRow {
  id: string;
  email_sso: string;
  status_akun: string;
  created_at: string;
  penerima_kipk: PenerimaKipkRow | PenerimaKipkRow[] | null;
}

// GET — list semua akun MAHASISWA_KIPK (join ke penerima_kipk untuk nama/nim/prodi).
// Read-only listing — akun mahasiswa dibuat lewat alur verifikasi OTP mandiri,
// bukan lewat panel admin, jadi endpoint ini sengaja tidak punya POST.
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";

    const query = supabaseAdmin
      .from("users")
      .select(
        `
        id,
        email_sso,
        status_akun,
        created_at,
        penerima_kipk (
          id,
          nim,
          nama,
          angkatan,
          prodi:prodi_id ( id, nama_prodi, fakultas )
        )
      `,
        { count: "exact" },
      )
      .eq("role", "MAHASISWA_KIPK")
      .order("created_at", { ascending: false });

    const { data, count, error } = await query;
    if (error) throw error;

    // penerima_kipk (dan prodi di dalamnya) adalah relasi ke-satu — PostgREST
    // kadang membungkusnya sebagai array, jadi diratakan di sini sama seperti
    // pola di /api/admin/evaluasi untuk relasi hasil_wawancara.
    const one = <T,>(v: T | T[] | null | undefined): T | null =>
      Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

    const normalized: MahasiswaKipk[] = (data ?? []).map((row) => {
      const raw = row as unknown as MahasiswaRow;
      const pk = one(raw.penerima_kipk);
      return {
        id: raw.id,
        email_sso: raw.email_sso,
        status_akun: raw.status_akun,
        created_at: raw.created_at,
        penerima_kipk: pk ? { ...pk, prodi: one(pk.prodi) } : null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      const filtered = normalized.filter((m) => {
        const pk = m.penerima_kipk;
        return (
          m.email_sso.toLowerCase().includes(q) ||
          pk?.nama?.toLowerCase().includes(q) ||
          pk?.nim?.toLowerCase().includes(q)
        );
      });
      return NextResponse.json({ data: filtered, total: filtered.length });
    }

    return NextResponse.json({ data: normalized, total: count ?? 0 });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
