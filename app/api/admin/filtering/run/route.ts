import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth-server";
import { FILTERING_JALUR_KEYS, JALUR_LABELS, type JalurKey } from "@/lib/jalur";
import { rankDenganKuota } from "@/lib/ranking";
import { ambilKandidatUntukRanking } from "@/lib/filtering-data";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST — jalankan (atau jalankan ulang) Filtering Kuota untuk satu tahun+jalur.
// Menimpa status_final/ranking_kuota sebelumnya (re-run diperbolehkan, tidak
// menyimpan histori per-run — lihat plan "Filtering Kuota").
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const tahun = Number(body.tahun);
    const jalur = body.jalur as JalurKey;
    const kuota = Number(body.kuota);

    if (!Number.isFinite(tahun)) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }
    if (!jalur || !FILTERING_JALUR_KEYS.includes(jalur)) {
      return NextResponse.json(
        { error: "Parameter jalur harus salah satu dari: " + FILTERING_JALUR_KEYS.join(", ") },
        { status: 400 },
      );
    }
    if (!Number.isFinite(kuota) || kuota < 0) {
      return NextResponse.json({ error: "Kuota harus berupa angka >= 0" }, { status: 400 });
    }

    const kandidatList = await ambilKandidatUntukRanking(tahun, jalur);
    const ranked = rankDenganKuota(kandidatList, kuota);

    const aktor = admin.nama || "Admin Dirmawa";
    const berubah: { kandidat_id: string; deskripsi: string }[] = [];

    const CHUNK = 25;
    for (let i = 0; i < ranked.length; i += CHUNK) {
      const chunk = ranked.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map(async ({ rank, statusFinal, kandidat }) => {
          const { error } = await supabase
            .from("hasil_wawancara")
            .update({ status_final: statusFinal, ranking_kuota: rank })
            .eq("id", kandidat.hasil_wawancara_id);

          if (error) throw error;

          if (kandidat.status_final_saat_ini !== statusFinal) {
            berubah.push({
              kandidat_id: kandidat.id,
              deskripsi: `Filtering Kuota ${JALUR_LABELS[jalur]}: peringkat #${rank}, status → ${statusFinal}`,
            });
          }
        }),
      );
    }

    if (berubah.length > 0) {
      await supabase.from("kandidat_riwayat").insert(
        berubah.map((b) => ({
          kandidat_id: b.kandidat_id,
          tipe: "filtering_kuota",
          deskripsi: b.deskripsi,
          aktor,
        })),
      );
    }

    const totalLolos = ranked.filter((r) => r.statusFinal === "Lolos Kuota").length;

    return NextResponse.json({
      success: true,
      totalDiproses: ranked.length,
      totalLolos,
      totalTidakLolos: ranked.length - totalLolos,
    });
  } catch (err) {
    console.error("[POST /api/admin/filtering/run]", err);
    return NextResponse.json(
      { error: "Gagal menjalankan filtering", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
