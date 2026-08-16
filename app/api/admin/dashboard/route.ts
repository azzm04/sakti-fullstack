import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getDashboardStats } from "@/lib/dashboard-stats";

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN_DIRMAWA") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error("[GET /api/admin/dashboard]", err);
    return NextResponse.json(
      {
        error: "Gagal mengambil data dashboard",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
