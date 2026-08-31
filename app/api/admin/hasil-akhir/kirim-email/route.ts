import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import nodemailer from "nodemailer";
import { isLolosAkhir } from "@/lib/kelulusan";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BodySchema = z.object({
  jalur:   z.string().min(1),
  subject: z.string().min(1),
});

const JALUR_MAP: Record<string, string[]> = {
  SNBP_ELIGIBLE:     ["SNBP", "SNBP Eligible", "SNBP_ELIGIBLE"], 
  SNBP_NON_ELIGIBLE: ["SNBP non-eligible", "SNBP Non-Eligible"],
  SNBT_ELIGIBLE:     ["SNBT", "SNBT Eligible", "SNBT_ELIGIBLE"],
  SNBT_NON_ELIGIBLE: ["SNBT non-eligible", "SNBT Non-Eligible"],
  UM:                ["UM", "Ujian Mandiri"],
  SBUB:              ["SBUB"],
};

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload tidak valid", details: parsed.error.issues }, { status: 400 });
    }

    const { jalur, subject } = parsed.data;
    const jalurValues = JALUR_MAP[jalur];
    if (!jalurValues) {
      return NextResponse.json({ error: "Jalur tidak valid" }, { status: 400 });
    }

    // ── JOIN TABEL ───────────────────────────────────────
    const { data, error } = await supabase
      .from("kandidat")
      .select(`
        nama, 
        email, 
        prodi, 
        nisn, 
        no_pendaftaran_kipk,
        hasil_wawancara!inner (
          hasil_akhir,
          status_final
        )
      `)
      .in("jalur_masuk", jalurValues)
      .not("email", "is", null)
      .neq("email", "");

    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Tidak ada data kandidat atau hasil wawancara untuk jalur ini" }, { status: 404 });
    }

    const results = { sent: 0, failed: 0, errors: [] as { email: string; reason: string }[] };

    for (const item of data) {
      // Supabase mengembalikan relasi one-to-many sebagai array
      const wawancara = item.hasil_wawancara as
        | Array<{ hasil_akhir?: string; status_final?: string }>
        | { hasil_akhir?: string; status_final?: string }
        | null
        | undefined;

      const hw = Array.isArray(wawancara) ? wawancara[0] : wawancara;

      // Untuk UM/SBUB, "lolos" juga mensyaratkan lolos tahap Filtering Kuota
      // (status_final) — lihat lib/kelulusan.ts.
      const isLolos = isLolosAkhir(jalur, hw?.hasil_akhir, hw?.status_final);

      // Bentuk ulang objek kandidat agar sesuai dengan kebutuhan fungsi buildEmailTemplate
      const kandidat = {
        nama: item.nama,
        email: item.email,
        prodi: item.prodi,
        nisn: item.nisn,
        no_pendaftaran_kipk: item.no_pendaftaran_kipk,
        lolos: isLolos,
      } as {
        nama: string;
        email: string;
        prodi: string;
        nisn: string;
        no_pendaftaran_kipk: string;
        lolos: boolean;
      };

      try {
        await transporter.sendMail({
          from: '"KIP-K UNDIP" <saktiundip@gmail.com>',
          to: kandidat.email,
          subject: subject, 
          html: buildEmailTemplate(kandidat),
        });

        const statusText = isLolos ? "LOLOS" : "TIDAK LOLOS";
        console.log(`[EMAIL SENT] Terkirim ke ${kandidat.email} — ${kandidat.nama} (${statusText})`);
        results.sent++;
        
      } catch (emailErr) {
        results.failed++;
        results.errors.push({
          email:  kandidat.email,
          reason: emailErr instanceof Error ? emailErr.message : "Unknown",
        });
        console.error(`[EMAIL ERROR] Gagal mengirim ke ${kandidat.email}:`, emailErr);
      }
    }

    return NextResponse.json(results);

  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/kirim-email]", err);
    return NextResponse.json(
      { error: "Gagal memproses email", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ── Email template Dinamis ────────────────────────
function buildEmailTemplate(kandidat: {
  nama: string;
  prodi: string;
  nisn: string;
  no_pendaftaran_kipk: string;
  lolos: boolean;
}) {
  if (!kandidat) throw new Error("Data kandidat kosong.");

  const teksPembuka = kandidat.lolos 
    ? "Selamat! Berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>LOLOS</strong>" 
    : "Mohon maaf, berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>BELUM LOLOS</strong>";
  
  const emoticon = kandidat.lolos ? "🎉" : "🙏";
  
  const teksPenutup = kandidat.lolos
    ? "Dokumen SK resmi terlampir pada email ini. Status penetapan juga dapat kamu pantau langsung melalui akun KIP Kuliah masing-masing."
    : "Jangan patah semangat! Masih banyak kesempatan beasiswa lain di Universitas Diponegoro. Tetap semangat kuliahnya! 💪";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 32px 16px; color: #333;">
      <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <div style="background-color: ${kandidat.lolos ? '#003580' : '#475569'}; padding: 24px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 18px; letter-spacing: 1px;">🎓 PENGUMUMAN KIP KULIAH UNDIP</h2>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; margin-top: 0; color: #1f2937;">Halo, <strong>${kandidat.nama}</strong>! 👋</p>
          
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            ${teksPembuka} sebagai Penerima Beasiswa KIP Kuliah Universitas Diponegoro Tahun Akademik 2025/2026. ${emoticon}
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0 0 10px 0; font-size: 14px;">
              <span style="color: #64748b; display: inline-block; width: 130px;">Nama</span> 
              <strong style="color: #1e293b;">${kandidat.nama}</strong>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px;">
              <span style="color: #64748b; display: inline-block; width: 130px;">NISN</span> 
              <strong style="color: #1e293b;">${kandidat.nisn}</strong>
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px;">
              <span style="color: #64748b; display: inline-block; width: 130px;">Program Studi</span> 
              <strong style="color: #1e293b;">${kandidat.prodi}</strong>
            </p>
            <p style="margin: 0; font-size: 14px;">
              <span style="color: #64748b; display: inline-block; width: 130px;">No. KIPK</span> 
              <strong style="color: #1e293b;">${kandidat.no_pendaftaran_kipk}</strong>
            </p>
          </div>

          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            ${teksPenutup}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0;" />
          
          <p style="font-size: 13px; color: #94a3b8; margin: 0; text-align: center; line-height: 1.5;">
            <strong>Direktorat Kemahasiswaan</strong><br/>
            Universitas Diponegoro<br/>
            Tahun 2025
          </p>
        </div>
      </div>
    </div>
  `;
}