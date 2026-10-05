-- Monev: riwayat perubahan jadwal + anti-duplikasi reminder
--
-- Tabel riwayat_jadwal_monev sudah dibuat manual di environment yang
-- berjalan sekarang. Blok CREATE di bawah memakai IF NOT EXISTS supaya
-- environment baru (lokal/staging) ikut terbentuk sama, dan supaya skema
-- ini punya catatan tertulis.

-- ── 1. Tabel riwayat perubahan jadwal ──────────────────────────────
CREATE TABLE IF NOT EXISTS riwayat_jadwal_monev (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- RESTRICT, bukan CASCADE: riwayat adalah audit trail dan tidak boleh
  -- hilang hanya karena periodenya dihapus.
  periode_monev_id UUID        NOT NULL REFERENCES periode_monev(id) ON DELETE RESTRICT,
  -- NULL = perubahan oleh sistem (cron), atau admin yang sudah dihapus.
  admin_id         UUID        REFERENCES admin_users(id) ON DELETE SET NULL,
  tipe_perubahan   VARCHAR(30) NOT NULL,
  waktu_mulai_lama TIMESTAMPTZ,
  waktu_mulai_baru TIMESTAMPTZ,
  deadline_lama    TIMESTAMPTZ,
  deadline_baru    TIMESTAMPTZ,
  is_active_lama   BOOLEAN,
  is_active_baru   BOOLEAN,
  catatan          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_riwayat_jadwal_periode
  ON riwayat_jadwal_monev(periode_monev_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_riwayat_jadwal_admin
  ON riwayat_jadwal_monev(admin_id, created_at DESC);

-- ── 2. Daftar tipe_perubahan yang sah ──────────────────────────────
-- Ditulis ulang (bukan hanya ditambah) agar environment lama dan baru
-- punya constraint yang identik. 'UBAH_JADWAL' adalah fallback untuk
-- perubahan metadata periode (tahun akademik / semester / label) yang
-- tidak menyentuh waktu_mulai maupun deadline.
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
    'NONAKTIFKAN'        -- is_active: true -> false, jadwal tidak berubah
  ));

-- ── 3. Anti-duplikasi reminder saat deadline diperpanjang ──────────
-- Cek "sentAt >= awal hari ini" tidak cukup: kalau deadline diperpanjang,
-- H-7 yang sama bisa muncul lagi di tanggal berbeda dan reminder terkirim
-- dua kali. deadline_snapshot merekam deadline yang berlaku saat log
-- dibuat, sehingga tiap "versi" deadline punya barisnya sendiri.
ALTER TABLE log_notifikasi
  ADD COLUMN IF NOT EXISTS deadline_snapshot TIMESTAMPTZ;

-- Baris lama (jika ada) diisi dari deadline periodenya yang berlaku
-- sekarang, supaya unique index di bawah bisa dibuat.
UPDATE log_notifikasi l
   SET deadline_snapshot = p.deadline
  FROM periode_monev p
 WHERE p.id = l.periode_monev_id
   AND l.deadline_snapshot IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_log_notifikasi_periode_trigger_deadline
  ON log_notifikasi(periode_monev_id, "triggerDay", deadline_snapshot);
