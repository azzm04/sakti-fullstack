import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
  })
}