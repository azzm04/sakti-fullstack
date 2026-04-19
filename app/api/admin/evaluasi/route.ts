import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const filter = searchParams.get("filter") ?? "semua";
    const page   = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const to     = from + limit - 1;

    // ── Query halaman (dengan filter & search) ────────────────────────────────
    let query = supabaseAdmin
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama, prodi, nik, no_hp, email, " +
        "pewawancara, hasil_akhir, import_batch_id, created_at, " +
        "status_wawancara, pewawancara_id, jalur_masuk, " +
        // Field validasi untuk cek kelengkapan
        "validasi_kks, validasi_kip, validasi_sktm, sosial_media, " +
        "ket_pekerjaan_ayah, ket_penghasilan_ayah, ket_pekerjaan_ibu, ket_penghasilan_ibu, " +
        "jml_tanggungan_sebenarnya, validasi_orang_rumah, " +
        "kepemilikan_rumah, tahun_perolehan, luas_tanah, luas_bangunan, " +
        "sumber_air, mck, kondisi_rumah, jarak_pusat_kota",
        { count: "exact" }
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (search) {
      query = query.or(
        `nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,prodi.ilike.%${search}%`
      );
    }

    // Filter dasar di DB — cek field utama
    // Kelengkapan penuh dicek di client via getStatus()
    if (filter === "selesai") {
      query = query
        .not("hasil_akhir", "is", null)
        .not("pewawancara", "is", null).neq("pewawancara", "")
        .not("jalur_masuk", "is", null).neq("jalur_masuk", "")
        .not("kondisi_rumah", "is", null).neq("kondisi_rumah", "");
    } else if (filter === "belum") {
      query = query.or(
        "hasil_akhir.is.null,pewawancara.is.null,pewawancara.eq.,jalur_masuk.is.null,jalur_masuk.eq.,kondisi_rumah.is.null,kondisi_rumah.eq."
      );
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const [{ count: totalSelesai }, { count: totalBelum }] = await Promise.all([
      supabaseAdmin
        .from("kandidat")
        .select("id", { count: "exact", head: true })
        .not("hasil_akhir", "is", null)
        .not("pewawancara", "is", null).neq("pewawancara", "")
        .not("jalur_masuk", "is", null).neq("jalur_masuk", "")
        .not("kondisi_rumah", "is", null).neq("kondisi_rumah", "")
        .not("validasi_kks", "is", null).neq("validasi_kks", "")
        .not("sumber_air", "is", null).neq("sumber_air", "")
        .not("kepemilikan_rumah", "is", null).neq("kepemilikan_rumah", ""),
      supabaseAdmin
        .from("kandidat")
        .select("id", { count: "exact", head: true })
        .or(
          "hasil_akhir.is.null,pewawancara.is.null,pewawancara.eq.,jalur_masuk.is.null,jalur_masuk.eq.,kondisi_rumah.is.null,kondisi_rumah.eq.,validasi_kks.is.null,validasi_kks.eq."
        ),
    ]);

    return NextResponse.json({
      data:         data ?? [],
      total:        count ?? 0,
      page,
      totalPages:   Math.ceil((count ?? 0) / limit),
      totalSelesai: totalSelesai ?? 0,
      totalBelum:   totalBelum  ?? 0,
    });
  } catch (err) {
    console.error("[GET /api/admin/evaluasi]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
