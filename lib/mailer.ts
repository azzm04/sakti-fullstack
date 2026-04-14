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
  await transporter.sendMail({
    from: `"SAKTI DIRMAWA" <${process.env.SMTP_USER}>`,
    to,
    subject: "Kode OTP Login SAKTI",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
        <h2 style="color:#1e40af;margin-bottom:8px">Login SAKTI</h2>
        <p style="color:#374151">Halo <b>${nama}</b>,</p>
        <p style="color:#374151">Gunakan kode OTP berikut untuk masuk ke sistem SAKTI:</p>
        <div style="font-size:40px;font-weight:bold;letter-spacing:10px;
             color:#1e40af;text-align:center;padding:24px 16px;
             background:#eff6ff;border-radius:12px;margin:16px 0">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:14px">
          Kode ini berlaku selama <b>5 menit</b>.<br/>
          Jangan bagikan kode ini kepada siapapun.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="color:#9ca3af;font-size:12px">
          Email ini dikirim otomatis oleh sistem SAKTI - DIRMAWA Universitas Diponegoro.
        </p>
      </div>
    `,
  })
}
