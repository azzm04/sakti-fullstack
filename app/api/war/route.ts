import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

// GET — cek status WAR hari ini (untuk polling realtime di halaman pewawancara)
export async function GET(req: NextRequest) {
  try {
    const tanggal = new Date().toISOString().split("T")[0];

    const { data: sesi, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, war_dibuka_at, distribusi_done")
      .eq("tanggal", tanggal)
      .maybeSingle();

    if (error) throw error;
    if (!sesi) {
      return NextResponse.json({ war_aktif: false, sesi: null, slots: [], slot_saya: null });
    }

    // Ambil semua slot yang sudah terisi
    const { data: slots } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, slot_ke, claimed_at, pewawancara_id, pewawancara(nama, email)")
      .eq("sesi_id", sesi.id)
      .order("slot_ke", { ascending: true });

    // Cek apakah pewawancara yang request sudah punya slot
    const token = req.cookies.get("sakti_token")?.value;
    let slotSaya = null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const email = payload.email as string;

        // Cari pewawancara_id dari email
        const { data: pw } = await supabaseAdmin
          .from("pewawancara")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (pw) {
          slotSaya = (slots ?? []).find((s) => s.pewawancara_id === pw.id) ?? null;
        }
      } catch {
        // token invalid, abaikan
      }
    }

    return NextResponse.json({
      war_aktif: sesi.war_aktif,
      sesi,
      slots: slots ?? [],
      slot_terisi: (slots ?? []).length,
      slot_saya: slotSaya,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil status WAR", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// POST — pewawancara klaim slot WAR (atomic via upsert + constraint)
export async function POST(req: NextRequest) {
  try {
    // Verifikasi JWT
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== "PEWAWANCARA") {
      return NextResponse.json({ error: "Hanya pewawancara yang bisa klaim slot" }, { status: 403 });
    }

    const email = payload.email as string;
    const tanggal = new Date().toISOString().split("T")[0];

    // 1. Cek sesi hari ini
    const { data: sesi, error: sesiErr } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, war_aktif, kuota_pewawancara")
      .eq("tanggal", tanggal)
      .single();

    if (sesiErr || !sesi) {
      return NextResponse.json({ error: "Belum ada sesi wawancara untuk hari ini" }, { status: 404 });
    }

    if (!sesi.war_aktif) {
      return NextResponse.json({ error: "WAR belum dibuka oleh admin" }, { status: 403 });
    }

    // 2. Cari pewawancara_id dari email
    const { data: pw, error: pwErr } = await supabaseAdmin
      .from("pewawancara")
      .select("id, is_active")
      .eq("email", email)
      .single();

    if (pwErr || !pw) {
      return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });
    }

    if (!pw.is_active) {
      return NextResponse.json({ error: "Akun pewawancara tidak aktif" }, { status: 403 });
    }

    // 3. Cek apakah sudah punya slot di sesi ini
    const { data: existing } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, slot_ke")
      .eq("sesi_id", sesi.id)
      .eq("pewawancara_id", pw.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        already: true,
        slot_ke: existing.slot_ke,
        message: `Kamu sudah mendapatkan slot ${existing.slot_ke}`,
      });
    }

    // 4. Hitung slot yang sudah terisi (atomic check)
    const { count: slotTerisi } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id", { count: "exact", head: true })
      .eq("sesi_id", sesi.id);

    if ((slotTerisi ?? 0) >= sesi.kuota_pewawancara) {
      return NextResponse.json({ error: "Semua slot sudah penuh" }, { status: 409 });
    }

    // 5. Ambil slot_ke berikutnya (slot_ke = jumlah terisi + 1)
    const slot_ke = (slotTerisi ?? 0) + 1;

    // 6. Insert slot — jika race condition, constraint UNIQUE akan menolak
    const { data: newSlot, error: insertErr } = await supabaseAdmin
      .from("slot_pewawancara")
      .insert({ sesi_id: sesi.id, slot_ke, pewawancara_id: pw.id })
      .select()
      .single();

    if (insertErr) {
      console.error("[POST /api/war] slot insert:", insertErr);
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Slot baru saja diambil orang lain, coba lagi" }, { status: 409 });
      }
      throw insertErr;
    }

    // 7. Jika slot sudah penuh, tutup WAR otomatis
    if (slot_ke >= sesi.kuota_pewawancara) {
      await supabaseAdmin
        .from("sesi_wawancara")
        .update({ war_aktif: false, war_ditutup_at: new Date().toISOString() })
        .eq("id", sesi.id);
    }

    return NextResponse.json({
      success: true,
      slot_ke: newSlot.slot_ke,
      message: `Selamat! Kamu mendapatkan slot ${newSlot.slot_ke}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal klaim slot", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
