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

    // Ambil slot yang sudah terisi beserta nama pewawancara
    const { data: slots } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, slot_ke, claimed_at, pewawancara_id, pewawancara(id, nama, email)")
      .eq("sesi_id", sesi.id)
      .order("slot_ke", { ascending: true });

    return NextResponse.json({ sesi, slots: slots ?? [] });
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
    } = body;

    if (!tanggal) {
      return NextResponse.json({ error: "Tanggal wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .insert({ tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif: false })
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

// DELETE — hapus slot pewawancara dari sesi (kick dari WAR)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotId = searchParams.get("slot_id");

    if (!slotId) {
      return NextResponse.json({ error: "slot_id wajib diisi" }, { status: 400 });
    }

    // Ambil data slot sebelum dihapus
    const { data: slot } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, pewawancara_id, sesi_id")
      .eq("id", slotId)
      .single();

    if (!slot) {
      return NextResponse.json({ error: "Slot tidak ditemukan" }, { status: 404 });
    }

    // Hapus slot
    const { error } = await supabaseAdmin
      .from("slot_pewawancara")
      .delete()
      .eq("id", slotId);

    if (error) throw error;

    // Kurangi total_assigned pewawancara
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("total_assigned")
      .eq("id", slot.pewawancara_id)
      .single();

    if (pw) {
      await supabaseAdmin
        .from("pewawancara")
        .update({ total_assigned: Math.max(0, (pw.total_assigned ?? 1) - 1) })
        .eq("id", slot.pewawancara_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal menghapus slot", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
