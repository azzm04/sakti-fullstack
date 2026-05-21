import { supabaseAdmin } from "@/lib/supabase";
import MonevClient from "@/components/admin/monev/MonevClient";

export interface MonevSchedule {
  id: string;
  tipe_monev: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

async function getInitialSchedules(): Promise<MonevSchedule[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("monev_schedules")
      .select(`id, tipe_monev, label, waktu_mulai, deadline, "isActive", "createdAt", updated_at`)
      .order('"createdAt"', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      tipe_monev: row.tipe_monev,
      label: row.label,
      waktu_mulai: row.waktu_mulai,
      deadline: row.deadline,
      is_active: row["isActive"],
      created_at: row["createdAt"],
    }));
  } catch (err) {
    console.error("[Server] getInitialSchedules error:", err);
    return [];
  }
}

export default async function AdminMonevPage() {
  const initialSchedules = await getInitialSchedules();

  return <MonevClient initialSchedules={initialSchedules} />;
}
