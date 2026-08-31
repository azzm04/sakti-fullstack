import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Gunakan bintang (*) untuk mengambil SEMUA kolom dari kandidat & hasil_wawancara
    // Join juga ke tabel pewawancara untuk mendapatkan nama, dan ke
    // detail_ekonomi_wawancara untuk field ekonomi riil (luas rumah, sumber
    // air/listrik, MCK, tahun perolehan) yang TIDAK ada di hasil_wawancara.
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

    const { data: riwayat } = await supabaseAdmin
      .from("kandidat_riwayat")
      .select("id, tipe, deskripsi, aktor, created_at")
      .eq("kandidat_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    const flattenedData = {
      ...row,
      hasil_wawancara: undefined,
      hasil_wawancara_id: hw?.id,
      sosial_media: hw?.sosial_media,
      validasi_kks: hw?.validasi_kks,
      validasi_kip: hw?.validasi_kip,
      validasi_sktm: hw?.validasi_sktm,
      ket_pekerjaan_ayah: hw?.ket_pekerjaan_ayah,
      ket_penghasilan_ayah: hw?.ket_penghasilan_ayah,
      ket_pekerjaan_ibu: hw?.ket_pekerjaan_ibu,
      ket_penghasilan_ibu: hw?.ket_penghasilan_ibu,
      penghasilan_lain: hw?.penghasilan_lain ?? dew?.penghasilan_lain,
      jumlah_orang_rumah: hw?.jumlah_orang_rumah,
      validasi_orang_rumah: hw?.validasi_orang_rumah,
      kepemilikan_rumah: hw?.kepemilikan_rumah,
      kepemilikan_kendaraan: hw?.kepemilikan_kendaraan,
      kepemilikan_elektronik: hw?.kepemilikan_elektronik,
      kelayakan_rumah: hw?.kelayakan_rumah,
      aset: hw?.aset,
      kondisi_rumah: hw?.kondisi_rumah,
      kondisi_orang_tua: hw?.kondisi_orang_tua ?? null,
      rekomendasi: hw?.rekomendasi,
      alasan: hw?.alasan,
      status_wawancara: hw?.status_wawancara,
      pewawancara_id: hw?.pewawancara_id,
      is_draft: hw?.is_draft,
      interviewed_at: hw?.interviewed_at,
      hasil_akhir: hw?.hasil_akhir ?? null,
      catatan_admin: hw?.catatan_admin ?? null,
      status_final: hw?.status_final ?? null,
      ranking_kuota: hw?.ranking_kuota ?? null,
      // dari detail_ekonomi_wawancara (tabel anak, terpisah dari hasil_wawancara)
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
      // riwayat aktivitas kandidat (untuk kartu "Riwayat Kandidat")
      riwayat: riwayat ?? [],
    };

    return NextResponse.json({ data: flattenedData });
  } catch (err) {
    console.error(`[GET /api/admin/evaluasi/${id}]`, err);
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
  const { id } = await params;
  try {
    const body = await req.json();

    // Cek apakah hasil_wawancara sudah ada untuk kandidat ini
    const { data: existing } = await supabaseAdmin
      .from("hasil_wawancara")
      .select("id")
      .eq("kandidat_id", id)
      .maybeSingle();

    // ── Payload hasil_wawancara — hanya field yang benar-benar ada di tabel
    //    ini (lihat components/pewawancara/detail/FormObservasi.tsx untuk
    //    field yang benar-benar dikirim form wawancara). Key bernilai
    //    undefined otomatis dibuang saat di-JSON.stringify oleh supabase-js,
    //    jadi save parsial (mis. admin cuma isi catatan) tidak menimpa field
    //    lain jadi NULL.
    const hasilWawancaraPayload = {
      sosial_media:         body.sosial_media,
      validasi_kks:         body.validasi_kks,
      validasi_kip:         body.validasi_kip,
      validasi_sktm:        body.validasi_sktm,
      ket_pekerjaan_ayah:   body.ket_pekerjaan_ayah,
      ket_penghasilan_ayah: body.ket_penghasilan_ayah,
      ket_pekerjaan_ibu:    body.ket_pekerjaan_ibu,
      ket_penghasilan_ibu:  body.ket_penghasilan_ibu,
      penghasilan_lain:     body.penghasilan_lain,
      jumlah_orang_rumah:   body.validasi_orang_rumah, // satu-satunya sumber CSV/form untuk "jumlah orang serumah"
      validasi_orang_rumah: body.validasi_orang_rumah,
      kepemilikan_rumah:    body.kepemilikan_rumah,
      aset:                 body.aset,
      kondisi_rumah:        body.kondisi_rumah,
      kondisi_orang_tua:    body.kondisi_orang_tua,
      rekomendasi:          body.rekomendasi,
      alasan:               body.alasan,
      is_draft:             body.is_draft ?? false,
      interviewed_at:       new Date().toISOString(),
      updated_at:           new Date().toISOString(),
      // Auto-set hasil_akhir untuk Layak/Tidak Layak.
      // Untuk Dipertimbangkan: pakai nilai dari body (diisi admin), atau null.
      hasil_akhir: (() => {
        if (body.rekomendasi === "Layak") return "Diusulkan";
        if (body.rekomendasi === "Tidak Layak") return "Tidak Diusulkan";
        return body.hasil_akhir ?? undefined;
      })(),
      catatan_admin: body.catatan_admin,
    };

    let hasilWawancaraId: string | undefined = existing?.id;
    let error;

    if (existing) {
      ({ error } = await supabaseAdmin
        .from("hasil_wawancara")
        .update(hasilWawancaraPayload)
        .eq("id", existing.id));
    } else {
      // Insert baru jika belum ada. Penugasan pewawancara HANYA hidup di
      // hasil_wawancara.pewawancara_id (kandidat tidak punya kolom ini) —
      // jadi baris ini normalnya sudah dibuat lebih dulu oleh endpoint
      // POST /api/admin/evaluasi/[id]/tugaskan, dan `existing` di atas akan
      // ketemu. Fallback ke body.pewawancara_id ini hanya untuk jaga-jaga.
      const pewawancaraId = body.pewawancara_id;

      if (!pewawancaraId) {
        return NextResponse.json(
          { error: "Data belum lengkap: pewawancara belum ditugaskan untuk kandidat ini." },
          { status: 400 }
        );
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("hasil_wawancara")
        .insert({ ...hasilWawancaraPayload, kandidat_id: id, pewawancara_id: pewawancaraId })
        .select("id")
        .single();

      error = insertErr;
      hasilWawancaraId = inserted?.id;
    }

    if (error) throw error;

    // ── detail_ekonomi_wawancara — tabel anak terpisah untuk field ekonomi
    //    riil (luas rumah, sumber air/listrik, MCK, tahun perolehan). Hanya
    //    disentuh kalau body benar-benar membawa salah satu field ini,
    //    supaya save parsial dari admin (rekomendasi/catatan saja) tidak
    //    membuat baris kosong.
    const dewKeys = [
      "tahun_perolehan",
      "luas_tanah",
      "luas_bangunan",
      "sumber_air",
      "mck",
      "jml_tanggungan_sebenarnya",
    ] as const;
    const hasDewData = dewKeys.some((k) => body[k] !== undefined);

    if (hasilWawancaraId && hasDewData) {
      const tahunPerolehan =
        body.tahun_perolehan === undefined
          ? undefined
          : (() => {
              const n = parseInt(String(body.tahun_perolehan), 10);
              return Number.isFinite(n) ? n : null;
            })();

      const dewPayload = {
        penghasilan_lain: body.penghasilan_lain,
        jml_tanggungan_sebenarnya: body.jml_tanggungan_sebenarnya,
        tahun_perolehan: tahunPerolehan,
        luas_tanah: body.luas_tanah,
        luas_bangunan: body.luas_bangunan,
        sumber_air: body.sumber_air,
        mck: body.mck,
      };

      const { data: existingDew } = await supabaseAdmin
        .from("detail_ekonomi_wawancara")
        .select("id")
        .eq("hasil_wawancara_id", hasilWawancaraId)
        .maybeSingle();

      if (existingDew) {
        await supabaseAdmin
          .from("detail_ekonomi_wawancara")
          .update(dewPayload)
          .eq("id", existingDew.id);
      } else {
        await supabaseAdmin
          .from("detail_ekonomi_wawancara")
          .insert({ ...dewPayload, hasil_wawancara_id: hasilWawancaraId });
      }
    }

    // ── Riwayat kandidat — log append-only, best-effort (tidak menggagalkan
    //    save utama kalau gagal).
    try {
      let aktor = "Sistem";
      const user = await getCurrentUser();
      if (user?.nama) aktor = user.nama;

      const parts: string[] = [];
      if (body.rekomendasi) parts.push(`Rekomendasi: ${body.rekomendasi}`);
      if (hasilWawancaraPayload.hasil_akhir) parts.push(`Hasil akhir: ${hasilWawancaraPayload.hasil_akhir}`);
      if (body.catatan_admin) parts.push("Catatan admin diperbarui");
      const deskripsi = parts.length ? parts.join(" · ") : "Data wawancara diperbarui";

      await supabaseAdmin.from("kandidat_riwayat").insert({
        kandidat_id: id,
        tipe: body.is_draft === false ? "submit_wawancara" : "keputusan_admin",
        deskripsi,
        aktor,
      });
    } catch (riwayatErr) {
      console.error(`[PATCH /api/admin/evaluasi/${id}] gagal mencatat riwayat:`, riwayatErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/admin/evaluasi/${id}]`, err);
    return NextResponse.json(
      { error: "Gagal menyimpan data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
