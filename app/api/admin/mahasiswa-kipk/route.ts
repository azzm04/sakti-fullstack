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
  user_roles: { role: string }[] | null;
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

    // Sengaja TANPA user_roles!inner + .eq di query — filter embedded resource
    // PostgREST juga MEMOTONG array yang dikembalikan ke baris yang match saja,
    // jadi role lain (mis. PEWAWANCARA) yang dibutuhkan untuk badge "Juga: ..."
    // ikut hilang. Ambil semua role per user, filter keanggotaan MAHASISWA_KIPK
    // di sisi aplikasi — sama seperti pola search di bawah.
    const { data, error } = await supabaseAdmin.from("users").select(
      `
        id,
        email_sso,
        status_akun,
        created_at,
        user_roles ( role ),
        penerima_kipk (
          id,
          nim,
          nama,
          angkatan,
          prodi:prodi_id ( id, nama_prodi, fakultas )
        )
      `,
    ).order("created_at", { ascending: false });

    if (error) throw error;

    // penerima_kipk (dan prodi di dalamnya) adalah relasi ke-satu — PostgREST
    // kadang membungkusnya sebagai array, jadi diratakan di sini sama seperti
    // pola di /api/admin/evaluasi untuk relasi hasil_wawancara.
    const one = <T,>(v: T | T[] | null | undefined): T | null =>
      Array.isArray(v) ? (v[0] ?? null) : (v ?? null);

    const normalized: MahasiswaKipk[] = ((data ?? []) as unknown as MahasiswaRow[])
      .filter((raw) => (raw.user_roles ?? []).some((r) => r.role === "MAHASISWA_KIPK"))
      .map((raw) => {
        const pk = one(raw.penerima_kipk);
        return {
          id: raw.id,
          email_sso: raw.email_sso,
          status_akun: raw.status_akun,
          created_at: raw.created_at,
          roles: (raw.user_roles ?? []).map((r) => r.role),
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

    return NextResponse.json({ data: normalized, total: normalized.length });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
