import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string, nama: string) {
  const currentYear = new Date().getFullYear();

  await transporter.sendMail({
    from: `"SAKTI DIRMAWA" <${process.env.SMTP_USER}>`,
    to,
    subject: "Kode OTP Login SAKTI - Universitas Diponegoro",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              
              <table width="100%" max-width="500" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
                
                <tr>
                  <td style="background-color: #0B2447; padding: 32px 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">SISTEM SAKTI</h1>
                    <p style="color: #93c5fd; margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Universitas Diponegoro</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px 24px;">
                    <p style="font-size: 16px; color: #1f2937; margin: 0 0 20px 0;">Halo <strong>${nama}</strong>,</p>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.6; margin: 0 0 24px 0;">
                      Anda baru saja meminta kode otentikasi (OTP) untuk masuk ke portal SAKTI. Silakan masukkan kode 6-digit di bawah ini untuk melanjutkan proses verifikasi:
                    </p>

                    <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0B2447;">
                        ${otp}
                      </span>
                    </div>

                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin-bottom: 8px;">
                      <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>⚠️ Peringatan Keamanan:</strong> Kode ini hanya berlaku selama <b>5 menit</b>. Jangan pernah membagikan kode ini kepada pihak mana pun, termasuk staf kampus.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
                      Email ini dikirim secara otomatis oleh sistem.<br/>Mohon tidak membalas email ini.
                    </p>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                      &copy; ${currentYear} DIRMAWA - Universitas Diponegoro
                    </p>
                  </td>
                </tr>
                
              </table>
              </td>
          </tr>
        </table>
        
      </body>
      </html>
    `,
  });
}
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendPewawancaraAssignedEmail(to: string, nama: string) {
  const safeNama = escapeHtml(nama);
  const safeEmail = escapeHtml(to);
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/pewawancara-login`;

  await transporter.sendMail({
    from: `"SAKTI DIRMAWA" <${process.env.SMTP_USER}>`,
    to,
    subject: "Penunjukan Pewawancara KIP Kuliah - Universitas Diponegoro",
    html: `<div style="margin:0; padding:32px 16px; background-color:#f7f8fa; font-family:Arial, Helvetica, sans-serif; color:#30343b; font-size:14px; line-height:1.65;">

  <div style="max-width:600px; margin:0 auto;">

<!-- Email Container -->
<div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:6px; padding:36px 38px;">

  <!-- Institution -->
  <div style="margin:0 0 28px 0; padding-bottom:18px; border-bottom:1px solid #e5e7eb;">
    <div style="font-size:12px; letter-spacing:0.4px; color:#6b7280; text-align:center">
      UNIVERSITAS DIPONEGORO
    </div>
    <div style="margin-top:4px; font-size:12px; color:#9ca3af; text-align:center">
      Direktorat Kemahasiswaan
    </div>
  </div>

  <!-- Greeting -->
  <p style="margin:0 0 16px 0;">
    Yth. <strong>${safeNama}</strong>,
  </p>

  <p style="margin:0 0 16px 0;">
    Dengan hormat, kami menyampaikan bahwa Anda telah ditetapkan sebagai
    <strong>Pewawancara</strong> dalam proses seleksi Beasiswa KIP Kuliah
    Universitas Diponegoro.
  </p>

  <p style="margin:0 0 26px 0;">
    Terima kasih atas kesediaan Anda untuk berkontribusi dalam pelaksanaan
    proses seleksi tersebut. Informasi penugasan dan pelaksanaan wawancara
    dapat diakses melalui sistem SAKTI.
  </p>

  <!-- Account -->
  <div style="margin:0 0 26px 0;">

    <div style="font-size:13px; font-weight:600; color:#374151; margin-bottom:10px;">
      Informasi Akun
    </div>

    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="border-collapse:collapse; font-size:13px;">

      <tr>
        <td style="width:120px; padding:8px 0; color:#6b7280; border-bottom:1px solid #f0f1f3;">
          Nama
        </td>
        <td style="padding:8px 0; color:#30343b; border-bottom:1px solid #f0f1f3;">
          ${safeNama}
        </td>
      </tr>

      <tr>
        <td style="padding:8px 0; color:#6b7280;">
          Email
        </td>
        <td style="padding:8px 0; color:#30343b;">
          ${safeEmail}
        </td>
      </tr>

    </table>

  </div>

  <!-- Access Information -->
  <div style="margin:0 0 24px 0; padding:16px 18px; background:#fafafa; border-left:3px solid #d1d5db;">

    <div style="font-size:13px; font-weight:600; color:#374151; margin-bottom:5px;">
      Akses Sistem
    </div>

    <div style="font-size:13px; color:#626975;">
      Akun Anda telah aktif. Silakan masuk ke SAKTI menggunakan alamat
      email di atas. Kode OTP akan dikirimkan ke alamat email tersebut
      setiap kali proses masuk dilakukan.
    </div>

  </div>

  <p style="margin:0 0 8px 0; font-size:13px; color:#4b5563;">
    Setelah masuk ke SAKTI, Anda dapat memantau jadwal sesi serta memilih
    urutan wawancara sesuai dengan ketentuan yang berlaku.
  </p>

  <!-- CTA -->
  <div style="margin:26px 0 30px 0; text-align:center">

    <a href="${loginUrl}"
       style="display:inline-block; padding:11px 20px; background:#1f2937; color:#ffffff; text-decoration:none; font-size:13px; font-weight:600; border-radius:4px;">
      Masuk ke SAKTI
    </a>

  </div>

  <!-- Closing -->
  <div style="padding-top:20px; border-top:1px solid #e5e7eb;">

    <p style="margin:0 0 18px 0; font-size:13px; color:#626975;">
      Demikian informasi ini disampaikan. Mohon diperhatikan dan
      ditindaklanjuti sesuai dengan ketentuan yang berlaku.
    </p>

    <p style="margin:0; font-size:13px; color:#4b5563;">
      Hormat kami,<br />
      <strong style="color:#30343b;">Direktorat Kemahasiswaan</strong><br />
      Universitas Diponegoro
    </p>

  </div>

</div>

<!-- Footer -->
<div style="padding:16px 8px 0 8px; text-align:center;">
  <div style="font-size:11px; color:#9ca3af; line-height:1.5;">
    Email ini dikirim secara otomatis oleh sistem SAKTI.<br />
    Mohon tidak membalas email ini.
  </div>
</div>

  </div>

</div>
`,
  });
}
