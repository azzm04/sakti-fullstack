import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getDiusulkanPool } from "@/lib/penetapan-sk-pool";
import { tetapkanStatusSk } from "@/lib/status-sk";
import { JALUR_KEYS, type JalurKey } from "@/lib/jalur";
import { z } from "zod";

// GET — pool kandidat "lolos akhir" (Diusulkan, dan utk UM/SBUB sudah Lolos
// Kuota) untuk tahun+jalur terpilih. Dipakai tabel bulk-editor di tab
// "Penetapan SK".
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tahunParam = searchParams.get("tahun");
    const jalurParam = searchParams.get("jalur") ?? "";

    const tahun = Number(tahunParam);
    if (!tahunParam || Number.isNaN(tahun)) {
      return NextResponse.json({ error: "Parameter tahun wajib diisi" }, { status: 400 });
    }

    const jalurKeys = jalurParam
      .split(",")
      .map((k) => k.trim())
      .filter((k): k is JalurKey => (JALUR_KEYS as readonly string[]).includes(k));

    if (jalurKeys.length === 0) {
      return NextResponse.json({ error: "Parameter jalur wajib diisi" }, { status: 400 });
    }

    const data = await getDiusulkanPool(tahun, jalurKeys);
    return NextResponse.json({ data, total: data.length });
  } catch (err) {
    console.error("[GET /api/admin/hasil-akhir/penetapan-sk]", err);
    return NextResponse.json(
      { error: "Gagal mengambil data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

const ItemSchema = z.object({
  kandidat_id: z.string().uuid(),
  nim_resmi: z.string().trim().optional().nullable(),
  status_sk: z.enum(["Ditetapkan", "Tidak Ditetapkan"]),
});
const BodySchema = z.object({ items: z.array(ItemSchema).min(1) });

// POST — simpan hasil penetapan SK secara massal (hanya baris yang benar-benar
// disentuh admin di tabel bulk-editor, bukan seluruh pool).
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Payload tidak valid" },
        { status: 400 },
      );
    }

    const aktor = admin.nama || "Admin Dirmawa";
    let berhasil = 0;
    const gagal: { kandidat_id: string; error: string }[] = [];

    for (const item of parsed.data.items) {
      const result = await tetapkanStatusSk(item.kandidat_id, item.status_sk, item.nim_resmi, aktor);
      if (result.ok) berhasil++;
      else gagal.push({ kandidat_id: item.kandidat_id, error: result.error });
    }

    return NextResponse.json({ berhasil, gagal });
  } catch (err) {
    console.error("[POST /api/admin/hasil-akhir/penetapan-sk]", err);
    return NextResponse.json(
      { error: "Gagal menyimpan data", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
