import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/admin/monev/submissions?schedule_id=xxx&page=1&limit=50&search=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("schedule_id");
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const search = searchParams.get("search")?.trim() || "";

    if (!scheduleId) {
      return NextResponse.json(
        { error: "Parameter schedule_id wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil semua penerima KIP-K beserta prodi
    let allMahasiswaQuery = supabaseAdmin
      .from("penerima_kipk")
      .select("user_id, nim, nama, prodi:prodi_id(nama_prodi, fakultas)", { count: "exact" });

    if (search) {
      allMahasiswaQuery = allMahasiswaQuery.or(`nim.ilike.%${search}%,nama.ilike.%${search}%`);
    }

    const { data: allMahasiswa, error: mhsErr } = await allMahasiswaQuery;
    if (mhsErr) throw mhsErr;

    // Ambil semua submission untuk periode ini
    const { data: submissions, error: subErr } = await supabaseAdmin
      .from("pengisian_monev")
      .select("*")
      .eq("periode_monev_id", scheduleId);

    if (subErr) throw subErr;

    const submissionMap = new Map<string, typeof submissions[0]>();
    for (const sub of submissions ?? []) {
      submissionMap.set(sub.user_id, sub);
    }

    // Gabungkan data mahasiswa + submission
    const BATAS_KIPK = 750000;

    interface MergedRow {
      id: string;
      user_id: string;
      nim: string;
      nama: string;
      prodi: string;
      pekerjaan_ayah: string;
      penghasilan_ayah: number;
      url_bukti_ayah: { kerja: string | null; gaji: string | null };
      pekerjaan_ibu: string;
      penghasilan_ibu: number;
      url_bukti_ibu: { kerja: string | null; gaji: string | null };
      penghasilan_lain: number;
      url_bukti_lain: string | null;
      jumlah_tanggungan: number;
      url_scan_kk: string | null;
      status_pengisian: "Sudah" | "Belum";
      total_pendapatan: number;
      rupiah_per_tanggungan: number;
      hasil_deteksi_yolo: number | null;
      waktu_lapor: string | null;
    }

    const mergedData: MergedRow[] = (allMahasiswa ?? []).map((mhs) => {
      const sub = mhs.user_id ? submissionMap.get(mhs.user_id) : null;
      const prodiData = mhs.prodi as unknown as { nama_prodi: string; fakultas: string } | null;

      if (sub) {
        const pengAyah = Number(sub.penghasilan_ayah ?? 0);
        const pengIbu = Number(sub.penghasilan_ibu ?? 0);
        const pengLain = Number(sub.penghasilan_lain ?? 0);
        const totalPendapatan = pengAyah + pengIbu + pengLain;
        const tanggungan = sub.jumlah_tanggungan ?? 1;
        const rpPerTanggungan = tanggungan > 0 ? totalPendapatan / tanggungan : 0;

        return {
          id: String(sub.id),
          user_id: mhs.user_id ?? "",
          nim: mhs.nim,
          nama: mhs.nama,
          prodi: prodiData?.nama_prodi ?? "-",
          pekerjaan_ayah: sub.pekerjaan_ayah ?? "-",
          penghasilan_ayah: pengAyah,
          url_bukti_ayah: {
            kerja: sub.path_bukti_pekerjaan_ayah ?? null,
            gaji: sub.path_bukti_penghasilan_ayah ?? null,
          },
          pekerjaan_ibu: sub.pekerjaan_ibu ?? "-",
          penghasilan_ibu: pengIbu,
          url_bukti_ibu: {
            kerja: sub.path_bukti_pekerjaan_ibu ?? null,
            gaji: sub.path_bukti_penghasilan_ibu ?? null,
          },
          penghasilan_lain: pengLain,
          url_bukti_lain: sub.path_bukti_penghasilan_lain ?? null,
          jumlah_tanggungan: tanggungan,
          url_scan_kk: sub.path_scan_kk ?? null,
          status_pengisian: "Sudah" as const,
          total_pendapatan: totalPendapatan,
          rupiah_per_tanggungan: rpPerTanggungan,
          hasil_deteksi_yolo: sub.hasil_deteksi_yolo ?? null,
          hasil_scan_ai: sub.hasil_scan_ai ?? null,
          status_anomali: sub.status_anomali ?? false,
          waktu_lapor: sub.waktu_lapor ?? null,
        };
      } else {
        return {
          id: mhs.user_id ?? `no-sub-${mhs.nim}`,
          user_id: mhs.user_id ?? "",
          nim: mhs.nim,
          nama: mhs.nama,
          prodi: prodiData?.nama_prodi ?? "-",
          pekerjaan_ayah: "-",
          penghasilan_ayah: 0,
          url_bukti_ayah: { kerja: null, gaji: null },
          pekerjaan_ibu: "-",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: null, gaji: null },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 0,
          url_scan_kk: null,
          status_pengisian: "Belum" as const,
          total_pendapatan: 0,
          rupiah_per_tanggungan: 0,
          hasil_deteksi_yolo: null,
          hasil_scan_ai: null,
          status_anomali: false,
          waktu_lapor: null,
        };
      }
    });

    // Hitung statistik
    let sudah = 0;
    let belum = 0;
    let melebihi = 0;
    let tidakSesuai = 0;

    for (const row of mergedData) {
      if (row.status_pengisian === "Belum") {
        belum++;
      } else {
        sudah++;
        if (row.rupiah_per_tanggungan > BATAS_KIPK) melebihi++;
        if (
          row.hasil_deteksi_yolo !== null &&
          row.hasil_deteksi_yolo !== 0 &&
          row.hasil_deteksi_yolo !== row.jumlah_tanggungan
        ) {
          tidakSesuai++;
        }
      }
    }

    // Pagination
    const total = mergedData.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const paginatedData = mergedData.slice(startIdx, startIdx + limit);

    return NextResponse.json({
      data: paginatedData,
      stats: { total, sudah, belum, melebihi, tidakSesuai },
      pagination: { page, limit, totalPages, totalRows: total },
    });
  } catch (err) {
    console.error("[GET /api/admin/monev/submissions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil data" },
      { status: 500 }
    );
  }
}
