import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { isDitetapkanSk } from "@/lib/kelulusan";

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

interface SkDokumenRow {
  storage_path: string;
  nama_file: string;
}

interface KandidatRow {
  nama_pendaftar: string | null;
  nisn: string | null;
  prodi_pendaftar: string | null;
  no_pendaftaran_kipk: string | null;
  status_sk: string | null;
  verifikasi_token: string | null;
}

function firstOf<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function POST() {
  try {
    // 1. Tarik status_sk (hasil Penetapan SK Massal) melalui relasi kandidat
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
          status_sk,
          verifikasi_token
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
        const sk = firstOf(
          item.sk_dokumen as unknown as SkDokumenRow | SkDokumenRow[] | null,
        );

        // Parsing data kandidat yang lebih dalam
        const kandidat = firstOf(
          item.kandidat as unknown as KandidatRow | KandidatRow[] | null,
        );

        // "Lolos" ditentukan dari status_sk (hasil Penetapan SK Massal) —
        // status resmi pasca SK dari pimpinan/DIKTI, bukan lagi rekomendasi
        // wawancara internal kita. Lihat lib/kelulusan.ts.
        const isLolos = isDitetapkanSk(kandidat?.status_sk);

        // Mapping data agar rapi masuk ke template
        const dataTemplate = {
          nama: kandidat?.nama_pendaftar || item.to_nama || "-",
          nisn: kandidat?.nisn || "-",
          prodi: kandidat?.prodi_pendaftar || "-",
          no_pendaftaran_kipk: kandidat?.no_pendaftaran_kipk || "-",
          lolos: isLolos,
          verifikasi_token: kandidat?.verifikasi_token ?? null,
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
  verifikasi_token: string | null;
}) {
  // Jaring Pengaman yang BENAR (mengagalkan email jika data kosong)
  if (!kandidat || !kandidat.nama || kandidat.nama === "-") {
    throw new Error("Data kandidat tidak valid atau kosong.");
  }

  const teksPembuka = kandidat.lolos
    ? "Berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>LOLOS</strong> sebagai penerima Beasiswa KIP Kuliah Universitas Diponegoro."
    : "Berdasarkan hasil seleksi dan verifikasi, kamu dinyatakan <strong>BELUM LOLOS</strong> sebagai penerima Beasiswa KIP Kuliah Universitas Diponegoro.";
  const teksPenutup = kandidat.lolos
    ? "Surat Keputusan (SK) resmi terlampir pada email ini. Status penetapan juga dapat dipantau melalui akun KIP Kuliah masing-masing."
    : "Sebagai bentuk transparansi, kami melampirkan salinan resmi Surat Keputusan (SK) Daftar Penerima KIP Kuliah yang berisi nama-nama penerima yang telah ditetapkan pada jalur ini. Tetap semangat dan jangan berhenti mencari kesempatan beasiswa lainnya.";

  // Link personal & sekali pakai (?token=...) kalau ada — kandidat langsung
  // skip ke step OTP tanpa isi ulang data. Fallback ke link generik hanya
  // sebagai jaga-jaga kalau token entah kenapa belum ter-generate.
  const linkVerifikasi = kandidat.verifikasi_token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/verify-kandidat?token=${encodeURIComponent(kandidat.verifikasi_token)}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/verify-kandidat`;
  const blokVerifikasi = kandidat.lolos
    ? ` <p style="margin: 24px 0 8px 0;"> Silakan melakukan verifikasi melalui web SAKTI: </p> <p style="margin: 0 0 24px 0;"> <a href="${linkVerifikasi}" style="color: #003580; font-weight: 600; text-decoration: underline;" > Verifikasi Kandidat </a> </p> `
    : "";

  return `<div style="margin:0; padding:32px 16px; background-color:#f7f8fa; font-family:Arial, Helvetica, sans-serif; color:#30343b; font-size:14px; line-height:1.65;">

  <div style="max-width:600px; margin:0 auto;">

    <!-- Email Container -->
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:6px; padding:36px 38px;">

      <!-- Institution -->
      <div style="margin:0 0 30px 0; padding-bottom:20px; border-bottom:1px solid #e5e7eb; text-align:center;">
        <div style="font-size:12px; letter-spacing:0.5px; color:#6b7280;">
          UNIVERSITAS DIPONEGORO
        </div>
        <div style="margin-top:4px; font-size:12px; color:#9ca3af;">
          Direktorat Kemahasiswaan
        </div>
      </div>

      <!-- Title -->
      <div style="margin:0 0 20px 0;">
        <div style="font-size:20px; line-height:1.4; font-weight:600; color:#1f2937;">
          Pengumuman KIP Kuliah Universitas Diponegoro
        </div>
      </div>

      <!-- Greeting -->
      <p style="margin:0 0 16px 0;">
        Halo, <strong>${kandidat.nama}</strong>.
      </p>

      <!-- Opening -->
      <p style="margin:0 0 26px 0;">
        ${teksPembuka}
      </p>

      <!-- Applicant Data -->
      <div style="margin:0 0 26px 0;">

        <div style="font-size:13px; font-weight:600; color:#374151; margin-bottom:10px;">
          Data Pendaftar
        </div>

        <table cellpadding="0" cellspacing="0" border="0" width="100%"
               style="border-collapse:collapse; font-size:13px;">

          <tr>
            <td style="width:150px; padding:9px 0; color:#6b7280; border-bottom:1px solid #f0f1f3;">
              Nama
            </td>
            <td style="padding:9px 0; color:#30343b; border-bottom:1px solid #f0f1f3;">
              ${kandidat.nama}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0; color:#6b7280; border-bottom:1px solid #f0f1f3;">
              NISN
            </td>
            <td style="padding:9px 0; color:#30343b; border-bottom:1px solid #f0f1f3;">
              ${kandidat.nisn}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0; color:#6b7280; border-bottom:1px solid #f0f1f3;">
              Program Studi
            </td>
            <td style="padding:9px 0; color:#30343b; border-bottom:1px solid #f0f1f3;">
              ${kandidat.prodi}
            </td>
          </tr>

          <tr>
            <td style="padding:9px 0; color:#6b7280;">
              No. Pendaftaran KIPK
            </td>
            <td style="padding:9px 0; color:#30343b;">
              ${kandidat.no_pendaftaran_kipk}
            </td>
          </tr>

        </table>

      </div>

      <!-- Closing Information -->
      <p style="margin:0 0 24px 0;">
        ${teksPenutup}
      </p>

      <!-- Verification Block -->
      ${blokVerifikasi}

      <!-- Final Notice -->
      <p style="margin:32px 0 0 0; padding-top:18px; border-top:1px solid #e5e7eb; color:#626975; font-size:13px;">
        Demikian informasi ini disampaikan. Mohon diperhatikan dan ditindaklanjuti
        sesuai dengan ketentuan yang berlaku.
      </p>

      <!-- Signature -->
      <p style="margin:24px 0 0 0; color:#4b5563; font-size:13px; line-height:1.7;">
        Hormat kami,<br />
        <strong style="color:#30343b;">Direktorat Kemahasiswaan</strong><br />
        Universitas Diponegoro
      </p>

    </div>

    <!-- Footer -->
    <div style="padding:16px 8px 0 8px; text-align:center;">
      <div style="font-size:11px; color:#9ca3af; line-height:1.5;">
        Email ini dikirim secara otomatis oleh sistem KIP Kuliah.<br />
        Mohon tidak membalas email ini.
      </div>
    </div>

  </div>

</div>`;
}
