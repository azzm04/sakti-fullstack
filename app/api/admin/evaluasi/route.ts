import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limitParam = parseInt(searchParams.get("limit") ?? "50");
    const limit  = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    const tahun = searchParams.get("tahun") ?? "";
    const jalurMasuk = searchParams.get("jalur_masuk") ?? "";

    if (!tahun || !jalurMasuk) {
      return NextResponse.json(
        { error: "Parameter tahun dan jalur_masuk wajib diisi" },
        { status: 400 },
      );
    }

    const tahunSeleksi = parseInt(tahun);
    if (Number.isNaN(tahunSeleksi)) {
      return NextResponse.json(
        { error: "Parameter tahun tidak valid" },
        { status: 400 },
      );
    }

    const selectClause = `
      *,
      impor_data!inner (
        tahun_seleksi
      ),
      hasil_wawancara (
        *,
        pewawancara:pewawancara_id (nama)
      )
    `;

    let query = supabaseAdmin
      .from("kandidat")
      .select(selectClause, { count: "exact" })
      .eq("impor_data.tahun_seleksi", tahunSeleksi)
      .eq("jalur_masuk", jalurMasuk)
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi_pendaftar.ilike.%${search}%`,
      );
    }

    const { data: rawData, count, error } = await query;
    if (error) throw error;

    const data = (rawData ?? []).map((row: Record<string, unknown>) => {
      const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
      const pewawancaraData = Array.isArray(hw?.pewawancara) ? hw?.pewawancara[0] : hw?.pewawancara;

      return {
        ...row,
        hasil_wawancara: undefined,
        
        // Flatten hasil_wawancara
        hasil_wawancara_id: hw?.id,
        validasi_kks: hw?.validasi_kks,
        validasi_kip: hw?.validasi_kip,
        validasi_sktm: hw?.validasi_sktm,
        sosial_media: hw?.sosial_media,
        ket_pekerjaan_ayah: hw?.ket_pekerjaan_ayah,
        ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
        ket_pekerjaan_ibu: hw?.ket_pekerjaan_ibu,
        ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
        penghasilan_lain: hw?.penghasilan_lain,
        jml_tanggungan_sebenarnya: hw?.jml_tanggungan_sebenarnya,
        validasi_orang_rumah: hw?.validasi_orang_rumah,
        kepemilikan_rumah: hw?.kepemilikan_rumah,
        tahun_perolehan: hw?.tahun_perolehan,
        luas_tanah: hw?.luas_tanah,
        luas_bangunan: hw?.luas_bangunan,
        sumber_air: hw?.sumber_air,
        mck: hw?.mck,
        aset: hw?.aset,
        kondisi_rumah: hw?.kondisi_rumah,
        jarak_pusat_kota: hw?.jarak_pusat_kota,
        rekomendasi: hw?.rekomendasi,
        alasan: hw?.alasan,
        pewawancara_id: hw?.pewawancara_id,
        is_draft: hw?.is_draft,
        interviewed_at: hw?.interviewed_at,
        
        hasil_akhir: hw?.hasil_akhir ?? null,
        pewawancara: pewawancaraData?.nama || null,
      };
    });

    let totalKandidatQuery = supabaseAdmin
      .from("kandidat")
      .select("id", { count: "exact", head: true })
      .eq("impor_data.tahun_seleksi", tahunSeleksi)
      .eq("jalur_masuk", jalurMasuk);

    if (search) {
      totalKandidatQuery = totalKandidatQuery.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi_pendaftar.ilike.%${search}%`,
      );
    }

    const { count: totalKandidat } = await totalKandidatQuery;

    const { data: statsRows } = await supabaseAdmin
      .from("kandidat")
      .select(
        `
          id,
          hasil_wawancara (
            rekomendasi,
            hasil_akhir,
            is_draft
          ),
          impor_data!inner (
            tahun_seleksi
          )
        `,
      )
      .eq("impor_data.tahun_seleksi", tahunSeleksi)
      .eq("jalur_masuk", jalurMasuk);

    const uniqueCompletedIds = new Set<string>();

    for (const row of statsRows ?? []) {
      const rowRecord = row as Record<string, unknown>;
      const kandidatId = String(rowRecord.id ?? "");
      if (!kandidatId) continue;

      const wawancaraRaw = rowRecord.hasil_wawancara;
      const wawancara = Array.isArray(wawancaraRaw)
        ? wawancaraRaw
        : wawancaraRaw
          ? [wawancaraRaw]
          : [];

      const isSelesai = wawancara.some((item) => {
        const wawancaraItem = item as Record<string, unknown>;
        return Boolean(
          wawancaraItem.rekomendasi &&
            wawancaraItem.hasil_akhir &&
            wawancaraItem.is_draft === false,
        );
      });

      if (isSelesai) {
        uniqueCompletedIds.add(kandidatId);
      }
    }

    const realTotal = totalKandidat ?? 0;
    const realTotalSelesai = uniqueCompletedIds.size;
    const realTotalBelum = Math.max(0, realTotal - realTotalSelesai);

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      totalSelesai: realTotalSelesai,
      totalBelum: realTotalBelum,
    });
  } catch (err) {
    console.error("[GET /api/admin/evaluasi]", err);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}