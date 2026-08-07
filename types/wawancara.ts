export interface Pewawancara {
  id: number;
  user_id: string;
  admin_id: string;
  nama: string;
  total_assigned: number;
  total_completed: number;
  created_at: string;
  users: {
    id: string;
    email_sso: string;
    status_akun: string;
  };
}

export interface Sesi {
  id: number;
  tanggal: string;
  kuota_pewawancara: number;
  kuota_mahasiswa: number;
  war_aktif: boolean;
  war_dibuka_at: string | null;
  war_ditutup_at: string | null;
  distribusi_done: boolean;
}

export interface KuotaItem {
  id: number;
  kuota_ke: number;
  claimed_at: string;
  pewawancara_id: number;
  pewawancara: { nama: string; email: string } | null;
}

export type WawancaraTab = "daftar" | "sesi";
