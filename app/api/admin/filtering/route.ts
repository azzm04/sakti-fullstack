import { NextRequest, NextResponse } from "next/server";
import { FILTERING_JALUR_KEYS, type JalurKey } from "@/lib/jalur";
import { ambilKandidatUntukRanking } from "@/lib/filtering-data";
import { rankDenganKuota } from "@/lib/ranking";

// GET — preview ranking untuk tahun+jalur, opsional kuota untuk pratinjau
// status lolos/tidak sebelum admin benar-benar menekan "Jalankan Filtering".
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunParam = searchParams.get("tahun");
    const jalurParam = searchParams.get("jalur") as JalurKey | null;
    const kuotaParam = searchParams.get("kuota");

    const tahun = Number(tahunParam);
    if (!tahunParam || Number.isNaN(tahun)) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }
    if (!jalurParam || !FILTERING_JALUR_KEYS.includes(jalurParam)) {
      return NextResponse.json(
        { error: "Parameter jalur harus salah satu dari: " + FILTERING_JALUR_KEYS.join(", ") },
        { status: 400 },
      );
    }

    const kandidatList = await ambilKandidatUntukRanking(tahun, jalurParam);
    const kuota = kuotaParam ? Number(kuotaParam) : kandidatList.length;
    const ranked = rankDenganKuota(kandidatList, Number.isFinite(kuota) ? kuota : kandidatList.length);

    const data = ranked.map(({ rank, statusFinal, kandidat }) => ({
      rank,
      statusFinalPreview: statusFinal,
      id: kandidat.id,
      nama_pendaftar: kandidat.nama_pendaftar,
      no_pendaftaran_kipk: kandidat.no_pendaftaran_kipk,
      prodi_pendaftar: kandidat.prodi_pendaftar,
      golongan_ukt: kandidat.golongan_ukt,
      kondisi_orang_tua: kandidat.kondisi_orang_tua,
      pendapatan_per_kapita:
        kandidat.jumlah_tanggungan > 0
          ? Math.round(kandidat.penghasilan_total / kandidat.jumlah_tanggungan)
          : kandidat.penghasilan_total,
      status_final_saat_ini: kandidat.status_final_saat_ini,
      ranking_kuota_saat_ini: kandidat.ranking_kuota_saat_ini,
    }));

    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    console.error("[GET /api/admin/filtering]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
