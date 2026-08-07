import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    let query = supabaseAdmin
      .from("kandidat")
      .select(`
        *,
        hasil_wawancara (
          *,
          pewawancara:pewawancara_id (nama)
        )
      `, { count: "exact" })
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(`nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi_pendaftar.ilike.%${search}%`);
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

    // Hitung total data untuk statistik atas
    const { count: totalKandidat } = await supabaseAdmin.from("kandidat").select("id", { count: "exact", head: true });
    const { count: totalWawancara } = await supabaseAdmin.from("hasil_wawancara").select("id", { count: "exact", head: true });
    
    const realTotal = totalKandidat ?? 0;
    const realTotalSelesai = totalWawancara ?? 0;
    const realTotalBelum = realTotal - realTotalSelesai;

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