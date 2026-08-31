import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { tetapkanStatusSk, NIM_REGEX } from "@/lib/status-sk";
import { z } from "zod";

const BodySchema = z
  .object({
    status_sk: z.enum(["Ditetapkan", "Tidak Ditetapkan"]),
    nim_resmi: z.string().trim().optional().nullable(),
  })
  .refine((v) => v.status_sk !== "Ditetapkan" || (v.nim_resmi && NIM_REGEX.test(v.nim_resmi)), {
    message: "NIM resmi wajib diisi (14 digit angka) untuk status Ditetapkan",
    path: ["nim_resmi"],
  });

// PATCH — tetapkan status SK untuk satu kandidat (dipakai kartu "Penetapan SK"
// di halaman detail Evaluasi). Untuk penetapan massal, lihat
// /api/admin/hasil-akhir/penetapan-sk.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
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

    const result = await tetapkanStatusSk(
      id,
      parsed.data.status_sk,
      parsed.data.nim_resmi,
      admin.nama || "Admin Dirmawa",
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`[PATCH /api/admin/kandidat/${id}/status-sk]`, err);
    return NextResponse.json(
      { error: "Gagal menyimpan status SK", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
