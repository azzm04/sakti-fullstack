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

// ── GET — status WAR ──────────────────────────────────────────────────────────
// Mendukung query param ?sesi_id=X untuk melihat sesi tertentu
// Jika tidak ada sesi_id, tampilkan semua sesi upcoming + kuota milik pewawancara
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sesiIdParam = searchParams.get("sesi_id");
    const tanggalHariIni = new Date().toISOString().split("T")[0];
    const pw = await getPewawancaraFromToken(req);

    // Jika sesi_id diberikan, tampilkan detail sesi tersebut
    if (sesiIdParam) {
      const { data: sesi, error } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, war_dibuka_at, distribusi_done")
        .eq("id", Number(sesiIdParam))
        .single();

      if (error || !sesi) {
        return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
      }

      const { data: kuotaList } = await supabaseAdmin
        .from("kuota_pewawancara")
        .select("id, kuota_ke, claimed_at, pewawancara_id, pewawancara(nama, email)")
        .eq("sesi_id", sesi.id)
        .order("kuota_ke", { ascending: true });

      let kuotaSaya = null;
      if (pw) {
        const found = (kuotaList ?? []).find((s) => s.pewawancara_id === pw.id);
        if (found) kuotaSaya = { kuota_ke: found.kuota_ke, claimed_at: found.claimed_at };
      }

      return NextResponse.json({
        war_aktif:    sesi.war_aktif,
        sesi,
        kuota_list:   kuotaList ?? [],
        kuota_terisi: (kuotaList ?? []).length,
        kuota_saya:   kuotaSaya,
      });
    }

    // Tidak ada sesi_id → tampilkan overview semua sesi upcoming
    // Ambil semua sesi dari hari ini ke depan
    const { data: allSesi } = await supabaseAdmin
      .from("sesi_wawancara")
      .select("id, tanggal, kuota_pewawancara, kuota_mahasiswa, war_aktif, war_dibuka_at, distribusi_done")
      .gte("tanggal", tanggalHariIni)
      .order("tanggal", { ascending: true });

    if (!allSesi || allSesi.length === 0) {
      return NextResponse.json({
        war_aktif: false,
        sesi: null,
        sesi_list: [],
        kuota_list: [],
        kuota_saya: null,
        kuota_terisi: 0,
      });
    }

    // Ambil semua kuota milik pewawancara ini di sesi-sesi upcoming
    let kuotaSayaMap: Record<number, { kuota_ke: number; claimed_at: string }> = {};
    if (pw) {
      const sesiIds = allSesi.map((s) => s.id);
      const { data: myKuota } = await supabaseAdmin
        .from("kuota_pewawancara")
        .select("sesi_id, kuota_ke, claimed_at")
        .eq("pewawancara_id", pw.id)
        .in("sesi_id", sesiIds);

      for (const s of myKuota ?? []) {
        kuotaSayaMap[s.sesi_id] = { kuota_ke: s.kuota_ke, claimed_at: s.claimed_at };
      }
    }

    // Hitung kuota terisi per sesi
    const sesiIds = allSesi.map((s) => s.id);
    const { data: allKuota } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("sesi_id, kuota_ke, pewawancara_id, pewawancara(nama, email)")
      .in("sesi_id", sesiIds)
      .order("kuota_ke", { ascending: true });

    const kuotaBySesi: Record<number, any[]> = {};
    for (const kuota of allKuota ?? []) {
      if (!kuotaBySesi[kuota.sesi_id]) kuotaBySesi[kuota.sesi_id] = [];
      kuotaBySesi[kuota.sesi_id].push(kuota);
    }

    const sesiList = allSesi.map((s) => ({
      ...s,
      kuota_terisi: (kuotaBySesi[s.id] ?? []).length,
      kuota_saya: kuotaSayaMap[s.id] ?? null,
      kuota_list: kuotaBySesi[s.id] ?? [],
    }));

    // Untuk backward compatibility: juga return sesi pertama yang aktif atau yang sudah diklaim
    const sesiAktif = sesiList.find((s) => s.kuota_saya) || sesiList.find((s) => s.war_aktif) || sesiList[0];

    return NextResponse.json({
      war_aktif:    sesiAktif?.war_aktif ?? false,
      sesi:         sesiAktif ? { id: sesiAktif.id, tanggal: sesiAktif.tanggal, kuota_pewawancara: sesiAktif.kuota_pewawancara, kuota_mahasiswa: sesiAktif.kuota_mahasiswa, war_aktif: sesiAktif.war_aktif, war_dibuka_at: sesiAktif.war_dibuka_at, distribusi_done: sesiAktif.distribusi_done } : null,
      sesi_list:    sesiList,
      kuota_list:   sesiAktif?.kuota_list ?? [],
      kuota_terisi: sesiAktif?.kuota_terisi ?? 0,
      kuota_saya:   sesiAktif?.kuota_saya ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal mengambil status WAR", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── POST — klaim kuota WAR ────────────────────────────────────────────────────
// Mendukung body { sesi_id, kuota_ke } untuk klaim di sesi tertentu
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "PEWAWANCARA") {
      return NextResponse.json({ error: "Hanya pewawancara yang bisa klaim kuota" }, { status: 403 });
    }

    const email = payload.email as string;
    const body = await req.json().catch(() => ({}));
    const requestedKuota = body.kuota_ke as number | undefined;
    const requestedSesiId = body.sesi_id as number | undefined;

    // Cari sesi target
    let sesi: any = null;

    if (requestedSesiId) {
      // Klaim di sesi tertentu
      const { data } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, war_aktif, kuota_pewawancara")
        .eq("id", requestedSesiId)
        .single();
      sesi = data;
    } else {
      // Fallback: cari sesi war_aktif atau upcoming
      const tanggalHariIni = new Date().toISOString().split("T")[0];
      const { data } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, war_aktif, kuota_pewawancara")
        .eq("war_aktif", true)
        .order("tanggal", { ascending: false })
        .limit(1)
        .maybeSingle();
      sesi = data;

      if (!sesi) {
        const { data: upcoming } = await supabaseAdmin
          .from("sesi_wawancara")
          .select("id, war_aktif, kuota_pewawancara")
          .gte("tanggal", tanggalHariIni)
          .order("tanggal", { ascending: true })
          .limit(1)
          .maybeSingle();
        sesi = upcoming;
      }
    }

    if (!sesi) return NextResponse.json({ error: "Belum ada sesi wawancara yang tersedia" }, { status: 404 });
    if (!sesi.war_aktif) return NextResponse.json({ error: "WAR belum dibuka oleh admin untuk sesi ini" }, { status: 403 });

    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, is_active")
      .eq("email", email)
      .maybeSingle();

    if (!pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });
    if (!pw.is_active) return NextResponse.json({ error: "Akun pewawancara tidak aktif" }, { status: 403 });

    // Cek sudah punya kuota di sesi ini
    const { data: existing } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id, kuota_ke")
      .eq("sesi_id", sesi.id)
      .eq("pewawancara_id", pw.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true, already: true,
        kuota_ke: existing.kuota_ke,
        message: `Kamu sudah mendapatkan kuota ${existing.kuota_ke} di sesi ini`,
      });
    }

    // Tentukan kuota_ke
    let kuota_ke: number;
    if (!requestedKuota || requestedKuota < 1) {
      const { count: kuotaTerisi } = await supabaseAdmin
        .from("kuota_pewawancara")
        .select("id", { count: "exact", head: true })
        .eq("sesi_id", sesi.id);
      kuota_ke = (kuotaTerisi ?? 0) + 1;
    } else {
      kuota_ke = requestedKuota;
    }

    if (kuota_ke < 1 || kuota_ke > sesi.kuota_pewawancara) {
      return NextResponse.json(
        { error: `Kuota ${kuota_ke} tidak valid. Kuota tersedia: 1-${sesi.kuota_pewawancara}` },
        { status: 400 }
      );
    }

    // Cek kuota sudah terisi
    const { data: existingKuota } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id")
      .eq("sesi_id", sesi.id)
      .eq("kuota_ke", kuota_ke)
      .maybeSingle();

    if (existingKuota) {
      return NextResponse.json(
        { error: `Kuota ${kuota_ke} sudah diambil oleh pewawancara lain` },
        { status: 409 }
      );
    }

    const { data: newKuota, error: insertErr } = await supabaseAdmin
      .from("kuota_pewawancara")
      .insert({ sesi_id: sesi.id, kuota_ke, pewawancara_id: pw.id })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "Kuota baru saja diambil orang lain, coba lagi" }, { status: 409 });
      }
      throw insertErr;
    }

    // Tutup WAR otomatis jika penuh
    const { count: totalKuota } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id", { count: "exact", head: true })
      .eq("sesi_id", sesi.id);

    if ((totalKuota ?? 0) >= sesi.kuota_pewawancara) {
      await supabaseAdmin
        .from("sesi_wawancara")
        .update({ war_aktif: false, war_ditutup_at: new Date().toISOString() })
        .eq("id", sesi.id);
    }

    return NextResponse.json({
      success: true,
      kuota_ke: newKuota.kuota_ke,
      message: `Selamat! Kamu mendapatkan kuota ${newKuota.kuota_ke}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal klaim kuota", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── DELETE — UN-WAR: pewawancara batalkan kuota sendiri ───────────────────────
// Mendukung query param ?sesi_id=X untuk batalkan di sesi tertentu
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "PEWAWANCARA") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const email = payload.email as string;
    const { searchParams } = new URL(req.url);
    const sesiIdParam = searchParams.get("sesi_id");

    // Cari sesi target
    let sesi: any = null;

    if (sesiIdParam) {
      const { data } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, distribusi_done")
        .eq("id", Number(sesiIdParam))
        .single();
      sesi = data;
    } else {
      const tanggalHariIni = new Date().toISOString().split("T")[0];
      const { data } = await supabaseAdmin
        .from("sesi_wawancara")
        .select("id, distribusi_done")
        .eq("war_aktif", true)
        .order("tanggal", { ascending: false })
        .limit(1)
        .maybeSingle();
      sesi = data;

      if (!sesi) {
        const { data: upcoming } = await supabaseAdmin
          .from("sesi_wawancara")
          .select("id, distribusi_done")
          .gte("tanggal", tanggalHariIni)
          .order("tanggal", { ascending: true })
          .limit(1)
          .maybeSingle();
        sesi = upcoming;
      }
    }

    if (!sesi) return NextResponse.json({ error: "Tidak ada sesi yang tersedia" }, { status: 404 });

    if (sesi.distribusi_done) {
      return NextResponse.json(
        { error: "Tidak bisa membatalkan kuota — distribusi mahasiswa sudah dilakukan" },
        { status: 409 }
      );
    }

    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, total_assigned")
      .eq("email", email)
      .maybeSingle();

    if (!pw) return NextResponse.json({ error: "Data pewawancara tidak ditemukan" }, { status: 404 });

    const { data: kuotaItem } = await supabaseAdmin
      .from("kuota_pewawancara")
      .select("id")
      .eq("sesi_id", sesi.id)
      .eq("pewawancara_id", pw.id)
      .maybeSingle();

    if (!kuotaItem) return NextResponse.json({ error: "Kamu tidak memiliki kuota di sesi ini" }, { status: 404 });

    const { error: delErr } = await supabaseAdmin
      .from("kuota_pewawancara")
      .delete()
      .eq("id", kuotaItem.id);

    if (delErr) throw delErr;

    await supabaseAdmin
      .from("pewawancara")
      .update({ total_assigned: Math.max(0, (pw.total_assigned ?? 1) - 1) })
      .eq("id", pw.id);

    return NextResponse.json({
      success: true,
      message: "Kuota berhasil dibatalkan. Kuota kamu sekarang tersedia untuk pewawancara lain.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Gagal membatalkan kuota", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
