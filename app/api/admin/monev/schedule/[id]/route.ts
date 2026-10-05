import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSesiAdmin } from "@/lib/auth/sesi-admin";
import {
  getOperationalStatus,
  validateScheduleChange,
  determineTipePerubahan,
} from "@/lib/monev-schedule";

/** Dipakai untuk membatalkan transaksi hapus ketika laporan masuk di tengah jalan. */
class LaporanMasukError extends Error {
  constructor(public readonly jumlah: number) {
    super(`Periode sudah memiliki ${jumlah} laporan`);
    this.name = "LaporanMasukError";
  }
}

function generateLabel(
  tahunAkademik: number,
  semester: "Gasal" | "Genap"
): string {
  return `Monev KIP-K Undip Semester ${semester} ${tahunAkademik}/${tahunAkademik + 1}`;
}

function normalizeRow(data: {
  id: string;
  label: string;
  waktu_mulai: Date | null;
  deadline: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date | null;
  tahun_akademik: number;
  semester: string;
}) {
  return {
    id:             data.id,
    label:          data.label,
    waktu_mulai:    data.waktu_mulai?.toISOString() ?? null,
    deadline:       data.deadline.toISOString(),
    is_active:      data.is_active,
    created_at:     data.created_at.toISOString(),
    updated_at:     data.updated_at?.toISOString() ?? null,
    tahun_akademik: data.tahun_akademik,
    semester:       data.semester,
  };
}

