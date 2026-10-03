-- 1. Kolom baru
ALTER TABLE "aduan"
  ADD COLUMN "email_pelapor"     VARCHAR(150),
  ADD COLUMN "pernyataan_setuju" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "disetujui_pada"    TIMESTAMP(6);

-- 2. Hapus kolom bukti lama
ALTER TABLE "aduan" DROP COLUMN "url_bukti";

-- 3. text -> uuid
ALTER TABLE "aduan" ALTER COLUMN "id"       SET DATA TYPE UUID USING "id"::uuid;
ALTER TABLE "aduan" ALTER COLUMN "user_id"  SET DATA TYPE UUID USING "user_id"::uuid;
ALTER TABLE "aduan" ALTER COLUMN "admin_id" SET DATA TYPE UUID USING "admin_id"::uuid;

-- 4. Presisi waktu
ALTER TABLE "aduan" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(6);

-- 5. Index
CREATE INDEX "aduan_user_id_idx"  ON "aduan"("user_id");
CREATE INDEX "aduan_admin_id_idx" ON "aduan"("admin_id");

-- 6. Foreign key
ALTER TABLE "aduan"
  ADD CONSTRAINT "aduan_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "aduan"
  ADD CONSTRAINT "aduan_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Tabel bukti_aduan
CREATE TABLE "bukti_aduan" (
  "id"         UUID         NOT NULL,
  "aduan_id"   UUID         NOT NULL,
  "path_file"  TEXT         NOT NULL,
  "nama_file"  VARCHAR(255) NOT NULL,
  "mime_type"  VARCHAR(100) NOT NULL,
  "ukuran"     INTEGER      NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bukti_aduan_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bukti_aduan_aduan_id_idx" ON "bukti_aduan"("aduan_id");

ALTER TABLE "bukti_aduan"
  ADD CONSTRAINT "bukti_aduan_aduan_id_fkey"
  FOREIGN KEY ("aduan_id") REFERENCES "aduan"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. Keamanan
ALTER TABLE "bukti_aduan" ENABLE ROW LEVEL SECURITY;