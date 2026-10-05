import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/monev/schedule/[id]/stats
// Jumlah mahasiswa yang sudah/belum mengirim laporan untuk periode ini
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [totalPenerima, sudahKirim] = await Promise.all([
      // Hanya penerima yang punya akun terhubung — tanpa user_id mereka
      // tidak mungkin submit, jadi tidak dihitung sebagai "belum kirim".
      // (penerima_kipk belum punya kolom status aktif.)
      prisma.penerimaKipk.count({ where: { userId: { not: null } } }),
      prisma.pengisian_monev.count({
        where: { periode_monev_id: id },
      }),
    ]);

    return NextResponse.json({
      total_penerima: totalPenerima,
      sudah_kirim:    sudahKirim,
      belum_kirim:    Math.max(0, totalPenerima - sudahKirim),
    });
  } catch (err) {
    console.error("[GET /api/admin/monev/schedule/[id]/stats]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
