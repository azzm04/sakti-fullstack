-- ============================================================
-- Monev Schedules — tambah kolom yang belum ada
-- Jalankan di Supabase SQL Editor
-- 
-- Struktur tabel saat ini (dari DB):
--   id, label, deadline, "isActive", "createdAt", "updatedAt",
--   tipe_monev, waktu_mulai, updated_at
--
-- Kolom tipe_monev & waktu_mulai sudah ada → tidak perlu ditambah
-- Kolom "isActive", "createdAt", "updatedAt" tetap camelCase (tidak direname)
-- ============================================================

-- Buat ENUM jika belum ada
DO $$ BEGIN
  CREATE TYPE tipe_monev AS ENUM (
    'Evaluasi Ekonomi',
    'Evaluasi Akademik',
    'Evaluasi Sosial',
    'Evaluasi Akhir'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tambah kolom yang mungkin belum ada
ALTER TABLE monev_schedules
  ADD COLUMN IF NOT EXISTS tipe_monev  tipe_monev NOT NULL DEFAULT 'Evaluasi Ekonomi',
  ADD COLUMN IF NOT EXISTS waktu_mulai TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMPTZ DEFAULT NOW();

-- Disable RLS
ALTER TABLE monev_schedules   DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs DISABLE ROW LEVEL SECURITY;
