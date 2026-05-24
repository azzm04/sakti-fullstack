import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/admin/sesi/batch
 * Buat beberapa sesi sekaligus berdasarkan rentang tanggal.
 * Body: {
 *   tanggal_mulai: "2026-05-18",
 *   tanggal_selesai: "2026-05-21",
 *   jalur_masuk: "SNBT",
 *   kuota_pewawancara: 20,
 *   total_mahasiswa: 150  (opsional, jika tidak diisi akan dihitung dari DB)
 * }
 * 
 * Sistem akan:
 * 1. Hitung jumlah hari dari rentang tanggal
 * 2. Bagi total_mahasiswa secara merata ke setiap hari
 * 3. Sisa dibagi ke hari-hari awal (1 tambahan per hari)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tanggal_mulai,
      tanggal_selesai,
      jalur_masuk,
      kuota_pewawancara = 20,
      total_mahasiswa: inputTotal,
    } = body;

    if (!tanggal_mulai || !tanggal_selesai) {
      return NextResponse.json({ error: "tanggal_mulai dan tanggal_selesai wajib diisi" }, { status: 400 });
    }
    if (!jalur_masuk) {
      return NextResponse.json({ error: "jalur_masuk wajib diisi" }, { status: 400 });
    }

    // Hitung jumlah hari
    const start = new Date(tanggal_mulai);
    const end = new Date(tanggal_selesai);
    if (end < start) {
      return NextResponse.json({ error: "tanggal_selesai harus >= tanggal_mulai" }, { status: 400 });
    }

    const diffMs = end.getTime() - start.getTime();
    const jumlahHari = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (jumlahHari > 30) {
      return NextResponse.json({ error: "Maksimal 30 hari per batch" }, { status: 400 });
    }

    // Tentukan total mahasiswa
    let totalMahasiswa = inputTotal;
    if (!totalMahasiswa) {
      // Hitung dari database: kandidat yang belum di-assign untuk jalur ini
      const { count, error: countErr } = await supabaseAdmin
        .from("kandidat")
        .select("id", { count: "exact", head: true })
        .eq("jalur_masuk", jalur_masuk);

      if (countErr) throw countErr;
      totalMahasiswa = count ?? 0;
    }

    if (totalMahasiswa <= 0) {
      return NextResponse.json({ error: "Tidak ada kandidat untuk jalur masuk ini" }, { status: 400 });
    }

    // Distribusi merata: floor + sisa ke hari awal
    const perHari = Math.floor(totalMahasiswa / jumlahHari);
    const sisa = totalMahasiswa % jumlahHari;

    // Generate tanggal-tanggal
    const sesiList: {
      tanggal: string;
      kuota_pewawancara: number;
      kuota_mahasiswa: number;
      jalur_masuk: string;
      war_aktif: boolean;
    }[] = [];

    for (let i = 0; i < jumlahHari; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const tanggalStr = date.toISOString().split("T")[0];

      // Hari ke-i mendapat tambahan 1 jika i < sisa
      const kuotaHariIni = perHari + (i < sisa ? 1 : 0);

      sesiList.push({
        tanggal: tanggalStr,
        kuota_pewawancara,
        kuota_mahasiswa: kuotaHariIni,
        jalur_masuk,
        war_aktif: false,
      });
    }

    // Insert semua sesi (skip yang sudah ada)
    const results: { tanggal: string; kuota_mahasiswa: number; status: string }[] = [];

    for (const sesiData of sesiList) {
      const { data, error } = await supabaseAdmin
        .from("sesi_wawancara")
        .insert(sesiData)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          results.push({ tanggal: sesiData.tanggal, kuota_mahasiswa: sesiData.kuota_mahasiswa, status: "sudah_ada" });
        } else {
          results.push({ tanggal: sesiData.tanggal, kuota_mahasiswa: sesiData.kuota_mahasiswa, status: `error: ${error.message}` });
        }
      } else {
        results.push({ tanggal: sesiData.tanggal, kuota_mahasiswa: sesiData.kuota_mahasiswa, status: "created" });
      }
    }

    const created = results.filter(r => r.status === "created").length;

    return NextResponse.json({
      success: true,
      total_mahasiswa: totalMahasiswa,
      jumlah_hari: jumlahHari,
      per_hari_base: perHari,
      sisa_distribusi: sisa,
      created,
      results,
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sesi/batch]", err);
    return NextResponse.json(
      { error: "Gagal membuat batch sesi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
