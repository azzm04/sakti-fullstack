import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CandidateDataSchema, ValidationSummarySchema } from "@/schemas";
import { getCurrentUser } from "@/lib/auth-server";
import { z } from "zod";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ImportPayloadSchema = z.object({
  fileName: z.string(),
  jalurMasuk: z.string().optional().default(""),
  tahunSeleksi: z
    .number()
    .int()
    .min(2020)
    .max(2099)
    .optional()
    .default(new Date().getFullYear()),
  validation: ValidationSummarySchema.nullable().optional(),
  batchId: z.string().nullable().optional(),
  chunkIndex: z.number().optional().default(0),
  data: z.array(CandidateDataSchema),
});

export async function POST(req: NextRequest) {
  try {
    // ── Ambil admin yang sedang login ──────────────────────────────────────
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!admin.id) {
      console.error(
        "[POST /api/kandidat] admin.id kosong, payload JWT tidak sesuai",
      );
      return NextResponse.json(
        { error: "Session tidak valid, silakan login ulang" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = ImportPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload tidak valid", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const {
      fileName,
      jalurMasuk,
      tahunSeleksi,
      validation,
      batchId: existingBatchId,
      data,
    } = parsed.data;

    const jenisImporMap: Record<string, string> = {
      "SNBP Eligible": "SNBP Eligible",
      "SNBP Non Eligible": "SNBP Non Eligible",
      "SNBT Eligible": "SNBT Eligible",
      "SNBT Non Eligible": "SNBT Non Eligible",
      UM: "UM",
    };
    const jenisImpor = jenisImporMap[jalurMasuk] ?? jalurMasuk;

    // ── 1. Insert impor_data hanya pada chunk pertama ──────────────────────
    let batchId = existingBatchId ?? null;

    if (!batchId && validation) {
      // FIX: generate UUID di sini dan kirim ke DB sebagai nilai id.
      // Jangan pakai nilai id yang dikembalikan DB karena Prisma/trigger
      // bisa meng-override dengan cuid.
      const newBatchId = randomUUID();

      const { error: batchError } = await supabase.from("impor_data").insert({
        id: newBatchId, // FIX: kirim UUID eksplisit
        admin_id: admin.id,
        jenis_impor: jenisImpor,
        file_name: fileName,
        total_rows: validation.total,
        valid_rows: validation.valid,
        error_rows: validation.incomplete,
        dup_rows: validation.duplicates,
        tahun_seleksi: tahunSeleksi,
      });
      // FIX: hapus .select("id").single() — tidak perlu ambil id dari DB
      // karena kita sudah pegang newBatchId yang kita kirim sendiri

      if (batchError) {
        console.error("[POST /api/kandidat] batch insert:", batchError);
        return NextResponse.json(
          { error: "Gagal membuat batch", detail: batchError.message },
          { status: 500 },
        );
      }

      // FIX: pakai newBatchId yang kita generate, bukan nilai dari DB
      batchId = newBatchId;
    }

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId tidak ditemukan untuk chunk ini" },
        { status: 400 },
      );
    }

    // ── 2. Bulk insert kandidat ────────────────────────────────────────────
    // Ganti bagian rows mapping yang lama dengan ini

    // Fungsi untuk mengubah serial Excel menjadi format YYYY-MM-DD
    function formatExcelDate(
      excelSerial: string | number | null,
    ): string | null {
      if (!excelSerial) return null;

      const serial = Number(excelSerial);
      if (isNaN(serial)) {
        // Jika sudah berupa string tanggal biasa (misal: "2007-05-07")
        try {
          const dateStr = new Date(excelSerial).toISOString().split("T")[0];
          return dateStr !== "1970-01-01" ? dateStr : null;
        } catch {
          return null;
        }
      }

      // Hitung offset Excel (25569 hari dari 1 Jan 1900 ke 1 Jan 1970)
      const utc_days = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400; // Konversi ke detik

      const date_info = new Date(utc_value * 1000); // Konversi ke milidetik
      return date_info.toISOString().split("T")[0];
    }

    const rows = data.map((row) => ({
      impor_data_id: batchId,
      no: row.no ?? 0,
      // Identitas
      no_pendaftaran_kipk: row.no_pendaftaran_kipk || null,
      no_kip: row.no_kip || null,
      no_kks: row.no_kks || null,
      nama_pendaftar: row.nama_pendaftar || null,
      prodi_pendaftar: row.prodi_pendaftar || null,
      nik: row.nik || null,
      no_kartu_keluarga: row.no_kartu_keluarga || null,
      nik_kepala_keluarga: row.nik_kepala_keluarga || null,
      nisn: row.nisn || null,
      // Sekolah
      asal_sekolah: row.asal_sekolah || null,
      // Status sosial (hanya status, bukan validasi — validasi diisi saat wawancara)
      status_dtks: row.status_dtks || null,
      status_p3ke: row.status_p3ke || null,
      // Pribadi
      tempat_lahir: row.tempat_lahir || null,
      tanggal_lahir: formatExcelDate(row.tanggal_lahir),
      jenis_kelamin: row.jenis_kelamin || null,
      alamat: row.alamat || null,
      no_hp: row.no_hp || null,
      email: row.email || null,
      // Ekonomi awal dari Excel (bukan hasil wawancara)
      pekerjaan_ayah: row.pekerjaan_ayah || null,
      pekerjaan_ibu: row.pekerjaan_ibu || null,
      penghasilan_ayah:
        (row.penghasilan_ayah ?? 0) > 0
          ? Math.round(Number(row.penghasilan_ayah))
          : null,
      penghasilan_ibu:
        (row.penghasilan_ibu ?? 0) > 0
          ? Math.round(Number(row.penghasilan_ibu))
          : null,
      jumlah_tanggungan:
        (row.jumlah_tanggungan ?? 0) > 0
          ? Math.round(Number(row.jumlah_tanggungan))
          : null,
      // Lokasi
      kab_kota: row.kab_kota || null,
      provinsi: row.provinsi || null,
      // Jalur masuk — dari pilihan admin saat import, bukan dari CSV
      jalur_masuk: jalurMasuk || null,

      jarak_pusat_kota: row.jarak_pusat_kota || null,

      // DIBUANG — diisi saat wawancara, bukan saat import:
      // validasi_dtks, validasi_p3ke, validasi_kip, validasi_kks
      // ket_pekerjaan_ayah, ket_pekerjaan_ibu
      // status_ayah, status_ibu
      // penghasilan_lain, nominal_per_kapita
      // sumber_listrik, sumber_air, mck
      // jarak_pusat_kota
      // kab_kota_sekolah, provinsi_sekolah
      // kepemilikan_rumah, jumlah_orang_rumah
    }));

    const CHUNK = 100;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error: insertError } = await supabase
        .from("kandidat")
        .insert(chunk);

      if (insertError) {
        console.error(
          `[POST /api/kandidat] insert chunk ${i}-${i + CHUNK}:`,
          insertError,
        );
        return NextResponse.json(
          { error: "Gagal menyimpan kandidat", detail: insertError.message },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      batchId: batchId,
      inserted: rows.length,
      jalurMasuk,
    });
  } catch (err) {
    console.error("[POST /api/kandidat] unexpected:", err);
    return NextResponse.json(
      {
        error: "Server error",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const search = searchParams.get("search") ?? "";
    const batchId = searchParams.get("batchId") ?? null;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("kandidat")
      .select(
        "id, no, no_pendaftaran_kipk, nama_pendaftar, prodi_pendaftar, nik, no_hp, email, " +
          "status_dtks, status_p3ke, penghasilan_ayah, penghasilan_ibu, " +
          "jumlah_tanggungan, jalur_masuk, impor_data_id, created_at",
        { count: "exact" },
      )
      .order("no", { ascending: true })
      .range(from, to);

    if (batchId) query = query.eq("impor_data_id", batchId);
    if (search) {
      query = query.or(
        `nama_pendaftar.ilike.%${search}%,no_pendaftaran_kipk.ilike.%${search}%,` +
          `nik.ilike.%${search}%,prodi_pendaftar.ilike.%${search}%`,
      );
    }

    const { data: kandidats, count, error } = await query;
    if (error) throw error;

    const { data: batches, error: batchErr } = await supabase
      .from("impor_data")
      .select("id, file_name, created_at, total_rows, jenis_impor")
      .order("created_at", { ascending: false })
      .limit(20);

    if (batchErr) throw batchErr;

    return NextResponse.json({
      data: kandidats ?? [],
      total: count ?? 0,
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
      batches: batches ?? [],
    });
  } catch (err) {
    console.error("[GET /api/kandidat]", err);
    return NextResponse.json(
      {
        error: "Gagal mengambil data",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
