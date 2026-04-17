-- ============================================================
-- SAKTI — SQL Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. import_batch ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS import_batch (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  file_name   TEXT        NOT NULL,
  total_rows  INTEGER     NOT NULL    DEFAULT 0,
  valid_rows  INTEGER     NOT NULL    DEFAULT 0,
  error_rows  INTEGER     NOT NULL    DEFAULT 0,
  dup_rows    INTEGER     NOT NULL    DEFAULT 0
);

-- ── 2. kandidat ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kandidat (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),

  -- Relasi batch
  import_batch_id TEXT REFERENCES import_batch(id) ON DELETE SET NULL,

  -- Identitas & Pendaftaran
  no                    INTEGER NOT NULL DEFAULT 0,
  no_pendaftaran_kipk   TEXT    NOT NULL DEFAULT '',
  nama                  TEXT    NOT NULL DEFAULT '',
  prodi                 TEXT    NOT NULL DEFAULT '',
  nik                   TEXT    NOT NULL DEFAULT '',
  no_kartu_keluarga     TEXT    NOT NULL DEFAULT '',
  nik_kepala_keluarga   TEXT    NOT NULL DEFAULT '',
  nisn                  TEXT    NOT NULL DEFAULT '',

  -- Status Sosial
  status_dtks   TEXT NOT NULL DEFAULT '',
  validasi_dtks TEXT NOT NULL DEFAULT '',
  status_p3ke   TEXT NOT NULL DEFAULT '',
  validasi_p3ke TEXT NOT NULL DEFAULT '',
  no_kip        TEXT NOT NULL DEFAULT '',
  validasi_kip  TEXT NOT NULL DEFAULT '',
  no_kks        TEXT NOT NULL DEFAULT '',

  -- Asal Sekolah
  asal_sekolah      TEXT NOT NULL DEFAULT '',
  kab_kota_sekolah  TEXT NOT NULL DEFAULT '',
  provinsi_sekolah  TEXT NOT NULL DEFAULT '',

  -- Data Diri
  tempat_lahir    TEXT NOT NULL DEFAULT '',
  tanggal_lahir   TEXT NOT NULL DEFAULT '',
  jenis_kelamin   TEXT NOT NULL DEFAULT '',
  alamat_tinggal  TEXT NOT NULL DEFAULT '',
  no_hp           TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL DEFAULT '',
  sosial_media    TEXT NOT NULL DEFAULT '',

  -- Data Ayah
  nama_ayah             TEXT    NOT NULL DEFAULT '',
  pekerjaan_ayah        TEXT    NOT NULL DEFAULT '',
  ket_pekerjaan_ayah    TEXT    NOT NULL DEFAULT '',
  penghasilan_ayah      NUMERIC NOT NULL DEFAULT 0,
  ket_penghasilan_ayah  TEXT    NOT NULL DEFAULT '',
  status_ayah           TEXT    NOT NULL DEFAULT '',

  -- Data Ibu
  nama_ibu              TEXT    NOT NULL DEFAULT '',
  pekerjaan_ibu         TEXT    NOT NULL DEFAULT '',
  ket_pekerjaan_ibu     TEXT    NOT NULL DEFAULT '',
  penghasilan_ibu       NUMERIC NOT NULL DEFAULT 0,
  ket_penghasilan_ibu   TEXT    NOT NULL DEFAULT '',
  status_ibu            TEXT    NOT NULL DEFAULT '',

  -- Ekonomi Keluarga
  wali                        TEXT    NOT NULL DEFAULT '',
  penghasilan_lain            NUMERIC NOT NULL DEFAULT 0,
  jumlah_tanggungan           NUMERIC NOT NULL DEFAULT 0,
  jml_tanggungan_sebenarnya   NUMERIC NOT NULL DEFAULT 0,
  nominal_per_kapita          NUMERIC NOT NULL DEFAULT 0,

  -- Kondisi Tempat Tinggal
  kepemilikan_rumah   TEXT    NOT NULL DEFAULT '',
  tahun_perolehan     TEXT    NOT NULL DEFAULT '',
  sumber_listrik      TEXT    NOT NULL DEFAULT '',
  luas_tanah          NUMERIC NOT NULL DEFAULT 0,
  luas_bangunan       NUMERIC NOT NULL DEFAULT 0,
  sumber_air          TEXT    NOT NULL DEFAULT '',
  mck                 TEXT    NOT NULL DEFAULT '',
  kondisi_rumah       TEXT    NOT NULL DEFAULT '',
  jarak_pusat_kota    NUMERIC NOT NULL DEFAULT 0,

  -- Hasil Wawancara
  prestasi    TEXT NOT NULL DEFAULT '',
  rekomendasi TEXT NOT NULL DEFAULT '',
  alasan      TEXT NOT NULL DEFAULT '',
  pewawancara TEXT NOT NULL DEFAULT '',

  -- Validation flags
  has_errors      BOOLEAN  NOT NULL DEFAULT false,
  missing_fields  TEXT[]   NOT NULL DEFAULT '{}'
);

-- ── 3. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_kandidat_nik            ON kandidat(nik);
CREATE INDEX IF NOT EXISTS idx_kandidat_import_batch   ON kandidat(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_kandidat_nama           ON kandidat(nama);

-- ── 4. Auto-update updated_at ────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_kandidat_updated_at
  BEFORE UPDATE ON kandidat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. RLS (Row Level Security) ──────────────────────────────
-- Aktifkan RLS — service_role key bypass otomatis
ALTER TABLE import_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE kandidat     ENABLE ROW LEVEL SECURITY;

-- Policy: hanya service_role yang bisa insert/update/delete
-- (anon key hanya bisa SELECT jika diperlukan)
CREATE POLICY "service_role_all_import_batch"
  ON import_batch FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_kandidat"
  ON kandidat FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);
