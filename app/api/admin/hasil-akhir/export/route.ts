import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveJalurAliases } from "@/lib/jalur";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// "Diusulkan" adalah kandidat yang direkomendasikan (lolos)
const LOLOS_VALUES = ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jalurParam = searchParams.get("jalur") ?? "";
    const tahunParam = searchParams.get("tahun"); 
    
    const jalurKeys  = jalurParam.split(",").map((k) => k.trim()).filter(Boolean);

    if (jalurKeys.length === 0) {
      return NextResponse.json({ error: "Parameter jalur wajib diisi" }, { status: 400 });
    }
    
    if (!tahunParam || isNaN(Number(tahunParam))) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }

    const jalurValues = Array.from(new Set(resolveJalurAliases(jalurKeys)));

    if (jalurValues.length === 0) {
      return NextResponse.json({ error: "Jalur tidak dikenali" }, { status: 400 });
    }

    // 2. ── QUERY KE DATABASE (Sesuai Skema Anda) ──
    const { data, error } = await supabase
      .from("kandidat")
      .select(`
        no,
        nama_pendaftar,
        nisn,
        prodi_pendaftar,
        jalur_masuk,
        hasil_wawancara!inner (
          hasil_akhir
        ),
        impor_data!inner (
          tahun_seleksi
        )
      `)
      .in("jalur_masuk", jalurValues)
      .eq("impor_data.tahun_seleksi", Number(tahunParam)) // 👈 Filter berdasarkan tahun_seleksi di impor_data
      .order("prodi_pendaftar", { ascending: true })
      .order("nama_pendaftar",  { ascending: true });

    if (error) throw error;

    // 3. ── MAPPING DATA KE FRONTEND ──
    const rows = (data ?? []).map((row, i) => {
      const wawancaraArr = row.hasil_wawancara as any;
      const statusAkhir = Array.isArray(wawancaraArr) 
        ? wawancaraArr[0]?.hasil_akhir 
        : wawancaraArr?.hasil_akhir;
      const isLolos = LOLOS_VALUES.includes(statusAkhir);

      return {
        no:           i + 1,
        nama:         row.nama_pendaftar ?? "",
        nisn:          row.nisn ?? "",
        prodi:        row.prodi_pendaftar ?? "",
        jalur_masuk:  row.jalur_masuk ?? "",
        lolos:        isLolos 
      };
    });

    return NextResponse.json({ data: rows, total: rows.length });

  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/export]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}