import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { BUKTI_CONFIG } from "@/lib/aduan/bukti-config";

export const runtime = "nodejs";

const aduanSchema = z
  .object({
    jenis_aduan: z.enum(["KETIDAKTEPATAN", "PENYALAHGUNAAN"]),
    is_anonim: z.boolean(),
    nama_pelapor: z
      .string()
      .regex(/^[a-zA-Z\s]*$/, "Nama pelapor hanya boleh huruf")
      .optional()
      .or(z.literal("")),
    whatsapp_pelapor: z
      .string()
      .min(10, "Nomor WA minimal 10 angka")
      .regex(/^[0-9]+$/, "WA pelapor hanya boleh angka"),
    email_pelapor: z
      .string()
      .min(1, "Email wajib diisi")
      .max(150, "Email terlalu panjang")
      .email("Format email tidak valid"),
    nama_terlapor: z
      .string()
      .min(1, "Nama wajib diisi")
      .regex(/^[a-zA-Z\s]+$/, "Nama terlapor hanya boleh huruf"),
    nim_terlapor: z
      .string()
      .regex(/^[0-9]*$/, "NIM hanya boleh angka")
      .optional()
      .or(z.literal("")),
    fakultas_prodi: z
      .string()
      .min(1, "Fakultas/Prodi wajib diisi")
      .regex(
        /^[a-zA-Z\s\-]+$/,
        "Fakultas/Prodi hanya boleh berisi huruf dan tanda strip"
      ),
    angkatan: z.string().min(1, "Angkatan wajib diisi"),
    uraian_kronologi: z.string().min(50, "Uraian minimal 50 karakter"),
    pernyataan_setuju: z
      .boolean()
      .refine(
        (v) => v === true,
        "Anda harus menyetujui pernyataan keabsahan informasi"
      ),
  })
  .refine((d) => d.is_anonim || (d.nama_pelapor ?? "").trim().length > 0, {
    message: "Nama pelapor wajib diisi jika tidak anonim",
    path: ["nama_pelapor"],
  });

const EKSTENSI: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

// Memeriksa isi file sebenarnya (bukan hanya tipe yang diklaim browser)
function deteksiMime(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    b.length >= 8 &&
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (
    b.length >= 12 &&
    b.subarray(0, 4).toString("ascii") === "RIFF" &&
    b.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  if (b.length >= 5 && b.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }
  return null;
}

function validasiBukti(files: File[]): string | null {
  const { MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES } = BUKTI_CONFIG;
  if (files.length < 1) return "Unggah minimal 1 file bukti.";
  if (files.length > MAX_FILES) return `Maksimal ${MAX_FILES} file bukti.`;
  if (files.some((f) => f.size > MAX_FILE_BYTES)) {
    return `Ukuran tiap file maksimal ${MAX_FILE_BYTES / 1024 / 1024} MB.`;
  }
  if (files.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) {
    return `Total ukuran file maksimal ${MAX_TOTAL_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const pathTerunggah: string[] = [];

  try {
    const form = await req.formData();
    const teks = (k: string) => {
      const v = form.get(k);
      return typeof v === "string" ? v : "";
    };

    // 1. Validasi data teks
    const result = aduanSchema.safeParse({
      jenis_aduan: teks("jenis_aduan"),
      is_anonim: teks("is_anonim") === "true",
      nama_pelapor: teks("nama_pelapor"),
      whatsapp_pelapor: teks("whatsapp_pelapor"),
      email_pelapor: teks("email_pelapor").trim(),
      nama_terlapor: teks("nama_terlapor"),
      nim_terlapor: teks("nim_terlapor"),
      fakultas_prodi: teks("fakultas_prodi"),
      angkatan: teks("angkatan"),
      uraian_kronologi: teks("uraian_kronologi"),
      pernyataan_setuju: teks("pernyataan_setuju") === "true",
    });
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }
    const d = result.data;

    // 2. Validasi jumlah dan ukuran file
    const files = form
      .getAll("bukti")
      .filter((f): f is File => f instanceof File && f.size > 0);
    const errBukti = validasiBukti(files);
    if (errBukti) {
      return NextResponse.json({ error: errBukti }, { status: 400 });
    }

    // 3. Periksa isi tiap file
    const siap: {
      buffer: Buffer;
      mime: string;
      nama: string;
      ukuran: number;
    }[] = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mime = deteksiMime(buffer);
      if (!mime) {
        return NextResponse.json(
          { error: "Format file harus JPG, PNG, WebP, atau PDF." },
          { status: 400 }
        );
      }
      siap.push({
        buffer,
        mime,
        nama: file.name.slice(0, 255),
        ukuran: file.size,
      });
    }

    // 4. Unggah ke Supabase Storage
    const aduanId = randomUUID();
    const meta: {
      path_file: string;
      nama_file: string;
      mime_type: string;
      ukuran: number;
    }[] = [];

    for (const f of siap) {
      const path = `${aduanId}/${randomUUID()}.${EKSTENSI[f.mime]}`;
      const { error } = await supabaseAdmin.storage
        .from(BUKTI_CONFIG.BUCKET)
        .upload(path, f.buffer, { contentType: f.mime, upsert: false });
      if (error) throw error;
      pathTerunggah.push(path);
      meta.push({
        path_file: path,
        nama_file: f.nama,
        mime_type: f.mime,
        ukuran: f.ukuran,
      });
    }

    // 5. Simpan aduan + bukti dalam satu operasi (atomik)
    const kodeLaporan = `ADUAN-${new Date().getFullYear()}-${Math.floor(
      10000 + Math.random() * 90000
    )}`;

    const aduanBaru = await prisma.aduan.create({
      data: {
        id: aduanId,
        kode_laporan: kodeLaporan,
        jenis_aduan: d.jenis_aduan,
        is_anonim: d.is_anonim,
        nama_pelapor: d.is_anonim ? null : d.nama_pelapor,
        whatsapp_pelapor: d.whatsapp_pelapor,
        email_pelapor: d.email_pelapor.toLowerCase(),
        nama_terlapor: d.nama_terlapor,
        nim_terlapor: d.nim_terlapor || null,
        fakultas_prodi: d.fakultas_prodi,
        angkatan: d.angkatan,
        uraian_kronologi: d.uraian_kronologi,
        status: "MENUNGGU",
        pernyataan_setuju: true,
        disetujui_pada: new Date(),
        bukti: { create: meta },
      },
      select: { kode_laporan: true },
    });

    return NextResponse.json({ data: aduanBaru }, { status: 201 });
  } catch (err) {
    console.error("Gagal menyimpan aduan:", err);
    // Bersihkan file yang sempat terunggah agar tidak ada file yatim
    if (pathTerunggah.length > 0) {
      await supabaseAdmin.storage
        .from(BUKTI_CONFIG.BUCKET)
        .remove(pathTerunggah);
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}