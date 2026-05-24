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
      import_batch_id:           batch.id,
      no:                        row.no ?? 0,
      no_pendaftaran_kipk:       row.no_pendaftaran_kipk,
      no_bantuan_sosial:         row.no_bantuan_sosial,
      nama:                      row.nama,
      prodi:                     row.prodi,
      nik:                       row.nik,
      no_kartu_keluarga:         row.no_kartu_keluarga,
      nisn:                      row.nisn,
      asal_sekolah:              row.asal_sekolah,
      status_dtsen:              row.status_dtsen,
      jumlah_tanggungan:         row.jumlah_tanggungan,
      jumlah_orang_rumah:        row.jumlah_orang_rumah,
      pekerjaan_ayah:            row.pekerjaan_ayah,
      pekerjaan_ibu:             row.pekerjaan_ibu,
      penghasilan_ayah:          row.penghasilan_ayah,
      penghasilan_ibu:           row.penghasilan_ibu,
      kab_kota:                  row.kab_kota,
      provinsi:                  row.provinsi,
      alamat:                    row.alamat,
      pbb:                       row.pbb,
      daya_listrik:              row.daya_listrik,
      no_hp:                     row.no_hp,
      email:                     row.email,
      koordinat:                 row.koordinat,
      latitude:                  row.latitude,
      longitude:                 row.longitude,
      jalur_masuk:               row.jalur_masuk,
      catatan_admin:             row.catatan_admin,
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
        "id, no, no_pendaftaran_kipk, no_bantuan_sosial, nama, prodi, nik, no_hp, email, " +
        "penghasilan_ayah, penghasilan_ibu, jumlah_tanggungan, pbb, " +
        "jalur_masuk, catatan_admin, import_batch_id, created_at, skor_total, ranking, " +
        "status_seleksi, hasil_seleksi",
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
