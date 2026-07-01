import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/db";
import { generateOtp, hashOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/mailer";
import { z } from "zod";

const Schema = z.object({
  email: z.string().email("Format email tidak valid"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = Schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 },
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Cari user di tabel users dengan role PEWAWANCARA
    const { data: userRow, error: userErr } = await supabaseAdmin
      .from("users")
      .select("id, email_sso, role, status_akun")
      .eq("email_sso", normalizedEmail)
      .eq("role", "PEWAWANCARA")
      .maybeSingle();

    if (userErr) {
      console.error("[pewawancara/login] users query:", userErr);
      return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
    }

    if (!userRow) {
      return NextResponse.json(
        { error: "Email tidak terdaftar sebagai pewawancara" },
        { status: 403 },
      );
    }

    if (userRow.status_akun !== "AKTIF") {
      return NextResponse.json(
        { error: "Akun pewawancara tidak aktif" },
        { status: 403 },
      );
    }

    // 2. Pastikan ada record pewawancara yang terhubung dan aktif
    const { data: pw } = await supabaseAdmin
      .from("pewawancara")
      .select("id, nama, is_active")
      .eq("user_id", userRow.id)
      .maybeSingle();

    if (!pw || !pw.is_active) {
      return NextResponse.json(
        { error: "Akun pewawancara tidak aktif atau belum dikonfigurasi" },
        { status: 403 },
      );
    }

    // 3. Upsert di Prisma (tabel yang sama) agar bisa generate OTP
    //    Prisma.user.upsert akan menemukan row yang sama via email_sso
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        role: "PEWAWANCARA",
        statusAkun: "AKTIF",
      },
      update: {},
    });

    // 4. Hapus OTP lama & buat yang baru
    await prisma.otpToken.deleteMany({ where: { userId: user.id } });

    const otp = generateOtp();
    const hashed = await hashOtp(otp);

    await prisma.otpToken.create({
      data: {
        userId: user.id,
        code: hashed,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 menit
      },
    });

    await sendOtpEmail(normalizedEmail, otp, pw.nama ?? "Pewawancara");

    return NextResponse.json({
      success: true,
      message: `Kode OTP telah dikirim ke ${normalizedEmail}`,
    });
  } catch (err) {
    console.error("[pewawancara/login]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
