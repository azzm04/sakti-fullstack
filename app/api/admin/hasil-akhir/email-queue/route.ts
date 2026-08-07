import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JALUR_MAP: Record<string, string[]> = {
  SNBP_ELIGIBLE:     ["SNBP"],
  SNBP_NON_ELIGIBLE: ["SNBP"],
  SNBT_ELIGIBLE:     ["SNBT"],
  SNBT_NON_ELIGIBLE: ["SNBT"],
  UM:                ["UM", "Ujian Mandiri"],
  SBUB:              ["SBUB"],
};

const BodySchema = z.object({
  jalur:         z.array(z.string()).min(1),
  sk_dokumen_id: z.string().min(1),
  subject:       z.string().min(1),
});

// ── POST: masukkan kandidat ke antrian ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid", details: parsed.error.issues }, { status: 400 });
    }

    const { jalur, sk_dokumen_id, subject } = parsed.data;

    // Kumpulkan nilai jalur_masuk dari semua key terpilih
    const jalurValues = Array.from(
      new Set(jalur.flatMap((k) => JALUR_MAP[k] ?? []))
    );

    if (jalurValues.length === 0) {
      return NextResponse.json({ error: "Jalur tidak valid" }, { status: 400 });
    }

    // Pastikan SK dokumen ada
    const { data: sk, error: skErr } = await supabase
      .from("sk_dokumen")
      .select("id")
      .eq("id", sk_dokumen_id)
      .single();

    if (skErr || !sk) {
      return NextResponse.json({ error: "SK dokumen tidak ditemukan" }, { status: 404 });
    }

    // Ambil kandidat lolos dengan email valid
    const { data: kandidats, error: kErr } = await supabase
      .from("kandidat")
      .select(`
        id,
        nama_pendaftar,
        email,
        hasil_wawancara!inner (
          hasil_akhir
        )
      `)
      .in("jalur_masuk", jalurValues)
      .in("hasil_wawancara.hasil_akhir", ["Diusulkan", "DIUSULKAN", "Lolos", "LOLOS"])
      .not("email", "is", null)
      .neq("email", "");

    if (kErr) throw kErr;
    if (!kandidats || kandidats.length === 0) {
      return NextResponse.json({ error: "Tidak ada kandidat lolos dengan email valid" }, { status: 404 });
    }

    // Cek duplikat
    const { data: existing } = await supabase
      .from("email_queue")
      .select("kandidat_id")
      .eq("sk_dokumen_id", sk_dokumen_id)
      .in("status", ["queued", "sent"]);

    const existingIds  = new Set((existing ?? []).map((r: { kandidat_id: string }) => r.kandidat_id));
    const newKandidats = kandidats.filter((k) => !existingIds.has(k.id));

    if (newKandidats.length === 0) {
      return NextResponse.json({
        error:   "Semua kandidat sudah ada di antrian atau sudah dikirim.",
        skipped: kandidats.length,
      }, { status: 409 });
    }

    const rows = newKandidats.map((k) => ({
      kandidat_id:   k.id,
      sk_dokumen_id,
      to_email:      k.email,
      to_nama:       k.nama_pendaftar,
      subject,
      status:        "queued",
    }));

    const { error: insertErr } = await supabase.from("email_queue").insert(rows);
    if (insertErr) throw insertErr;

    return NextResponse.json({
      enqueued: newKandidats.length,
      skipped:  existingIds.size,
      total:    kandidats.length,
    }, { status: 201 });

  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/email-queue]", err);
    return NextResponse.json(
      { error: "Gagal membuat antrian", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
