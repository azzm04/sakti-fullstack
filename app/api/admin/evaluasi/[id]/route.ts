import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Gunakan bintang (*) untuk mengambil SEMUA kolom dari kandidat & hasil_wawancara
    // Join juga ke tabel pewawancara untuk mendapatkan nama
    const { data: row, error } = await supabaseAdmin
      .from("kandidat")
      .select(`
        *,
        hasil_wawancara (
          *,
          detail_ekonomi_wawancara ( * ),
          pewawancara:pewawancara_id ( id, nama )
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Data kandidat tidak ditemukan" }, { status: 404 });
      }
      throw error;
    }

    const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
    const pewawancaraData = Array.isArray(hw?.pewawancara) ? hw?.pewawancara[0] : hw?.pewawancara;
    const dew = Array.isArray(hw?.detail_ekonomi_wawancara)
      ? hw?.detail_ekonomi_wawancara[0]
      : hw?.detail_ekonomi_wawancara;

    const flattenedData = {
      ...row,
      hasil_wawancara: undefined,
      hasil_wawancara_id: hw?.id,
      sosial_media: hw?.sosial_media,
      det_pekerjaan_ayah: hw?.det_pekerjaan_ayah,
      ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
      det_pekerjaan_ibu: hw?.det_pekerjaan_ibu,
      ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
      penghasilan_lain: hw?.penghasilan_lain,
      jumlah_orang_rumah: hw?.jumlah_orang_rumah,
      validasi_orang_rumah: hw?.validasi_orang_rumah,
      kepemilikan_rumah: hw?.kepemilikan_rumah,
      kepemilikan_kendaraan: hw?.kepemilikan_kendaraan,
      kepemilikan_elektronik: hw?.kepemilikan_elektronik,
      kelayakan_rumah: hw?.kelayakan_rumah,
      rekomendasi: hw?.rekomendasi,
      alasan: hw?.alasan,
      status_wawancara: hw?.status_wawancara,
      pewawancara_id: hw?.pewawancara_id,
      is_draft: hw?.is_draft,
      interviewed_at: hw?.interviewed_at,
      hasil_akhir: hw?.hasil_akhir ?? null,
      catatan_admin: hw?.catatan_admin ?? null,
      // dari detail_ekonomi_wawancara
      luas_tanah: dew?.luas_tanah,
      luas_bangunan: dew?.luas_bangunan,
      daya_listrik: dew?.daya_listrik,
      sumber_air: dew?.sumber_air,
      mck: dew?.mck,
      jml_tanggungan_sebenarnya: dew?.jml_tanggungan_sebenarnya,
      tahun_perolehan: dew?.tahun_perolehan,
      // pewawancara
      pewawancara: pewawancaraData?.nama || null,
      pewawancara_data: pewawancaraData || null,
    };

    return NextResponse.json({ data: flattenedData });
  } catch (err) {
    console.error(`[GET /api/admin/evaluasi/${params.id}]`, err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Cek apakah hasil_wawancara sudah ada untuk kandidat ini
    const { data: existing } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id")
      .eq("kandidat_id", id)
      .single();

    const payload = {
      sosial_media:               body.sosial_media,
      det_pekerjaan_ayah:         body.det_pekerjaan_ayah,
      ket_penghasilan_ayah:       body.ket_penghasilan_ayah,
      det_pekerjaan_ibu:          body.det_pekerjaan_ibu,
      ket_penghasilan_ibu:        body.ket_penghasilan_ibu,
      penghasilan_lain:           body.penghasilan_lain,
      jumlah_orang_rumah:         body.jumlah_orang_rumah,
      validasi_orang_rumah:       body.validasi_orang_rumah,
      kepemilikan_rumah:          body.kepemilikan_rumah,
      kelayakan_rumah:            body.kelayakan_rumah,
      rekomendasi:                body.rekomendasi,
      alasan:                     body.alasan,
      is_draft:                   body.is_draft ?? false,
      interviewed_at:             new Date().toISOString(),
      updated_at:                 new Date().toISOString(),
      // Auto-set hasil_akhir untuk Layak/Tidak Layak
      // Untuk Dipertimbangkan: pakai nilai dari body (diisi admin), atau null
      hasil_akhir: (() => {
        if (body.rekomendasi === "Layak") return "Diusulkan";
        if (body.rekomendasi === "Tidak Layak") return "Tidak Diusulkan";
        // Untuk "Layak Dipertimbangkan" / "Tidak Layak Dipertimbangkan":
        // admin bisa override via body.hasil_akhir
        return body.hasil_akhir ?? null;
      })(),
      catatan_admin: body.catatan_admin ?? null,
    };

    let error;

    if (existing) {
      // Update jika sudah ada
      ({ error } = await supabaseAdmin
        .from("hasil_wawancara")
        .update(payload)
        .eq("kandidat_id", id));
    } else {
      // Insert baru jika belum ada (kandidat genap yang belum dikerjakan)
      // Cari pewawancara_id dari body, kandidat table, atau assignment
      let pewawancaraId = body.pewawancara_id;

      if (!pewawancaraId) {
        // Lookup dari kolom pewawancara_id di tabel kandidat (di-set saat assignment)
        const { data: kandidatRow } = await supabaseAdmin
          .from("kandidat")
          .select("pewawancara_id")
          .eq("id", id)
          .single();

        pewawancaraId = kandidatRow?.pewawancara_id;
      }

      if (!pewawancaraId) {
        // Lookup dari assignment
        const { data: assignment } = await supabaseAdmin
          .from("wawancara_assignment")
          .select("pewawancara_id")
          .eq("kandidat_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        pewawancaraId = assignment?.pewawancara_id;
      }

      if (!pewawancaraId) {
        return NextResponse.json(
          { error: "Data belum lengkap: pewawancara belum ditugaskan untuk kandidat ini." },
          { status: 400 }
        );
      }

      ({ error } = await supabaseAdmin
        .from("hasil_wawancara")
        .insert({ ...payload, kandidat_id: id, pewawancara_id: pewawancaraId }));
    }

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/admin/evaluasi/${(await params).id}]`, err);
    return NextResponse.json(
      { error: "Gagal menyimpan data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}