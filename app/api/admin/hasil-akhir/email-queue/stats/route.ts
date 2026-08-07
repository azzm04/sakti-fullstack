import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("email_queue")
      .select("status");

    if (error) throw error;

    const rows   = data ?? [];
    const total   = rows.length;
    const queued  = rows.filter((r) => r.status === "queued").length;
    const sent    = rows.filter((r) => r.status === "sent").length;
    const failed  = rows.filter((r) => r.status === "failed").length;

    return NextResponse.json({ total, queued, sent, failed });
  } catch (err) {
    return NextResponse.json({ error: "Gagal mengambil stats" }, { status: 500 });
  }
}
