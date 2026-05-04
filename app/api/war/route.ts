import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { jwtVerify } from "jose";

// ── Helper: ambil pewawancara dari JWT ────────────────────────────────────────
async function getPewawancaraFromToken(req: NextRequest) {
  const token = req.cookies.get("sakti_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const email = payload.email as string;
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();
    return pw ?? null;
  } catch {
    return null;
  }
}

// ── GET — status WAR (ambil sesi yang war_aktif, atau sesi hari ini) ──────────
export async function GET(req: NextRequest) {
  try {
    // Prioritas: sesi yang war_aktif = true (bisa tanggal berapa saja)
    // Fallback: sesi hari ini
    const tanggalHariIni = new Date().toISOString().split("T")[0];

    let { data: sesi, error } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, war_dibuka_at, distribusi_done")
      .eq("war_aktif", true)
      .order("tanggal", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // Jika tidak ada sesi WAR aktif, coba ambil sesi hari ini
    if (!sesi) {
      const { data: sesiHariIni, error: err2 } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, war_dibuka_at, distribusi_done")
        .eq("tanggal", tanggalHariIni)
        .maybeSingle();
      if (err2) throw err2;
      sesi = sesiHariIni;
    }
    if (!sesi) {
      return NextResponse.json({ war_aktif: false, sesi: null, slots: [], slot_saya: null });
    }

    const { data: slots } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, slot_ke, claimed_at, pewawancara_id, pewawancara(nama, email)")
      .eq("sesi_id", sesi.id)
      .order("slot_ke", { ascending: true });

    // Cek slot milik pewawancara yang request
    const pw = await getPewawancaraFromToken(req);
    let slotSaya = null;
    if (pw) {
      slotSaya = (slots ?? []).find((s) => s.pewawancara_id === pw.id) ?? null;
    }

    return NextResponse.json({
      war_aktif:    sesi.war_aktif,
      sesi,
      slots:        slots ?? [],
      slot_terisi:  (slots ?? []).length,
      slot_saya:    slotSaya,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil status WAR", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── POST — klaim slot WAR ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "PEWAWANCARA") {
      return NextResponse.json({ error: "Hanya pewawancara yang bisa klaim slot" }, { status: 403 });
    }

    const email = payload.email as string;

    // Ambil slot_ke dari body
    const body = await req.json().catch(() => ({}));
    const requestedSlot = body.slot_ke as number | undefined;

    // Ambil sesi yang war_aktif, atau fallback ke hari ini
    const tanggalHariIni = new Date().toISOString().split("T")[0];
    let { data: sesi } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, war_aktif, kuota_pewawancara")
      .eq("war_aktif", true)
      .order("tanggal", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sesi) {
      const { data: fallback } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, war_aktif, kuota_pewawancara")
        .eq("tanggal", tanggalHariIni)
        .maybeSingle();
      sesi = fallback;
    }

    if (!sesi) return NextResponse.json({ error: "Belum ada sesi wawancara untuk hari ini" }, { status: 404 });
    if (!sesi.war_aktif) return NextResponse.json({ error: "WAR belum dibuka oleh admin" }, { status: 403 });

    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();

    if (!pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });
    if (!pw.is_active) return NextResponse.json({ error: "Akun pewawancara tidak aktif" }, { status: 403 });

    // Cek sudah punya slot
    const { data: existing } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id, slot_ke")
      .eq("sesi_id", sesi.id)
      .eq("pewawancara_id", pw.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true, already: true,
        slot_ke: existing.slot_ke,
        message: `Kamu sudah mendapatkan slot ${existing.slot_ke}`,
      });
    }

    // Tentukan slot_ke yang akan digunakan
    let slot_ke: number;

    if (!requestedSlot || requestedSlot < 1) {
      // Auto-increment jika tidak ada slot yang diminta
      const { count: slotTerisi } = await supabaseAdmin
        .from("slot_pewawancara")
        .select("id", { count: "exact", head: true })
        .eq("sesi_id", sesi.id);

      slot_ke = (slotTerisi ?? 0) + 1;
    } else {
      slot_ke = requestedSlot;
    }

    // Validasi slot_ke dalam range kuota
    if (slot_ke < 1 || slot_ke > sesi.kuota_pewawancara) {
      return NextResponse.json(
        { error: `Slot ${slot_ke} tidak valid. Kuota tersedia: 1-${sesi.kuota_pewawancara}` },
        { status: 400 }
      );
    }

    // Cek apakah slot sudah terisi
    const { data: existingSlot } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id")
      .eq("sesi_id", sesi.id)
      .eq("slot_ke", slot_ke)
      .maybeSingle();

    if (existingSlot) {
      return NextResponse.json(
        { error: `Slot ${slot_ke} sudah diambil oleh pewawancara lain` },
        { status: 409 }
      );
    }

    const { data: newSlot, error: insertErr } = await supabaseAdmin
      .from("slot_pewawancara")
      .insert({ sesi_id: sesi.id, slot_ke, pewawancara_id: pw.id })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Slot baru saja diambil orang lain, coba lagi" }, { status: 409 });
      }
      throw insertErr;
    }

    // Cek semua slot sudah terisi
    const { count: totalSlots } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id", { count: "exact", head: true })
      .eq("sesi_id", sesi.id);

    // Tutup WAR otomatis jika penuh
    if ((totalSlots ?? 0) >= sesi.kuota_pewawancara) {
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

// ── DELETE — UN-WAR: pewawancara batalkan slot sendiri ────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "PEWAWANCARA") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const email   = payload.email as string;
    const tanggal = new Date().toISOString().split("T")[0];

    // Cari sesi aktif (war_aktif atau hari ini, belum distribusi)
    const tanggalHariIni = new Date().toISOString().split("T")[0];
    let { data: sesi } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, distribusi_done")
      .eq("war_aktif", true)
      .order("tanggal", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sesi) {
      const { data: fallback } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, distribusi_done")
        .eq("tanggal", tanggalHariIni)
        .maybeSingle();
      sesi = fallback;
    }

    if (!sesi) return NextResponse.json({ error: "Tidak ada sesi hari ini" }, { status: 404 });

    // Tidak boleh UN-WAR jika distribusi sudah dilakukan
    if (sesi.distribusi_done) {
      return NextResponse.json(
        { error: "Tidak bisa membatalkan slot — distribusi mahasiswa sudah dilakukan" },
        { status: 409 }
      );
    }

    // Cari pewawancara
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, total_assigned")
      .eq("email", email)
      .maybeSingle();

    if (!pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });

    // Cari slot milik pewawancara ini
    const { data: slot } = await supabaseAdmin
      .from("slot_pewawancara")
      .select("id")
      .eq("sesi_id", sesi.id)
      .eq("pewawancara_id", pw.id)
      .maybeSingle();

    if (!slot) return NextResponse.json({ error: "Kamu tidak memiliki slot aktif hari ini" }, { status: 404 });

    // Hapus slot
    const { error: delErr } = await supabaseAdmin
      .from("slot_pewawancara")
      .delete()
      .eq("id", slot.id);

    if (delErr) throw delErr;

    // Kurangi total_assigned
    await supabaseAdmin
      .from("pewawancara")
      .update({ total_assigned: Math.max(0, (pw.total_assigned ?? 1) - 1) })
      .eq("id", pw.id);

    return NextResponse.json({
      success: true,
      message: "Slot berhasil dibatalkan. Slot kamu sekarang tersedia untuk pewawancara lain.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal membatalkan slot", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
