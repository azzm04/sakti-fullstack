import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JALUR_MAP: Record<string, string[]> = {
  SNBP_ELIGIBLE:     ["SNBP", "SNBP Eligible", "SNBP_ELIGIBLE"], 
  SNBP_NON_ELIGIBLE: ["SNBP non-eligible", "SNBP Non-Eligible"],
  SNBT_ELIGIBLE:     ["SNBT", "SNBT Eligible", "SNBT_ELIGIBLE"],
  SNBT_NON_ELIGIBLE: ["SNBT non-eligible", "SNBT Non-Eligible"],
  UM:                ["UM", "Ujian Mandiri"],
  SBUB:              ["SBUB"],
};

const LOLOS_VALUES = ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jalurParam = searchParams.get("jalur") ?? "";
    const jalurKeys  = jalurParam.split(",").map((k) => k.trim()).filter(Boolean);

    if (jalurKeys.length === 0) {
      return NextResponse.json({ error: "Parameter jalur wajib diisi" }, { status: 400 });
    }

    const jalurValues = Array.from(
      new Set(jalurKeys.flatMap((k) => JALUR_MAP[k] ?? []))
    );

    const { data, error } = await supabase
      .from("kandidat")
      .select(`
        nama_pendaftar,
        email,
        prodi_pendaftar,
        jalur_masuk,
        hasil_wawancara!inner (
          hasil_akhir
        )
      `)
      .in("jalur_masuk", jalurValues)
      // .in("hasil_wawancara.hasil_akhir", LOLOS_VALUES) 
      .not("email", "is", null)
      .neq("email", "")
      .order("nama_pendaftar", { ascending: true });

    if (error) throw error;

    const rows = (data ?? []).map((row) => {
      // Sama seperti di fungsi kirim, kita ekstrak hasil wawancaranya
      const wawancaraArr = row.hasil_wawancara as any;
      const statusAkhir = Array.isArray(wawancaraArr) ? wawancaraArr[0]?.hasil_akhir : wawancaraArr?.hasil_akhir;
      const isLolos = LOLOS_VALUES.includes(statusAkhir);

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