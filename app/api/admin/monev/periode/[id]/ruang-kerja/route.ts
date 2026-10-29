import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/auth-server";
import { getPeriodeRuangKerja } from "@/lib/monev/ruang-kerja-data";
import { langkahBawaan, statusLangkah } from "@/lib/monev/ruang-kerja";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminRole();
  const { id } = await params;
  try {
    const periods = await getPeriodeRuangKerja();
    const periode = periods.find((p) => p.id === id);
    if (!periode) return NextResponse.json({ error: "Periode tidak ditemukan" }, { status: 404 });
    return NextResponse.json({ data: {
      periode, periods: periods.map(({ id, label }) => ({ id, label })),
      langkahBawaan: langkahBawaan(periode), langkah: statusLangkah(periode),
    } });
  } catch (error) {
    console.error("[monev/ruang-kerja]", error);
    return NextResponse.json({ error: "Gagal memuat ruang kerja Monev" }, { status: 500 });
  }
}
