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
          pewawancara:pewawancara_id ( id, nama, email, sso_id )
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

    // Handle format Supabase (bisa berupa Array atau Object)
    const hw = Array.isArray(row.hasil_wawancara) ? row.hasil_wawancara[0] : row.hasil_wawancara;
    const pewawancaraData = Array.isArray(hw?.pewawancara) ? hw?.pewawancara[0] : hw?.pewawancara;

    const flattenedData = {
      ...row,
      hasil_wawancara: undefined, // Bersihkan data nested asli
      
      // Flatten field hasil_wawancara
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
      
      // Mapping Data Tambahan untuk Frontend
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
      validasi_kks:               body.validasi_kks,
      validasi_kip:               body.validasi_kip,
      validasi_sktm:              body.validasi_sktm,
      sosial_media:               body.sosial_media,
      ket_pekerjaan_ayah:         body.ket_pekerjaan_ayah,
      ket_penghasilan_ayah:       body.ket_penghasilan_ayah,
      ket_pekerjaan_ibu:          body.ket_pekerjaan_ibu,
      ket_penghasilan_ibu:        body.ket_penghasilan_ibu,
      penghasilan_lain:           body.penghasilan_lain,
      jml_tanggungan_sebenarnya:  body.jml_tanggungan_sebenarnya,
      validasi_orang_rumah:       body.validasi_orang_rumah,
      kepemilikan_rumah:          body.kepemilikan_rumah,
      tahun_perolehan:            body.tahun_perolehan,
      luas_tanah:                 body.luas_tanah,
      luas_bangunan:              body.luas_bangunan,
      sumber_air:                 body.sumber_air,
      mck:                        body.mck,
      aset:                       body.aset,
      kondisi_rumah:              body.kondisi_rumah,
      jarak_pusat_kota:           body.jarak_pusat_kota,
      rekomendasi:                body.rekomendasi,
      alasan:                     body.alasan,
      is_draft:                   body.is_draft ?? false,
      interviewed_at:             new Date().toISOString(),
      updated_at:                 new Date().toISOString(),
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
          .eq("id", Number(id))
          .single();

        pewawancaraId = kandidatRow?.pewawancara_id;
      }

      if (!pewawancaraId) {
        // Fallback: lookup dari tabel wawancara_assignment
        const { data: assignment } = await supabaseAdmin
          .from("wawancara_assignment")
          .select("pewawancara_id")
          .eq("kandidat_id", Number(id))
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
        .insert({ ...payload, kandidat_id: Number(id), pewawancara_id: pewawancaraId }));
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