import { supabaseAdmin } from "@/lib/supabase";
import RiwayatMonevClient from "@/components/mahasiswa/monev/RiwayatMonevClient";

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
      .from("monev_schedules")
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

export default async function RiwayatMonevPage() {
  // ↓ Ini yang membuat halaman jadi SSR:
  //   data di-fetch di server SEBELUM HTML dikirim ke browser
  const schedules = await getSchedules();

  return <RiwayatMonevClient initialSchedules={schedules} />;
}
