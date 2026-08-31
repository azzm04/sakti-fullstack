import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("sakti_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload.sub ?? payload.id) as string;

    const { searchParams } = new URL(req.url);
    const periodeId = searchParams.get("periode_id");

    if (!periodeId) {
      return NextResponse.json(
        { error: "Parameter periode_id wajib diisi" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pengisian_monev")
      .select("*")
      .eq("user_id", userId)
      .eq("periode_monev_id", periodeId)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return NextResponse.json({
        submitted: true,
        data: {
          pekerjaan_ayah: data.pekerjaan_ayah,
          penghasilan_ayah: data.penghasilan_ayah,
          pekerjaan_ibu: data.pekerjaan_ibu,
          penghasilan_ibu: data.penghasilan_ibu,
          penghasilan_lain: data.penghasilan_lain,
          jumlah_tanggungan: data.jumlah_tanggungan,
          waktu_lapor: data.waktu_lapor,
        },
      });
    }

    return NextResponse.json({ submitted: false });
  } catch (err) {
    console.error("[GET /api/monev/check-submission]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal cek submission" },
      { status: 500 }
    );
  }
}
