import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CandidateDataSchema, ValidationSummarySchema } from "@/schemas";
import { z } from "zod";

// Server-side client — service_role bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
        { status: 400 }
      );
    }

    const { fileName, validation, data } = parsed.data;

    // 1. Insert import_batch
    const { data: batch, error: batchError } = await supabase
      .from("import_batch")
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
        { status: 500 }
      );
    }

    // 2. Bulk insert kandidat
    const rows = data.map((row) => ({
      import_batch_id:            batch.id,
      no:                         row.no ?? 0,
      no_pendaftaran_kipk:        row.no_pendaftaran_kipk,
      nama:                       row.nama,
      prodi:                      row.prodi,
      nik:                        row.nik,
      no_kartu_keluarga:          row.no_kartu_keluarga,
      nik_kepala_keluarga:        row.nik_kepala_keluarga,
      nisn:                       row.nisn,
      status_dtks:                row.status_dtks,
      validasi_dtks:              row.validasi_dtks,
      status_p3ke:                row.status_p3ke,
      validasi_p3ke:              row.validasi_p3ke,
      no_kip:                     row.no_kip,
      validasi_kip:               row.validasi_kip,
      no_kks:                     row.no_kks,
      asal_sekolah:               row.asal_sekolah,
      kab_kota_sekolah:           row.kab_kota_sekolah,
      provinsi_sekolah:           row.provinsi_sekolah,
      tempat_lahir:               row.tempat_lahir,
      tanggal_lahir:              row.tanggal_lahir,
      jenis_kelamin:              row.jenis_kelamin,
      alamat_tinggal:             row.alamat_tinggal,
      no_hp:                      row.no_hp,
      email:                      row.email,
      sosial_media:               row.sosial_media,
      nama_ayah:                  row.nama_ayah,
      pekerjaan_ayah:             row.pekerjaan_ayah,
      ket_pekerjaan_ayah:         row.ket_pekerjaan_ayah,
      penghasilan_ayah:           row.penghasilan_ayah,
      ket_penghasilan_ayah:       row.ket_penghasilan_ayah,
      status_ayah:                row.status_ayah,
      nama_ibu:                   row.nama_ibu,
      pekerjaan_ibu:              row.pekerjaan_ibu,
      ket_pekerjaan_ibu:          row.ket_pekerjaan_ibu,
      penghasilan_ibu:            row.penghasilan_ibu,
      ket_penghasilan_ibu:        row.ket_penghasilan_ibu,
      status_ibu:                 row.status_ibu,
      wali:                       row.wali,
      penghasilan_lain:           row.penghasilan_lain,
      jumlah_tanggungan:          row.jumlah_tanggungan,
      jml_tanggungan_sebenarnya:  row.jml_tanggungan_sebenarnya,
      nominal_per_kapita:         row.nominal_per_kapita,
      kepemilikan_rumah:          row.kepemilikan_rumah,
      tahun_perolehan:            row.tahun_perolehan,
      sumber_listrik:             row.sumber_listrik,
      luas_tanah:                 row.luas_tanah,
      luas_bangunan:              row.luas_bangunan,
      sumber_air:                 row.sumber_air,
      mck:                        row.mck,
      kondisi_rumah:              row.kondisi_rumah,
      jarak_pusat_kota:           row.jarak_pusat_kota,
      prestasi:                   row.prestasi,
      rekomendasi:                row.rekomendasi,
      alasan:                     row.alasan,
      pewawancara:                row.pewawancara,
      has_errors:                 row.hasErrors,
      missing_fields:             row.missingFields,
    }));

    const { error: insertError } = await supabase
      .from("kandidat")
      .insert(rows);

    if (insertError) {
      console.error("[POST /api/kandidat] kandidat insert:", insertError);
      return NextResponse.json(
        { error: "Gagal menyimpan kandidat", detail: insertError.message },
        { status: 500 }
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
      { status: 500 }
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
        "id, no, no_pendaftaran_kipk, nama, prodi, nik, no_hp, email, " +
        "penghasilan_ayah, penghasilan_ibu, jumlah_tanggungan, nominal_per_kapita, " +
        "rekomendasi, pewawancara, has_errors, import_batch_id, created_at",
        { count: "exact" }
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (batchId) query = query.eq("import_batch_id", batchId);
    if (search)  query = query.or(
      `nama.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,nik.ilike.%${search}%,prodi.ilike.%${search}%`
    );

    const { data: kandidats, count, error } = await query;
    if (error) throw error;

    const { data: batches, error: batchErr } = await supabase
      .from("import_batch")
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
      { status: 500 }
    );
  }
}
