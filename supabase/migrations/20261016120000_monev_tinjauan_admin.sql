-- Monev: penutupan + finalisasi periode, tinjauan admin
-- PRD: .kiro/specs/monev-alur-terpadu/prd.md §10
--
-- Prinsip: hanya fakta yang tidak bisa dihitung yang disimpan.
--   E1 (penghasilan > Rp 4 jt dan per kapita > Rp 750 rb) dan
--   E3 (tidak mengisi sampai periode ditutup) dihitung, tidak disimpan.
--   Hasil AI tetap di pengisian_monev.hasil_scan_ai / hasil_deteksi_yolo.
--
-- Idempotent: aman dijalankan ulang. Jalankan dalam satu transaksi.

BEGIN;

-- ── 1. Penutupan dan finalisasi periode ────────────────────────────
-- ditutup_at     : pengisian berhenti; E3 (tidak mengisi) menjadi pasti.
-- difinalisasi_at: hasil evaluasi dikunci dan tampil di portal mahasiswa.
-- Di antara keduanya admin meninjau laporan. NULL = belum terjadi.
-- Siapa pelakunya dicatat di riwayat_jadwal_monev ('TUTUP' / 'FINALISASI').
ALTER TABLE periode_monev
  ADD COLUMN IF NOT EXISTS ditutup_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS difinalisasi_at TIMESTAMPTZ;

-- Finalisasi hanya setelah periode ditutup.
ALTER TABLE periode_monev
  DROP CONSTRAINT IF EXISTS periode_monev_finalisasi_check;
ALTER TABLE periode_monev
  ADD CONSTRAINT periode_monev_finalisasi_check
  CHECK (difinalisasi_at IS NULL OR (ditutup_at IS NOT NULL AND difinalisasi_at >= ditutup_at));

-- ── 2. Tipe riwayat 'TUTUP' dan 'FINALISASI' ───────────────────────
-- Ditulis ulang utuh agar identik di semua environment.
ALTER TABLE riwayat_jadwal_monev
  DROP CONSTRAINT IF EXISTS riwayat_jadwal_monev_tipe_perubahan_check;

ALTER TABLE riwayat_jadwal_monev
  ADD CONSTRAINT riwayat_jadwal_monev_tipe_perubahan_check
  CHECK (tipe_perubahan IN (
    'JADWAL_BARU',       -- periode pertama dibuat
    'UBAH_WAKTU_MULAI',  -- waktu_mulai diubah (sebelum periode dimulai)
    'UBAH_DEADLINE',     -- deadline diubah (sebelum periode dimulai)
    'UBAH_JADWAL',       -- hanya metadata periode yang berubah
    'PERPANJANGAN',      -- deadline diperpanjang saat periode berjalan
    'BUKA_KEMBALI',      -- periode berakhir dibuka kembali + diperpanjang
    'AKTIFKAN',          -- is_active: false -> true, jadwal tidak berubah
    'NONAKTIFKAN',       -- is_active: true -> false, jadwal tidak berubah
    'TUTUP',             -- periode ditutup setelah tenggat; E3 menjadi pasti
    'FINALISASI'         -- hasil evaluasi dikunci dan diumumkan
  ));

-- ── 3. Tinjauan admin pada laporan ─────────────────────────────────
-- Kolom final hanya diisi bila admin mengoreksi; NULL = pakai isian
-- mahasiswa. Isian asli mahasiswa tidak pernah ditimpa.
ALTER TABLE pengisian_monev
  ADD COLUMN IF NOT EXISTS penghasilan_final BIGINT,       -- gabungan ayah + ibu + lain
  ADD COLUMN IF NOT EXISTS anggota_final     INTEGER,      -- untuk per kapita
  ADD COLUMN IF NOT EXISTS catatan_admin     TEXT,
  ADD COLUMN IF NOT EXISTS ditinjau_oleh     UUID,
  ADD COLUMN IF NOT EXISTS ditinjau_at       TIMESTAMPTZ;

-- SET NULL: tinjauan tetap ada walau akun admin dihapus.
ALTER TABLE pengisian_monev
  DROP CONSTRAINT IF EXISTS pengisian_monev_ditinjau_oleh_fkey;
ALTER TABLE pengisian_monev
  ADD CONSTRAINT pengisian_monev_ditinjau_oleh_fkey
  FOREIGN KEY (ditinjau_oleh) REFERENCES admin_users(id)
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE pengisian_monev
  DROP CONSTRAINT IF EXISTS pengisian_monev_penghasilan_final_check;
ALTER TABLE pengisian_monev
  ADD CONSTRAINT pengisian_monev_penghasilan_final_check
  CHECK (penghasilan_final IS NULL OR penghasilan_final >= 0);

ALTER TABLE pengisian_monev
  DROP CONSTRAINT IF EXISTS pengisian_monev_anggota_final_check;
ALTER TABLE pengisian_monev
  ADD CONSTRAINT pengisian_monev_anggota_final_check
  CHECK (anggota_final IS NULL OR anggota_final > 0);

-- Koreksi wajib punya alasan dan waktu tinjauan.
ALTER TABLE pengisian_monev
  DROP CONSTRAINT IF EXISTS pengisian_monev_koreksi_check;
ALTER TABLE pengisian_monev
  ADD CONSTRAINT pengisian_monev_koreksi_check
  CHECK (
    (penghasilan_final IS NULL AND anggota_final IS NULL)
    OR (catatan_admin IS NOT NULL AND btrim(catatan_admin) <> '' AND ditinjau_at IS NOT NULL)
  );

-- Antrean tinjauan: laporan per periode yang belum ditinjau.
CREATE INDEX IF NOT EXISTS idx_pengisian_monev_periode_ditinjau
  ON pengisian_monev(periode_monev_id, ditinjau_at);

-- ── 4. Alasan penangguhan yang ditetapkan manual (E2, E4) ──────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alasan_manual_monev') THEN
    CREATE TYPE alasan_manual_monev AS ENUM ('E2', 'E4');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS alasan_penangguhan_monev (
  pengisian_monev_id UUID                NOT NULL
    REFERENCES pengisian_monev(id) ON DELETE CASCADE,
  kode               alasan_manual_monev NOT NULL,
  catatan            TEXT                NOT NULL CHECK (btrim(catatan) <> ''),
  PRIMARY KEY (pengisian_monev_id, kode)
);

-- Hanya diakses server (service role / koneksi langsung). Tanpa policy,
-- anon dan authenticated tidak bisa membaca atau menulis.
ALTER TABLE alasan_penangguhan_monev ENABLE ROW LEVEL SECURITY;

COMMIT;
