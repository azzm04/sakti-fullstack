import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";


const CRITERIA_POINTS = [0.30, 0.20, 0.15, 0.15, 0.20];
const CRITERIA_TYPES  = ["cost", "benefit", "benefit", "benefit", "benefit"] as const;

function kondisiRumahScore(kondisi: string | null): number {
  if (!kondisi) return 1;
  return kondisi.toLowerCase().includes("tidak") ? 2 : 1;
}

function hasilAkhirScore(hasil: number | null): number {
  // 1=Layak → 3 poin (paling butuh), 2=Dipertimbangkan → 2, 3=Tidak Layak → 1
  if (hasil === 1) return 3;
  if (hasil === 2) return 2;
  return 1;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiUrl, kuota } = body;

    if (!apiUrl) {
      return NextResponse.json({ error: "URL API wajib diisi" }, { status: 400 });
    }

    // 1. Ambil kandidat yang sudah selesai wawancara
    const { data: kandidats, error } = await supabaseAdmin
      .from("kandidat")
      .select(
        "id, no, nama, prodi, no_pendaftaran_kipk, jalur_masuk, " +
        "penghasilan_ayah, penghasilan_ibu, penghasilan_lain, " +
        "jml_tanggungan_sebenarnya, jumlah_tanggungan, " +
        "jarak_pusat_kota, kondisi_rumah, hasil_akhir"
      )
      .not("hasil_akhir", "is", null)
      .not("pewawancara", "is", null)
      .neq("pewawancara", "")
      .order("no", { ascending: true });

    if (error) throw error;
    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json(
        { error: "Belum ada kandidat yang selesai diwawancara" },
        { status: 400 }
      );
    }

    // 2. Transform ke format TopsisRequest
    type KRow = {
      id: number; no: number; nama: string; prodi: string;
      no_pendaftaran_kipk: string; jalur_masuk: string;
      penghasilan_ayah: number; penghasilan_ibu: number; penghasilan_lain: number;
      jml_tanggungan_sebenarnya: number; jumlah_tanggungan: number;
      jarak_pusat_kota: number; kondisi_rumah: string; hasil_akhir: number | null;
    };
    const rows = kandidats as unknown as KRow[];

    const alternatives = rows.map((k) => k.nama ?? `Kandidat-${k.no}`);

    const matrix = rows.map((k) => {
      const penghasilan = (k.penghasilan_ayah ?? 0) + (k.penghasilan_ibu ?? 0) + (k.penghasilan_lain ?? 0);
      const tanggungan  = k.jml_tanggungan_sebenarnya > 0 ? k.jml_tanggungan_sebenarnya : (k.jumlah_tanggungan ?? 0);
      const jarak       = k.jarak_pusat_kota ?? 0;
      const kondisi     = kondisiRumahScore(k.kondisi_rumah);
      const hasil       = hasilAkhirScore(k.hasil_akhir);
      return [penghasilan, tanggungan, jarak, kondisi, hasil];
    });

    // 3. Kirim ke FastAPI
    const topsisRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alternatives,
        matrix,
        criteria_points: CRITERIA_POINTS,
        criteria_types:  CRITERIA_TYPES,
      }),
    });

    if (!topsisRes.ok) {
      const errText = await topsisRes.text().catch(() => "");
      return NextResponse.json(
        { error: `API error ${topsisRes.status}: ${errText}` },
        { status: topsisRes.status }
      );
    }

    // 4. Response: [{ rank, alternative, closeness_score }, ...]
    const ranked: { rank: number; alternative: string; closeness_score: number }[] = await topsisRes.json();

    // 5. Map balik ke data kandidat
    const nameToKandidat = Object.fromEntries(rows.map((k) => [k.nama, k]));

    const hasil = ranked.map((r) => {
      const k = nameToKandidat[r.alternative];
      return {
        id:                  k?.id,
        no:                  k?.no,
        no_pendaftaran_kipk: k?.no_pendaftaran_kipk ?? "",
        nama:                r.alternative,
        prodi:               k?.prodi ?? "",
        jalur_masuk:         k?.jalur_masuk ?? "",
        skor_total:          r.closeness_score,
        ranking:             r.rank,
        // Tentukan lolos berdasarkan kuota per jalur
        lolos:               false, // akan dihitung di bawah
      };
    });

    // 6. Tentukan lolos berdasarkan kuota per jalur
    const kuotaMap: Record<string, number> = kuota ?? {};
    const countPerJalur: Record<string, number> = {};

    // Sort by rank untuk assign lolos
    const sorted = [...hasil].sort((a, b) => a.ranking - b.ranking);
    for (const item of sorted) {
      const jalur = item.jalur_masuk || "SNBP";
      const max   = kuotaMap[jalur] ?? 0;
      countPerJalur[jalur] = (countPerJalur[jalur] ?? 0);
      if (countPerJalur[jalur] < max) {
        item.lolos = true;
        countPerJalur[jalur]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: hasil,
      total: hasil.length,
      kandidat_count: kandidats.length,
    });
  } catch (err) {
    console.error("[POST /api/admin/kalkulasi/topsis]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menghubungi API SMART-TOPSIS" },
      { status: 500 }
    );
  }
}
