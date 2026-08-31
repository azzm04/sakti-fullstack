import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { JALUR_KEYS, JALUR_LABELS, jalurKeyFromValue, type JalurKey } from "@/lib/jalur";
import { isLolosAkhir, isDitetapkanSk } from "@/lib/kelulusan";

interface RawRow {
  jalur_masuk: string | null;
  hasil_akhir: string | null;
  status_final: string | null;
  status_sk: string | null;
}

// GET — jumlah kandidat lolos (& total) per jalur masuk untuk satu tahun seleksi.
// Dipakai untuk badge angka di pemilih jalur, kartu "Penerima per Jalur", dan
// statistik Lolos/Belum Lolos — supaya angka-angka itu nyata, bukan ilustratif.
//
// Diagregasi lewat SQL (GROUP BY), bukan fetch semua baris lalu dihitung di
// JS — versi sebelumnya fetch tanpa .range() kena default row cap Supabase
// (1000 baris), jadi jalur mana pun yang baris kandidatnya "kalah urutan"
// dari jalur lain bisa senyap hilang dari hasil tanpa error sama sekali.
// Query di sini juga pakai LEFT JOIN LATERAL untuk ambil SATU hasil_wawancara
// paling baru per kandidat (bukan JOIN biasa yang bisa gandakan baris kalau
// suatu kandidat punya lebih dari satu catatan wawancara).
//
// "Lolos" dihitung per baris via isLolosAkhir() (bukan SQL FILTER murni)
// karena definisinya beda per jalur: SNBT/SNBP cukup hasil_akhir="Diusulkan",
// sedangkan UM/SBUB juga harus lolos tahap Filtering Kuota (status_final).
export async function GET(req: NextRequest) {
  try {
    const tahunParam = req.nextUrl.searchParams.get("tahun");
    const tahun = Number(tahunParam);
    if (!tahunParam || Number.isNaN(tahun)) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<RawRow[]>`
      SELECT
        k.jalur_masuk,
        k.status_sk,
        hw.hasil_akhir,
        hw.status_final
      FROM kandidat k
      JOIN impor_data id ON id.id = k.impor_data_id
      LEFT JOIN LATERAL (
        SELECT hasil_akhir, status_final
        FROM hasil_wawancara h
        WHERE h.kandidat_id = k.id
        ORDER BY h.updated_at DESC
        LIMIT 1
      ) hw ON true
      WHERE id.tahun_seleksi = ${tahun}
    `;

    const counts = Object.fromEntries(
      JALUR_KEYS.map((key) => [key, { lolos: 0, total: 0, ditetapkanSk: 0, belumDiprosesSk: 0 }]),
    ) as Record<JalurKey, { lolos: number; total: number; ditetapkanSk: number; belumDiprosesSk: number }>;

    for (const row of rows) {
      const key = jalurKeyFromValue(row.jalur_masuk);
      if (!key) continue;
      counts[key].total += 1;
      if (isLolosAkhir(row.jalur_masuk, row.hasil_akhir, row.status_final)) {
        counts[key].lolos += 1;
        // Dari yang "Diusulkan" ini, mana yang SUDAH resmi ditetapkan lewat
        // Penetapan SK Massal, vs yang belum diproses sama sekali — supaya
        // tab Kirim Email tidak menampilkan angka "Lolos" yang menyesatkan
        // (Diusulkan != otomatis dapat email "LOLOS", harus lewat status_sk dulu).
        if (isDitetapkanSk(row.status_sk)) {
          counts[key].ditetapkanSk += 1;
        } else if (!row.status_sk) {
          counts[key].belumDiprosesSk += 1;
        }
      }
    }

    const perJalur = JALUR_KEYS.map((key) => ({
      key,
      label: JALUR_LABELS[key],
      lolos: counts[key].lolos,
      total: counts[key].total,
      ditetapkanSk: counts[key].ditetapkanSk,
      belumDiprosesSk: counts[key].belumDiprosesSk,
    }));

    const totalLolos = perJalur.reduce((sum, j) => sum + j.lolos, 0);
    const totalBelumLolos = perJalur.reduce((sum, j) => sum + (j.total - j.lolos), 0);
    const totalDitetapkanSk = perJalur.reduce((sum, j) => sum + j.ditetapkanSk, 0);
    const totalBelumDiprosesSk = perJalur.reduce((sum, j) => sum + j.belumDiprosesSk, 0);

    return NextResponse.json({
      perJalur,
      totalLolos,
      totalBelumLolos,
      totalDitetapkanSk,
      totalBelumDiprosesSk,
    });
  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/summary]", err);
    return NextResponse.json(
      { error: "Gagal mengambil ringkasan", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
