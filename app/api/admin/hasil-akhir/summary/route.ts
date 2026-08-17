import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { JALUR_KEYS, JALUR_DB_ALIASES, JALUR_LABELS, type JalurKey } from "@/lib/jalur";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// "Diusulkan" adalah kandidat yang direkomendasikan (lolos) — sama seperti /export
const LOLOS_VALUES = ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"];

function keyForJalurValue(value: string): JalurKey | null {
  const normalized = value.trim().toLowerCase();
  for (const key of JALUR_KEYS) {
    if (JALUR_DB_ALIASES[key].some((alias) => alias.toLowerCase() === normalized)) {
      return key;
    }
  }
  return null;
}

// GET — jumlah kandidat lolos (& total) per jalur masuk untuk satu tahun seleksi.
// Dipakai untuk badge angka di pemilih jalur, kartu "Penerima per Jalur", dan
// statistik Lolos/Belum Lolos — supaya angka-angka itu nyata, bukan ilustratif.
export async function GET(req: NextRequest) {
  try {
    const tahunParam = req.nextUrl.searchParams.get("tahun");
    if (!tahunParam || isNaN(Number(tahunParam))) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("kandidat")
      .select(`
        jalur_masuk,
        hasil_wawancara!inner ( hasil_akhir ),
        impor_data!inner ( tahun_seleksi )
      `)
      .eq("impor_data.tahun_seleksi", Number(tahunParam));

    if (error) throw error;

    const counts = Object.fromEntries(
      JALUR_KEYS.map((key) => [key, { lolos: 0, total: 0 }]),
    ) as Record<JalurKey, { lolos: number; total: number }>;

    for (const row of data ?? []) {
      const key = keyForJalurValue(row.jalur_masuk ?? "");
      if (!key) continue;

      const wawancaraArr = row.hasil_wawancara as unknown;
      const statusAkhir = Array.isArray(wawancaraArr)
        ? (wawancaraArr[0] as { hasil_akhir?: string } | undefined)?.hasil_akhir
        : (wawancaraArr as { hasil_akhir?: string } | undefined)?.hasil_akhir;
      const isLolos = LOLOS_VALUES.includes(statusAkhir ?? "");

      counts[key].total += 1;
      if (isLolos) counts[key].lolos += 1;
    }

    const perJalur = JALUR_KEYS.map((key) => ({
      key,
      label: JALUR_LABELS[key],
      lolos: counts[key].lolos,
      total: counts[key].total,
    }));

    const totalLolos = perJalur.reduce((sum, j) => sum + j.lolos, 0);
    const totalBelumLolos = perJalur.reduce((sum, j) => sum + (j.total - j.lolos), 0);

    return NextResponse.json({ perJalur, totalLolos, totalBelumLolos });
  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/summary]", err);
    return NextResponse.json(
      { error: "Gagal mengambil ringkasan", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
