import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CandidateDataSchema, ValidationSummarySchema } from "@/schemas";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ImportPayloadSchema = z.object({
  fileName:   z.string(),
  validation: ValidationSummarySchema,
  data:       z.array(CandidateDataSchema),
});

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = ImportPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload tidak valid", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const { fileName, validation, data } = parsed.data;

    // 1. Insert import_batch (tabel impor_data sesuai skema baru)
    const { data: batch, error: batchError } = await supabase
      .from("impor_data")
      .insert({
        file_name:  fileName,
        total_rows: validation.total,
        valid_rows: validation.valid,
        error_rows: validation.incomplete,
        dup_rows:   validation.duplicates,
      })
      .select("id")
      .single();

    if (batchError) {
      console.error("[POST /api/kandidat] batch insert:", batchError);
      return NextResponse.json(
        { error: "Gagal membuat batch", detail: batchError.message },
        { status: 500 },
      );
    }

    // 2. Bulk insert kandidat — mapping ke kolom database baru
    const rows = data.map((row) => ({
      impor_data_id:       batch.id,
      no:                  row.no ?? 0,
      // Identitas
      no_pendaftaran_kipk: row.no_pendaftaran_kipk || null,
      no_kip:              row.no_kip              || null,
      no_kks:              row.no_kks              || null,
      nama_pendaftar:      row.nama_pendaftar       || null,
      prodi_pendaftar:     row.prodi_pendaftar      || null,
      nik:                 row.nik                 || null,
      no_kartu_keluarga:   row.no_kartu_keluarga   || null,
      nik_kepala_keluarga: row.nik_kepala_keluarga  || null,
      nisn:                row.nisn                || null,
      // Status sosial
      status_dtks:         row.status_dtks         || null,
      validasi_dtks:       row.validasi_dtks        || null,
      status_p3ke:         row.status_p3ke          || null,
      validasi_p3ke:       row.validasi_p3ke        || null,
      validasi_kip:        row.validasi_kip         || null,
      validasi_kks:        row.validasi_kks         || null,
      // Sekolah
      asal_sekolah:        row.asal_sekolah         || null,
      kab_kota_sekolah:    row.kab_kota_sekolah     || null,
      provinsi_sekolah:    row.provinsi_sekolah     || null,
      // Pribadi
      tempat_lahir:        row.tempat_lahir         || null,
      tanggal_lahir:       row.tanggal_lahir        || null,
      jenis_kelamin:       row.jenis_kelamin        || null,
      alamat:              row.alamat               || null,
      no_hp:               row.no_hp                || null,
      email:               row.email                || null,
      // Ayah
      pekerjaan_ayah:      row.pekerjaan_ayah       || null,
      ket_pekerjaan_ayah:  row.ket_pekerjaan_ayah   || null,
      penghasilan_ayah:    row.penghasilan_ayah      > 0 ? row.penghasilan_ayah      : null,
      status_ayah:         row.status_ayah           || null,
      // Ibu
      pekerjaan_ibu:       row.pekerjaan_ibu        || null,
      ket_pekerjaan_ibu:   row.ket_pekerjaan_ibu    || null,
      penghasilan_ibu:     row.penghasilan_ibu       > 0 ? row.penghasilan_ibu       : null,
      status_ibu:          row.status_ibu            || null,
      // Ekonomi
      penghasilan_lain:    row.penghasilan_lain      > 0 ? row.penghasilan_lain      : null,
      jumlah_tanggungan:   row.jumlah_tanggungan     > 0 ? row.jumlah_tanggungan     : null,
      jumlah_orang_rumah:  row.jumlah_orang_rumah    > 0 ? row.jumlah_orang_rumah    : null,
      nominal_per_kapita:  row.nominal_per_kapita    > 0 ? row.nominal_per_kapita    : null,
      // Rumah
      kepemilikan_rumah:   row.kepemilikan_rumah    || null,
      sumber_listrik:      row.sumber_listrik        || null,
      sumber_air:          row.sumber_air            || null,
      mck:                 row.mck                  || null,
      // Lokasi
      kab_kota:            row.kab_kota             || null,
      provinsi:            row.provinsi             || null,
      jarak_pusat_kota:    row.jarak_pusat_kota      > 0 ? row.jarak_pusat_kota      : null,
      // Jalur
      jalur_masuk:         row.jalur_masuk          || null,
    }));

    const { error: insertError } = await supabase
      .from("kandidat")
      .insert(rows);

    if (insertError) {
      console.error("[POST /api/kandidat] kandidat insert:", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan kandidat", detail: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success:  true,
      batchId:  batch.id,
      inserted: rows.length,
    });

  } catch (err) {
    console.error("[POST /api/kandidat] unexpected:", err);
    return NextResponse.json(
      { error: "Server error", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page    = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
    const limit   = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const search  = searchParams.get("search") ?? "";
    const batchId = searchParams.get("batchId") ?? null;
    const from    = (page - 1) * limit;
    const to      = from + limit - 1;

    let query = supabase
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar, nik, no_hp, email, " +
        "status_dtks, status_p3ke, penghasilan_ayah, penghasilan_ibu, nominal_per_kapita, " +
        "jumlah_tanggungan, jalur_masuk, impor_data_id, created_at, skor_total, ranking, " +
        "status_seleksi, hasil_seleksi",
        { count: "exact" },
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (batchId) query = query.eq("impor_data_id", batchId);
    if (search) {
      query = query.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,nik.ilike.%${search}%,prodi_pendaftar.ilike.%${search}%`,
      );
    }

    const { data: kandidats, count, error } = await query;
    if (error) throw error;

    const { data: batches, error: batchErr } = await supabase
      .from("impor_data")
      .select("id, file_name, created_at, total_rows")
      .order("created_at", { ascending: false })
      .limit(20);

    if (batchErr) throw batchErr;

    return NextResponse.json({
      data:       kandidats ?? [],
      total:      count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      batches:    batches ?? [],
    });

  } catch (err) {
    console.error("[GET /api/kandidat]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
