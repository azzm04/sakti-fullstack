import { supabaseAdmin } from "@/lib/supabase";
import RiwayatMonevClient from "@/components/mahasiswa/monev/RiwayatMonevClient";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

interface MonevSchedule {
  id: string;
  tipe_monev: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

async function getSchedules(): Promise<MonevSchedule[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("periode_monev")
      .select(`id, tipe_monev, label, waktu_mulai, deadline, "isActive", "createdAt"`)
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
    console.error("[Server] getSchedules error:", err);
    return [];
  }
}

async function getSubmittedIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("pengisian_monev")
      .select("periode_monev_id")
      .eq("user_id", userId);

    if (error) throw error;
    return (data ?? []).map(row => row.periode_monev_id);
  } catch (err) {
    console.error("[Server] getSubmittedIds error:", err);
    return [];
  }
}

export default async function RiwayatMonevPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const schedules = await getSchedules();
  const submittedIds = await getSubmittedIds(user.id);

  return <RiwayatMonevClient initialSchedules={schedules} initialSubmittedIds={submittedIds} />;
}
