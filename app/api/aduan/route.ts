import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; 
import { z } from "zod";

const aduanSchema = z.object({
  jenis_aduan: z.enum(["KETIDAKTEPATAN", "PENYALAHGUNAAN"]),
  is_anonim: z.boolean(),
  nama_pelapor: z.string().regex(/^[a-zA-Z\s]*$/, "Nama pelapor hanya boleh huruf").optional().or(z.literal("")),
  whatsapp_pelapor: z.string().regex(/^[0-9]*$/, "WA pelapor hanya boleh angka").optional().or(z.literal("")),
  nama_terlapor: z.string().min(1, "Nama wajib diisi").regex(/^[a-zA-Z\s]+$/, "Nama terlapor hanya boleh huruf"),
  nim_terlapor: z.string().regex(/^[0-9]*$/, "NIM hanya boleh angka").optional().or(z.literal("")),
  fakultas_prodi: z.string().min(1, "Fakultas/Prodi wajib diisi"),
  angkatan: z.string().min(1, "Angkatan wajib diisi"),
  uraian_kronologi: z.string().min(50, "Uraian minimal 50 karakter"),
  url_bukti: z.string().url("Format link bukti tidak valid").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = aduanSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const parsedData = result.data;
    const tahun = new Date().getFullYear();
    const angkaAcak = Math.floor(10000 + Math.random() * 90000);
    const kodeLaporan = `ADUAN-${tahun}-${angkaAcak}`;

    const aduanBaru = await prisma.aduan.create({
      data: {
        kode_laporan: kodeLaporan,
        jenis_aduan: parsedData.jenis_aduan,
        is_anonim: parsedData.is_anonim,
        nama_pelapor: parsedData.is_anonim ? null : parsedData.nama_pelapor,
        whatsapp_pelapor: parsedData.is_anonim ? null : parsedData.whatsapp_pelapor,
        nama_terlapor: parsedData.nama_terlapor,
        nim_terlapor: parsedData.nim_terlapor || null,
        fakultas_prodi: parsedData.fakultas_prodi,
        angkatan: parsedData.angkatan,
        uraian_kronologi: parsedData.uraian_kronologi,
        url_bukti: parsedData.url_bukti || "",
      },
    });

    return NextResponse.json({ data: aduanBaru }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}