import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET — ambil sesi (default: hari ini)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tanggal = searchParams.get("tanggal") ?? new Date().toISOString().split("T")[0];

    const { data: sesi, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("*")
      .eq("tanggal", tanggal)
      .maybeSingle();

    if (error) throw error;

    if (!sesi) {
      return NextResponse.json({ sesi: null });
    }

    // Ambil kuota yang sudah terisi beserta nama pewawancara
    const { data: kuotaList } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id, kuota_ke, claimed_at, pewawancara_id, pewawancara(id, nama, email)")
      .eq("sesi_id", sesi.id)
      .order("kuota_ke", { ascending: true });

    // Hitung offset: sum kuota_mahasiswa dari sesi-sesi sebelumnya (tanggal < sesi ini)
    const { data: sesiSebelumnya } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("kuota_mahasiswa")
      .lt("tanggal", sesi.tanggal)
      .order("tanggal", { ascending: true });

    const offset = (sesiSebelumnya ?? []).reduce((sum, s) => sum + (s.kuota_mahasiswa ?? 0), 0);

    return NextResponse.json({ sesi, slots: kuotaList ?? [], offset });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil sesi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST — buat sesi baru untuk tanggal tertentu
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tanggal,
      kuota_pewawancara = 20,
      kuota_mahasiswa = 120,
      jalur_masuk,
    } = body;

    if (!tanggal) {
      return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }

    const insertData: Record<string, unknown> = {
      tanggal,
      kuota_pewawancara,
      kuota_mahasiswa,
      war_aktif: false,
    };
    if (jalur_masuk) insertData.jalur_masuk = jalur_masuk;

    const { data, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Sesi untuk tanggal ini sudah ada" }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sesi]", err);
    return NextResponse.json(
      { error: "Gagal membuat sesi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// PATCH — toggle WAR aktif/nonaktif, atau update kuota
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, war_aktif, kuota_pewawancara, kuota_mahasiswa } = body;

    if (!id) return NextResponse.json({ error: "id sesi wajib diisi" }, { status: 400 });

    const update: Record<string, unknown> = {};
    if (war_aktif !== undefined) {
      update.war_aktif = war_aktif;
      if (war_aktif === true) update.war_dibuka_at = new Date().toISOString();
      if (war_aktif === false) update.war_ditutup_at = new Date().toISOString();
    }
    if (kuota_pewawancara !== undefined) update.kuota_pewawancara = kuota_pewawancara;
    if (kuota_mahasiswa !== undefined) update.kuota_mahasiswa = kuota_mahasiswa;

    const { data, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal update sesi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// DELETE — hapus sesi atau hapus kuota pewawancara dari sesi (kick dari WAR)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slot_id");
    const sesiId = searchParams.get("id");

    // Hapus seluruh sesi
    if (sesiId) {
      // Cek apakah sesi sudah distribusi
      const { data: sesi } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, distribusi_done")
        .eq("id", sesiId)
        .single();

      if (!sesi) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
      }

      if (sesi.distribusi_done) {
        return NextResponse.json({ error: "Sesi yang sudah didistribusikan tidak bisa dihapus" }, { status: 400 });
      }

      // Hapus semua kuota_pewawancara terkait sesi ini
      await supabaseAdmin
        .from("kuota_pewawancara")
        .delete()
        .eq("sesi_id", sesiId);

      // Hapus sesi
      const { error } = await supabaseAdmin
        .from("sesi_wawancara")
        .delete()
        .eq("id", sesiId);

      if (error) throw error;

      return NextResponse.json({ success: true, message: "Sesi berhasil dihapus" });
    }

    // Hapus satu slot kuota pewawancara
    if (!slotId) {
      return NextResponse.json({ error: "slot_id atau id wajib diisi" }, { status: 400 });
    }

    // Ambil data kuota sebelum dihapus
    const { data: kuotaItem } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id, pewawancara_id, sesi_id")
      .eq("id", slotId)
      .single();

    if (!kuotaItem) {
      return NextResponse.json({ error: "Kuota tidak ditemukan" }, { status: 404 });
    }

    // Hapus kuota
    const { error } = await supabaseAdmin
      .from("kuota_pewawancara")
      .delete()
      .eq("id", slotId);

    if (error) throw error;

    // Kurangi total_assigned pewawancara
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("total_assigned")
      .eq("id", kuotaItem.pewawancara_id)
      .single();

    if (pw) {
      await supabaseAdmin
        .from("pewawancara")
        .update({ total_assigned: Math.max(0, (pw.total_assigned ?? 1) - 1) })
        .eq("id", kuotaItem.pewawancara_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus kuota", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
