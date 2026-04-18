import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET — detail satu kandidat + join data pewawancara yang bertugas
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data, error } = await supabaseAdmin
      .from("kandidat")
      .select("*, pewawancara_data:pewawancara_id(id, nama, email, sso_id)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// PATCH — update kolom wawancara (semua kolom yang diisi pewawancara)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const allowed = [
      "validasi_kks", "validasi_kip", "validasi_sktm", "sosial_media",
      "ket_pekerjaan_ayah", "ket_penghasilan_ayah", "ket_pekerjaan_ibu", "ket_penghasilan_ibu",
      "penghasilan_lain", "jml_tanggungan_sebenarnya", "validasi_orang_rumah",
      "kepemilikan_rumah", "tahun_perolehan", "luas_tanah", "luas_bangunan",
      "sumber_air", "mck", "aset", "kondisi_rumah", "jarak_pusat_kota",
      "hasil_akhir", "rekomendasi", "alasan", "pewawancara",
    ];

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    // Auto-update status_wawancara jika hasil_akhir atau rekomendasi diisi
    if ((update.hasil_akhir || update.rekomendasi) && update.pewawancara) {
      update.status_wawancara = "completed";
      update.interviewed_at = new Date().toISOString();
    }
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("kandidat")
      .update(update)
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menyimpan", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// DELETE — hapus data evaluasi (reset kolom wawancara saja, bukan hapus kandidat)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("kandidat")
      .update({ aset: "", rekomendasi: "", alasan: "", pewawancara: "" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
