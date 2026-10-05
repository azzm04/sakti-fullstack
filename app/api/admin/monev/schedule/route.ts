import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSesiAdmin } from "@/lib/auth/sesi-admin";

function generateLabel(
  tahunAkademik: number,
  semester: "Gasal" | "Genap"
): string {
  return `Monev KIP-K Undip Semester ${semester} ${tahunAkademik}/${tahunAkademik + 1}`;
}

// GET /api/admin/monev/schedule
export async function GET() {
  try {
    const rows = await prisma.periode_monev.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id:             true,
        label:          true,
        waktu_mulai:    true,
        deadline:       true,
        is_active:      true,
        created_at:     true,
        updated_at:     true,
        tahun_akademik: true,
        semester:       true,
        // Jumlah laporan dipakai client untuk menentukan status operasional —
        // periode yang sudah ada laporannya tidak boleh ubah waktu_mulai
        _count: { select: { pengisian_monev: true } },
      },
    });

    const data = rows.map((r) => ({
      id:             r.id,
      label:          r.label,
      waktu_mulai:    r.waktu_mulai?.toISOString() ?? null,
      deadline:       r.deadline.toISOString(),
      is_active:      r.is_active,
      created_at:     r.created_at.toISOString(),
      updated_at:     r.updated_at?.toISOString() ?? null,
      tahun_akademik: r.tahun_akademik,
      semester:       r.semester,
      jumlah_laporan: r._count.pengisian_monev,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/admin/monev/schedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil jadwal" },
      { status: 500 }
    );
  }
}

// POST /api/admin/monev/schedule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tahun_akademik,
      semester,
      waktu_mulai,
      deadline,
      catatan = null,
    } = body as {
      tahun_akademik: number;
      semester: "Gasal" | "Genap";
      waktu_mulai?: string | null;
      deadline: string;
      catatan?: string | null;
    };

    // Pelaku perubahan diambil dari sesi, bukan dari body — body bisa dipalsukan.
    // null = perubahan oleh sistem.
    const sesi = await getSesiAdmin();
    const admin_id = sesi?.id ?? null;

    if (!tahun_akademik || !semester || !deadline) {
      return NextResponse.json(
        { error: "tahun_akademik, semester, dan deadline wajib diisi" },
        { status: 400 }
      );
    }

    if (!["Gasal", "Genap"].includes(semester)) {
      return NextResponse.json(
        { error: "semester harus 'Gasal' atau 'Genap'" },
        { status: 400 }
      );
    }

    if (new Date(deadline) <= new Date()) {
      return NextResponse.json(
        { error: "Batas pengisian harus di masa depan" },
        { status: 400 }
      );
    }

    if (waktu_mulai && new Date(waktu_mulai) >= new Date(deadline)) {
      return NextResponse.json(
        { error: "Batas pengisian harus setelah waktu mulai" },
        { status: 400 }
      );
    }

    // Cek duplikasi
    const existing = await prisma.periode_monev.findFirst({
      where: { tahun_akademik, semester },
      select: { id: true, label: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error:          "Periode sudah tersedia untuk kombinasi tahun akademik dan semester ini.",
          existing_id:    existing.id,
          existing_label: existing.label,
        },
        { status: 409 }
      );
    }

    const label    = generateLabel(tahun_akademik, semester);
    const deadlineDate = new Date(deadline);
    const waktuMulaiDate = waktu_mulai ? new Date(waktu_mulai) : null;

    // Satu transaksi: periode + riwayat JADWAL_BARU harus jadi atau gagal
    // bersama, supaya tidak ada periode tanpa jejak audit.
    const created = await prisma.$transaction(async (tx) => {
      const periode = await tx.periode_monev.create({
        data: {
          label,
          tahun_akademik,
          semester,
          waktu_mulai: waktuMulaiDate,
          deadline:    deadlineDate,
          is_active:   true,
          created_at:  new Date(),
        },
      });

      await tx.riwayat_jadwal_monev.create({
        data: {
          periode_monev_id: periode.id,
          admin_id,
          tipe_perubahan:   "JADWAL_BARU",
          waktu_mulai_baru: waktuMulaiDate,
          deadline_baru:    deadlineDate,
          is_active_baru:   true,
          catatan,
        },
      });

      return periode;
    });

    return NextResponse.json(
      {
        data: {
          id:             created.id,
          label:          created.label,
          waktu_mulai:    created.waktu_mulai?.toISOString() ?? null,
          deadline:       created.deadline.toISOString(),
          is_active:      created.is_active,
          created_at:     created.created_at.toISOString(),
          updated_at:     created.updated_at?.toISOString() ?? null,
          tahun_akademik: created.tahun_akademik,
          semester:       created.semester,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/monev/schedule]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat periode" },
      { status: 500 }
    );
  }
}
