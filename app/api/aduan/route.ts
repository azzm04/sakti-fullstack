import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db"; 
import { z } from "zod";

// Skema Validasi
const aduanSchema = z.object({
  jenis_aduan: z.enum(["KETIDAKTEPATAN", "PENYALAHGUNAAN"], {
    error: "Jenis pelaporan wajib dipilih dan harus valid",
  }),
  nama_terlapor: z.string().min(1, "Nama terlapor wajib diisi"),
  uraian_kronologi: z.string().min(150, "Uraian terlalu singkat, mohon jelaskan detail kronologinya (idealnya 3 paragraf)."),
  url_bukti: z.string().url("Format link bukti tidak valid").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Menggunakan safeParse menyesuaikan standar kode tim
    const result = aduanSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const parsedData = result.data;

    // Generate Kode Laporan unik otomatis (Contoh: ADUAN-2026-89473)
    const tahun = new Date().getFullYear();
    const angkaAcak = Math.floor(10000 + Math.random() * 90000);
    const kodeLaporan = `ADUAN-${tahun}-${angkaAcak}`;

    // Simpan ke Database
    const aduanBaru = await prisma.aduan.create({
      data: {
        kode_laporan: kodeLaporan,
        jenis_aduan: parsedData.jenis_aduan,
        nama_terlapor: parsedData.nama_terlapor,
        uraian_kronologi: parsedData.uraian_kronologi,
        url_bukti: parsedData.url_bukti || "https://placeholder.com/belum-ada-bukti",
      },
    });

    return NextResponse.json(
      { message: "Aduan berhasil direkam ke dalam sistem!", data: aduanBaru },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api-aduan-post]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}