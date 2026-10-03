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
    user_roles?: { role: string }[];
  };
}

export interface Prodi {
  id: string;
  nama_prodi: string;
  fakultas: string | null;
}

export interface MahasiswaKipk {
  id: string; // users.id (uuid)
  email_sso: string;
  status_akun: string;
  created_at: string;
  roles: string[];
  penerima_kipk: {
    id: string;
    nim: string | null;
    nama: string | null;
    angkatan: number | null;
    prodi: {
      id: string;
      nama_prodi: string | null;
      fakultas: string | null;
    } | null;
  } | null;
}

export type DaftarPenggunaRole = "pewawancara" | "mahasiswa";

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
  id: string;
  kuota_ke: number;
  claimed_at: string;
  pewawancara_id: string;
  pewawancara: { nama: string; user: { email_sso: string } | null } | null;
}

export type WawancaraTab = "daftar" | "sesi";
