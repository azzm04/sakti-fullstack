import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/monev/schedule/[id]/riwayat
//
// Tidak dipakai UI admin: riwayat perubahan jadwal dicatat untuk keperluan
// audit, bukan untuk ditampilkan. Endpoint ini dipertahankan sebagai cara
// membaca audit trail tanpa akses langsung ke database.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await prisma.riwayat_jadwal_monev.findMany({
      where:   { periode_monev_id: id },
      orderBy: { created_at: "desc" },
      select: {
        id:               true,
        tipe_perubahan:   true,
        waktu_mulai_lama: true,
        waktu_mulai_baru: true,
        deadline_lama:    true,
        deadline_baru:    true,
        is_active_lama:   true,
        is_active_baru:   true,
        catatan:          true,
        created_at:       true,
        admin_users: {
          select: { nama: true },
        },
      },
    });

    const data = rows.map((r) => ({
      id:               r.id,
      tipe_perubahan:   r.tipe_perubahan,
      waktu_mulai_lama: r.waktu_mulai_lama?.toISOString() ?? null,
      waktu_mulai_baru: r.waktu_mulai_baru?.toISOString() ?? null,
      deadline_lama:    r.deadline_lama?.toISOString() ?? null,
      deadline_baru:    r.deadline_baru?.toISOString() ?? null,
      is_active_lama:   r.is_active_lama,
      is_active_baru:   r.is_active_baru,
      catatan:          r.catatan,
      created_at:       r.created_at.toISOString(),
      admin:            r.admin_users ? { nama: r.admin_users.nama } : null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/admin/monev/schedule/[id]/riwayat]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil riwayat" },
      { status: 500 }
    );
  }
}
