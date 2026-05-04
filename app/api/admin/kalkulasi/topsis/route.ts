import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Kriteria SMART-TOPSIS:
// 1. penghasilan_total  → cost   (makin kecil makin baik)
// 2. tanggungan         → benefit (makin banyak makin butuh)
// 3. jarak_pusat_kota   → benefit (makin jauh makin terpencil)
// 4. kondisi_rumah      → benefit (skor 1=baik, 2=kurang baik)
// 5. hasil_akhir        → benefit (1=Layak→3pts, 2=Dipertimbangkan→2pts, 3=TidakLayak→1pt)
const CRITERIA_POINTS: number[] = [0.30, 0.20, 0.15, 0.15, 0.20];
const CRITERIA_TYPES: string[]  = ["cost", "benefit", "benefit", "benefit", "benefit"];

function kondisiRumahScore(kondisi: string | null): number {
  if (!kondisi) return 1;
  const lower = kondisi.toLowerCase();
  // "tidak layak" / "rusak" / "buruk" → 2 (lebih butuh bantuan)
  if (lower.includes("tidak") || lower.includes("rusak") || lower.includes("buruk")) return 2;
  return 1;
}

function hasilAkhirScore(hasil: number | null): number {
  // 1=Layak → 3 poin, 2=Dipertimbangkan → 2, 3=Tidak Layak → 1
  if (hasil === 1) return 3;
  if (hasil === 2) return 2;
  return 1;
}

type KandidatRow = {
  id: number;
  no: number;
  nama: string;
  prodi: string;
  no_pendaftaran_kipk: string;
  jalur_masuk: string | null;
  penghasilan_ayah: number | null;
  penghasilan_ibu: number | null;
  penghasilan_lain: number | null;
  jml_tanggungan_sebenarnya: number | null;
  jumlah_tanggungan: number | null;
  jarak_pusat_kota: number | null;
  kondisi_rumah: string | null;
  hasil_akhir: number | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jalur_masuk, kuota } = body as {
      jalur_masuk: string;
      kuota: number;
    };

    // Validasi input
    if (!jalur_masuk) {
      return NextResponse.json({ error: "jalur_masuk wajib diisi" }, { status: 400 });
    }
    if (!kuota || kuota <= 0) {
      return NextResponse.json({ error: "kuota harus > 0" }, { status: 400 });
    }

    // URL FastAPI dari environment variable
    const apiUrl = process.env.NEXT_PUBLIC_TOPSIS_API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_TOPSIS_API_URL tidak dikonfigurasi di server" },
        { status: 500 }
      );
    }

    // 1. Ambil kandidat berdasarkan jalur_masuk yang sudah selesai wawancara
    const { data: rawKandidats, error } = await supabaseAdmin
      .from("kandidat")
      .select(
        "id, no, nama, prodi, no_pendaftaran_kipk, jalur_masuk, " +
        "penghasilan_ayah, penghasilan_ibu, penghasilan_lain, " +
        "jml_tanggungan_sebenarnya, jumlah_tanggungan, " +
        "jarak_pusat_kota, kondisi_rumah, hasil_akhir"
      )
      .eq("jalur_masuk", jalur_masuk)
      .not("hasil_akhir", "is", null)
      .order("no", { ascending: true });

    if (error) throw error;

    if (!rawKandidats || rawKandidats.length === 0) {
      return NextResponse.json(
        { error: `Belum ada kandidat jalur ${jalur_masuk} yang selesai diwawancara` },
        { status: 400 }
      );
    }

    const kandidats = rawKandidats as unknown as KandidatRow[];

    // 2. Transform ke format yang diharapkan FastAPI
    const alternatives: string[] = kandidats.map((k) => k.nama ?? `Kandidat-${k.no}`);

    const matrix: number[][] = kandidats.map((k) => {
      const penghasilan =
        (k.penghasilan_ayah ?? 0) +
        (k.penghasilan_ibu ?? 0) +
        (k.penghasilan_lain ?? 0);
      const tanggungan =
        (k.jml_tanggungan_sebenarnya ?? 0) > 0
          ? (k.jml_tanggungan_sebenarnya ?? 0)
          : (k.jumlah_tanggungan ?? 0);
      const jarak   = k.jarak_pusat_kota ?? 0;
      const kondisi = kondisiRumahScore(k.kondisi_rumah);
      const hasil   = hasilAkhirScore(k.hasil_akhir);

      return [penghasilan, tanggungan, jarak, kondisi, hasil];
    });

    console.log(
      `[TOPSIS] Mengirim ${kandidats.length} kandidat jalur ${jalur_masuk} ke ${apiUrl}`
    );

    // 3. Kirim ke FastAPI SMART-TOPSIS
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
      console.error(`[TOPSIS] Error dari API: ${topsisRes.status} ${errText}`);
      return NextResponse.json(
        { error: `API error ${topsisRes.status}: ${errText}` },
        { status: topsisRes.status }
      );
    }

    // 4. Response: [{ rank, alternative, closeness_score }, ...]
    const ranked: { rank: number; alternative: string; closeness_score: number }[] =
      await topsisRes.json();

    if (!Array.isArray(ranked) || ranked.length === 0) {
      return NextResponse.json(
        { error: "Response dari SMART-TOPSIS tidak valid atau kosong" },
        { status: 400 }
      );
    }

    // 5. Map balik ke data kandidat berdasarkan nama
    const nameToKandidat = Object.fromEntries(
      kandidats.map((k) => [k.nama ?? `Kandidat-${k.no}`, k])
    );

    const hasil = ranked.map((r) => {
      const k = nameToKandidat[r.alternative];
      return {
        id:                  k?.id,
        no:                  k?.no,
        no_pendaftaran_kipk: k?.no_pendaftaran_kipk ?? "",
        nama:                r.alternative,
        prodi:               k?.prodi ?? "",
        jalur_masuk:         k?.jalur_masuk ?? jalur_masuk,
        skor_total:          r.closeness_score,
        ranking:             r.rank,
        lolos:               r.rank <= kuota,
      };
    });

    // 6. Update DB: skor_total, ranking, status_seleksi
    for (const item of hasil) {
      if (!item.id) continue;
      const statusSeleksi = item.lolos ? "LOLOS" : "TIDAK LOLOS";

      const { error: updateError } = await supabaseAdmin
        .from("kandidat")
        .update({
          skor_total:     item.skor_total,
          ranking:        item.ranking,
          status_seleksi: statusSeleksi,
          updated_at:     new Date().toISOString(),
        })
        .eq("id", item.id);

      if (updateError) {
        console.error(`[TOPSIS] Error update ID ${item.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success:        true,
      jalur_masuk,
      kuota,
      data:           hasil,
      total:          hasil.length,
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
