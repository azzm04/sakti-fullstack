import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveJalurAliases } from "@/lib/jalur";
import { isDitetapkanSk } from "@/lib/kelulusan";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jalurParam = searchParams.get("jalur") ?? "";
    const jalurKeys  = jalurParam.split(",").map((k) => k.trim()).filter(Boolean);

    if (jalurKeys.length === 0) {
      return NextResponse.json({ error: "Parameter jalur wajib diisi" }, { status: 400 });
    }

    const jalurValues = Array.from(new Set(resolveJalurAliases(jalurKeys)));

    const { data, error } = await supabase
      .from("kandidat")
      .select(`
        nama_pendaftar,
        email,
        prodi_pendaftar,
        jalur_masuk,
        status_sk
      `)
      .in("jalur_masuk", jalurValues)
      .not("email", "is", null)
      .neq("email", "")
      .order("nama_pendaftar", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []).map((row) => {
      // "Lolos" ditentukan dari status_sk (hasil Penetapan SK Massal) —
      // status resmi pasca SK, bukan lagi rekomendasi wawancara internal.
      const isLolos = isDitetapkanSk(row.status_sk);

      return {
        nama:  row.nama_pendaftar ?? "",
        email: row.email ?? "",
        prodi: row.prodi_pendaftar ?? "",
        lolos: isLolos
      };
    });

    return NextResponse.json({ data: rows, total: rows.length });

  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/preview-email]", err);
    return NextResponse.json(
      { error: "Gagal memuat preview", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}