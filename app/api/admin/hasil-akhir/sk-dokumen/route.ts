import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = "sk-dokumen";
const MIN_TAHUN = 2020;

// ── GET: daftar semua SK tersimpan ────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahun = searchParams.get("tahun");

    let query = supabase
      .from("sk_dokumen")
      .select("*")
      .order("created_at", { ascending: false });

    if (tahun) {
      query = query.eq("tahun", parseInt(tahun));
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/sk-dokumen]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data SK" },
      { status: 500 },
    );
  }
}

// ── POST: upload SK PDF baru ───────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const jalurRaw = formData.get("jalur_masuk") as string | null;
    const tahunRaw = formData.get("tahun") as string | null;
    const catatan = (formData.get("catatan") as string | null) ?? "";

    if (!file)
      return NextResponse.json({ error: "File wajib diisi" }, { status: 400 });
    if (!jalurRaw)
      return NextResponse.json(
        { error: "Jalur masuk wajib diisi" },
        { status: 400 },
      );
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Hanya file PDF yang diizinkan" },
        { status: 400 },
      );
    }

    const jalurMasuk: string[] = JSON.parse(jalurRaw);
    if (!Array.isArray(jalurMasuk) || jalurMasuk.length === 0) {
      return NextResponse.json(
        { error: "Pilih minimal satu jalur" },
        { status: 400 },
      );
    }

    // Validasi tahun seleksi — dikirim dari form, bukan lagi ikut tahun berjalan
    const currentYear = new Date().getFullYear();
    const tahun = tahunRaw ? parseInt(tahunRaw) : NaN;
    if (
      !tahunRaw ||
      Number.isNaN(tahun) ||
      tahun < MIN_TAHUN ||
      tahun > currentYear + 1
    ) {
      return NextResponse.json(
        {
          error: `Tahun seleksi tidak valid. Harus antara ${MIN_TAHUN} dan ${currentYear + 1}`,
        },
        { status: 400 },
      );
    }

    // Buat nama file unik di Storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${tahun}/${timestamp}_${safeName}`;
    const ukuranKb = Math.round(file.size / 1024);

    // Upload ke Supabase Storage
    const bytes = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, bytes, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    // Simpan metadata ke tabel
    const { data: row, error: dbErr } = await supabase
      .from("sk_dokumen")
      .insert({
        nama_file: file.name,
        storage_path: storagePath,
        jalur_masuk: jalurMasuk,
        tahun,
        ukuran_kb: ukuranKb,
        catatan,
      })
      .select("*")
      .single();

    if (dbErr) {
      // Rollback storage jika DB gagal
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw dbErr;
    }

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/sk-dokumen]", err);
    return NextResponse.json(
      {
        error: "Upload gagal",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// ── DELETE: hapus SK ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "ID wajib diisi" }, { status: 400 });

    // Ambil path storage dulu
    const { data: row, error: fetchErr } = await supabase
      .from("sk_dokumen")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (fetchErr) throw fetchErr;

    // Hapus dari storage
    if (row?.storage_path) {
      await supabase.storage.from(BUCKET).remove([row.storage_path]);
    }

    // Hapus dari DB
    const { error: delErr } = await supabase
      .from("sk_dokumen")
      .delete()
      .eq("id", id);

    if (delErr) throw delErr;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/hasil-akhir/sk-dokumen]", err);
    return NextResponse.json({ error: "Gagal menghapus SK" }, { status: 500 });
  }
}
