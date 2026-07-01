-- Add a UUID identifier for admin users while keeping the legacy text id column.
-- The application will use uuid_id for auth and import ownership.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public."admin_users"
  ADD COLUMN IF NOT EXISTS "uuid_id" uuid;

UPDATE public."admin_users"
SET "uuid_id" = gen_random_uuid()
WHERE "uuid_id" IS NULL;

ALTER TABLE public."admin_users"
  ALTER COLUMN "uuid_id" SET DEFAULT gen_random_uuid();

ALTER TABLE public."admin_users"
  ALTER COLUMN "uuid_id" SET NOT NULL;

ALTER TABLE public."admin_users"
  DROP CONSTRAINT IF EXISTS "admin_users_pkey";

ALTER TABLE public."admin_users"
  ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("uuid_id");

CREATE UNIQUE INDEX IF NOT EXISTS "admin_users_id_key"
  ON public."admin_users" ("id");