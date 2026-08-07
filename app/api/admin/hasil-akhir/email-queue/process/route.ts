import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

const BATCH_SIZE = 50;

export async function POST() {
  try {
    // 1. NESTED JOIN: Tarik hasil_wawancara melalui relasi kandidat
    const { data: batch, error: fetchErr } = await supabase
      .from("email_queue")
      .select(
        `
        id, to_email, to_nama, subject,
        sk_dokumen:sk_dokumen_id (storage_path, nama_file),
        kandidat:kandidat_id (
          nama_pendaftar, 
          nisn, 
          prodi_pendaftar, 
          no_pendaftaran_kipk,
          hasil_wawancara (hasil_akhir)
        )
      `,
      )
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;
    if (!batch || batch.length === 0) {
      return NextResponse.json({
        processed: 0,
        message: "Tidak ada email dalam antrian",
      });
    }

    const ids = batch.map((r) => r.id);
    await supabase
      .from("email_queue")
      .update({ status: "processing", attempts: 1 })
      .in("id", ids);

    let sent = 0;
    let failed = 0;

    for (const item of batch) {
      try {
        const skRaw = item.sk_dokumen as any;
        const skData = Array.isArray(skRaw) ? skRaw[0] : skRaw;
        const sk = skData as {
          storage_path: string;
          nama_file: string;
        } | null;

        // Parsing data kandidat yang lebih dalam
        const kandidatRaw = item.kandidat as any;

        // Ekstrak status dari tabel hasil_wawancara
        const wawancaraArr = kandidatRaw?.hasil_wawancara;
        const statusAkhir = Array.isArray(wawancaraArr)
          ? wawancaraArr[0]?.hasil_akhir
          : wawancaraArr?.hasil_akhir;
        const isLolos = statusAkhir === "Diusulkan";

        // Mapping data agar rapi masuk ke template
        const dataTemplate = {
          nama: kandidatRaw?.nama_pendaftar || item.to_nama || "-",
          nisn: kandidatRaw?.nisn || "-",
          prodi: kandidatRaw?.prodi_pendaftar || "-",
          no_pendaftaran_kipk: kandidatRaw?.no_pendaftaran_kipk || "-",
          lolos: isLolos,
        };

        // Dapatkan PDF bytes dari Supabase Storage
        let pdfBytes: Uint8Array | null = null;
        if (sk?.storage_path) {
          const { data: fileData } = await supabase.storage
            .from("sk-dokumen")
            .download(sk.storage_path);
          if (fileData) {
            pdfBytes = new Uint8Array(await fileData.arrayBuffer());
          }
        }

        // ── Kirim email dengan Nodemailer ───────────────────────────────────────
        await transporter.sendMail({
          from: '"KIP-K UNDIP" <saktiundip@gmail.com>',
          to: item.to_email,
          subject: item.subject,
          html: buildTemplate(dataTemplate),
          attachments:
            pdfBytes && sk
              ? [
                  {
                    filename: sk.nama_file,
                    content: Buffer.from(pdfBytes),
                  },
                ]
              : undefined,
        });

        const statusText = isLolos ? "LOLOS" : "TIDAK LOLOS";
        console.log(
          `[EMAIL QUEUE] Sent to: ${item.to_email} — ${dataTemplate.nama} (${statusText})`,
        );

        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", item.id);

        sent++;
      } catch (emailErr) {
        const reason =
          emailErr instanceof Error ? emailErr.message : "Unknown error";
        await supabase
          .from("email_queue")
          .update({ status: "failed", last_error: reason })
          .eq("id", item.id);
        failed++;
        console.error(`[EMAIL QUEUE] Failed for ${item.to_email}:`, reason);
      }
    }

    return NextResponse.json({
      processed: batch.length,
      sent,
      failed,
      remaining: "unknown — call stats endpoint",
    });
  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/email-queue/process]", err);
    return NextResponse.json(
      {
        error: "Proses antrian gagal",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

// ── Email template Dinamis & Modern (Sama dengan file sebelumnya) ───────────
function buildTemplate(kandidat: {
  nama: string;
  nisn: string;
  prodi: string;
  no_pendaftaran_kipk: string;
  lolos: boolean;
}) {
  // Jaring Pengaman yang BENAR (mengagalkan email jika data kosong)
  if (!kandidat || !kandidat.nama || kandidat.nama === "-") {
    throw new Error("Data kandidat tidak valid atau kosong.");
  }

  const teksPembuka = kandidat.lolos
    ? "Selamat! Berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>LOLOS</strong>"
    : "Mohon maaf, berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>BELUM LOLOS</strong>";

  const emoticon = kandidat.lolos ? "🎉" : "🙏";

  const teksPenutup = kandidat.lolos
      ? "Dokumen SK (Surat Keputusan) resmi terlampir pada email ini. Status penetapan juga dapat kamu pantau langsung melalui akun KIP Kuliah masing-masing."
      : "Sebagai bentuk transparansi, kami melampirkan salinan resmi Surat Keputusan (SK) Daftar Penerima KIP Kuliah. Jangan patah semangat, masih banyak kesempatan beasiswa lain di Universitas Diponegoro! 💪";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 32px 16px; color: #333;">
      <div style="max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        
        <div style="background-color: ${kandidat.lolos ? "#003580" : "#475569"}; padding: 24px; text-align: center;">
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
