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

export interface MahasiswaKipk {
  id: string; // users.id (uuid) — identitas stabil terlepas apakah profil penerima_kipk sudah ada
  email_sso: string;
  status_akun: string;
  created_at: string;
  penerima_kipk: {
    id: string;
    nim: string | null;
    nama: string | null;
    angkatan: number | null;
    // prodi_id sudah foreign key ke tabel `prodi` (lookup), bukan teks bebas —
    // tabel itu masih kosong di skema saat ini, jadi ini read-only sampai
    // ada UI pemilih prodi yang sesuai.
    prodi: { id: string; nama_prodi: string | null; fakultas: string | null } | null;
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
  id: number;
  kuota_ke: number;
  claimed_at: string;
  pewawancara_id: number;
  pewawancara: { nama: string; email: string } | null;
}

export type WawancaraTab = "daftar" | "sesi";