// PATCH /api/admin/monev/schedule/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Pelaku perubahan diambil dari sesi, bukan dari body — body bisa
    // dipalsukan. null = perubahan oleh sistem.
    const sesi = await getSesiAdmin();
    const adminId: string | null = sesi?.id ?? null;
    const catatan: string | null = body.catatan ?? null;

    // Ambil data periode saat ini + jumlah laporan (satu query)
    const [current, laporanCount] = await Promise.all([
      prisma.periode_monev.findUnique({ where: { id } }),
      prisma.pengisian_monev.count({ where: { periode_monev_id: id } }),
    ]);

    if (!current) {
      return NextResponse.json(
        { error: "Periode tidak ditemukan" },
        { status: 404 }
      );
    }

    // Optimistic concurrency check
    if (
      body.updated_at !== undefined &&
      current.updated_at?.toISOString() !== body.updated_at
    ) {
      return NextResponse.json(
        { error: "Data sudah diubah oleh admin lain. Muat ulang halaman." },
        { status: 409 }
      );
    }

    const now = new Date();
    const status = getOperationalStatus(
      { ...current, jumlah_laporan: laporanCount },
      now
    );

    // Validasi aturan edit
    const validationError = validateScheduleChange(
      status,
      {
        waktu_mulai: body.waktu_mulai,
        deadline:    body.deadline,
      },
      current
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 422 });
    }

    // Bangun payload update
    const updateData: Record<string, unknown> = { updated_at: now };

    if (body.is_active !== undefined)   updateData.is_active   = body.is_active;
    if (body.waktu_mulai !== undefined) updateData.waktu_mulai = body.waktu_mulai;
    if (body.deadline !== undefined)    updateData.deadline    = body.deadline;

    // Jika tahun/semester berubah, regenerate label + cek duplikasi
    if (body.tahun_akademik !== undefined || body.semester !== undefined) {
      const tahun = (body.tahun_akademik ?? current.tahun_akademik) as number;
      const sem   = (body.semester ?? current.semester) as "Gasal" | "Genap";

      if (tahun && sem) {
        const dup = await prisma.periode_monev.findFirst({
          where: {
            tahun_akademik: tahun,
            semester:       sem,
            NOT:            { id },
          },
        });
        if (dup) {
          return NextResponse.json(
            { error: "Kombinasi tahun akademik dan semester sudah digunakan periode lain." },
            { status: 409 }
          );
        }
        updateData.tahun_akademik = tahun;
        updateData.semester       = sem;
        updateData.label          = generateLabel(tahun, sem);
      }
    }

    // Validasi waktu_mulai < deadline (nilai final)
    const finalWaktuMulai = body.waktu_mulai ?? current.waktu_mulai;
    const finalDeadline   = body.deadline    ?? current.deadline;
    if (finalWaktuMulai && new Date(finalWaktuMulai) >= new Date(finalDeadline)) {
      return NextResponse.json(
        { error: "Batas pengisian harus setelah waktu mulai" },
        { status: 400 }
      );
    }

    // Jika BUKA_KEMBALI, sekaligus aktifkan periode
    const tipe = determineTipePerubahan(status, body, current);
    if (tipe === "BUKA_KEMBALI") {
      updateData.is_active = true;
    }

    // Transaksi: update periode + simpan riwayat
    const [updated] = await prisma.$transaction([
      prisma.periode_monev.update({
        where: { id },
        data: updateData as Parameters<typeof prisma.periode_monev.update>[0]["data"],
      }),
      prisma.riwayat_jadwal_monev.create({
        data: {
          periode_monev_id: id,
          admin_id:         adminId,
          tipe_perubahan:   tipe,
          waktu_mulai_lama: current.waktu_mulai,
          waktu_mulai_baru: body.waktu_mulai !== undefined
            ? (body.waktu_mulai ? new Date(body.waktu_mulai) : null)
            : current.waktu_mulai,
          deadline_lama:    current.deadline,
          deadline_baru:    body.deadline ? new Date(body.deadline) : current.deadline,
          is_active_lama:   current.is_active,
          is_active_baru:   (updateData.is_active as boolean | undefined) ?? current.is_active,
          catatan,
        },
      }),
    ]);

    return NextResponse.json({ data: normalizeRow(updated) });
  } catch (err) {
    console.error("[PATCH /api/admin/monev/schedule/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal update periode" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monev/schedule/[id]
// Hanya boleh dihapus jika tidak ada laporan yang sudah disubmit.
//
// Baris anak ikut dihapus secara eksplisit, bukan lewat ON DELETE CASCADE:
//   - riwayat_jadwal_monev punya FK ON DELETE RESTRICT supaya audit trail
//     tidak bisa hilang diam-diam dari sisi DB
//   - log_notifikasi punya FK NO ACTION
// Keduanya memblokir DELETE. Untuk periode tanpa satu pun laporan, riwayat
// jadwalnya hanya mencatat jadwal yang belum pernah mengumpulkan data, jadi
// menghapusnya bersama periode tidak menghilangkan jejak yang berarti.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const periode = await prisma.periode_monev.findUnique({
      where:  { id },
      select: { id: true },
    });

    if (!periode) {
      return NextResponse.json(
        { error: "Periode tidak ditemukan" },
        { status: 404 }
      );
    }

    const laporanCount = await prisma.pengisian_monev.count({
      where: { periode_monev_id: id },
    });

    if (laporanCount > 0) {
      return NextResponse.json(
        {
          error: `Periode tidak dapat dihapus karena sudah ada ${laporanCount} laporan yang dikirim. Nonaktifkan periode ini sebagai gantinya.`,
        },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Hitung ulang di dalam transaksi — mahasiswa bisa submit di antara
      // pengecekan di atas dan penghapusan di bawah.
      const laporanTerkini = await tx.pengisian_monev.count({
        where: { periode_monev_id: id },
      });

      if (laporanTerkini > 0) {
        throw new LaporanMasukError(laporanTerkini);
      }

      await tx.riwayat_jadwal_monev.deleteMany({
        where: { periode_monev_id: id },
      });
      await tx.log_notifikasi.deleteMany({
        where: { periode_monev_id: id },
      });
      await tx.periode_monev.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof LaporanMasukError) {
      return NextResponse.json(
        {
          error: `Periode tidak dapat dihapus karena baru saja masuk ${err.jumlah} laporan. Muat ulang halaman.`,
        },
        { status: 409 }
      );
    }

    console.error("[DELETE /api/admin/monev/schedule/[id]]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal hapus periode" },
      { status: 500 }
    );
  }
}
