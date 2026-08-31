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

  return `<div style=" margin: 0; padding: 32px 16px; background-color: #ffffff; font-family: Arial, Helvetica, sans-serif; color: #333333; font-size: 14px; line-height: 1.6; "> <div style=" max-width: 600px; margin: 0 auto; "> <p style=" margin: 0 0 24px 0; font-size: 16px; font-weight: 600; color: #222222; "> Pengumuman KIP Kuliah Universitas Diponegoro </p> <p style="margin: 0 0 16px 0;"> Halo, <strong>${kandidat.nama}</strong>. </p> <p style="margin: 0 0 20px 0;"> ${teksPembuka} </p> <p style=" margin: 0 0 8px 0; font-weight: 600; "> Data Pendaftar </p> <table cellpadding="0" cellspacing="0" border="0" style=" width: 100%; margin: 0 0 20px 0; border-collapse: collapse; " > <tr> <td style="padding: 5px 0; width: 150px; color: #666666;"> Nama </td> <td style="padding: 5px 0;"> ${kandidat.nama} </td> </tr> <tr> <td style="padding: 5px 0; color: #666666;"> NISN </td> <td style="padding: 5px 0;"> ${kandidat.nisn} </td> </tr> <tr> <td style="padding: 5px 0; color: #666666;"> Program Studi </td> <td style="padding: 5px 0;"> ${kandidat.prodi} </td> </tr> <tr> <td style="padding: 5px 0; color: #666666;"> No. Pendaftaran KIPK </td> <td style="padding: 5px 0;"> ${kandidat.no_pendaftaran_kipk} </td> </tr> </table> <p style="margin: 0 0 20px 0;"> ${teksPenutup} </p> ${blokVerifikasi} <p style=" margin: 32px 0 0 0; padding-top: 16px; border-top: 1px solid #eeeeee; color: #777777; font-size: 13px; "> Demikian informasi ini disampaikan. Mohon diperhatikan dan ditindaklanjuti sesuai dengan ketentuan yang berlaku. </p> <p style=" margin: 24px 0 0 0; color: #555555; font-size: 13px; "> Hormat kami,<br /> <strong>Direktorat Kemahasiswaan</strong><br /> Universitas Diponegoro </p> </div> </div> `;
}
