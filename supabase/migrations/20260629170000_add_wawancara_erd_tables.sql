-- Additional ERD tables for the authentication and interview management flow.
-- Assumes the core identity tables use UUID IDs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================================================== 
-- sso_whitelist
-- ========================================================================== 
CREATE TABLE IF NOT EXISTS public.sso_whitelist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  nama varchar(150) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'MAHASISWA_KIPK',
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT sso_whitelist_pkey PRIMARY KEY (id),
  CONSTRAINT sso_whitelist_email_key UNIQUE (email)
);

-- ========================================================================== 
-- users
-- ========================================================================== 
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL,
  nama varchar(150) NOT NULL,
  nim varchar(50) NULL,
  prodi varchar(100) NULL,
  fakultas varchar(100) NULL,
  role varchar(50) NOT NULL,
  telegramId varchar(50) NULL,
  whitelistId uuid NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  updatedAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_nim_key UNIQUE (nim),
  CONSTRAINT users_telegramId_key UNIQUE (telegramId),
  CONSTRAINT users_whitelistId_key UNIQUE (whitelistId),
  CONSTRAINT users_whitelistId_fkey FOREIGN KEY (whitelistId) REFERENCES public.sso_whitelist(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ========================================================================== 
-- otp_tokens
-- ========================================================================== 
CREATE TABLE IF NOT EXISTS public.otp_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  userId uuid NOT NULL,
  code varchar(255) NOT NULL,
  expiresAt timestamp without time zone NOT NULL,
  used boolean NOT NULL DEFAULT false,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT otp_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT otp_tokens_userId_fkey FOREIGN KEY (userId) REFERENCES public.users(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ========================================================================== 
-- admin_users
-- ========================================================================== 
CREATE TABLE IF NOT EXISTS public.admin_users (
  uuid_id uuid NOT NULL DEFAULT gen_random_uuid(),
  id text NOT NULL DEFAULT gen_random_uuid()::text,
  adminId varchar(100) NOT NULL,
  password varchar(255) NOT NULL,
  nama varchar(150) NOT NULL,
  createdAt timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (uuid_id),
  CONSTRAINT admin_users_id_key UNIQUE (id),
  CONSTRAINT admin_users_adminId_key UNIQUE (adminId)
);

-- ========================================================================== 
-- sesi_wawancara
-- ========================================================================== 
CREATE TABLE IF NOT EXISTS public.sesi_wawancara (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tanggal date NOT NULL,
  kuota_pewawancara smallint NOT NULL DEFAULT 20,
  kuota_mahasiswa smallint NOT NULL DEFAULT 0,
  jalur_masuk varchar(50) NULL,
  war_aktif boolean NOT NULL DEFAULT false,
  war_dibuka_at timestamp without time zone NULL,
  war_ditutup_at timestamp without time zone NULL,
  distribusi_done boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT sesi_wawancara_pkey PRIMARY KEY (id),
  CONSTRAINT sesi_wawancara_tanggal_key UNIQUE (tanggal)
);

-- ==========================================================================
-- penerima_kipk
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.penerima_kipk (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lolos_seleksi_id uuid NULL,
  nim varchar(30) NOT NULL,
  nama varchar(150) NOT NULL,
  prodi varchar(100) NOT NULL,
  angkatan smallint NOT NULL,
  telegram_id bigint NULL,
  monev_submitted boolean NOT NULL DEFAULT false,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT penerima_kipk_pkey PRIMARY KEY (id),
  CONSTRAINT penerima_kipk_user_id_key UNIQUE (user_id),
  CONSTRAINT penerima_kipk_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ==========================================================================
-- token_aktivasi_telegram
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.token_aktivasi_telegram (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token varchar(255) NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT token_aktivasi_telegram_pkey PRIMARY KEY (id),
  CONSTRAINT token_aktivasi_telegram_user_id_key UNIQUE (user_id),
  CONSTRAINT token_aktivasi_telegram_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ==========================================================================
-- pewawancara
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.pewawancara (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  user_id uuid NOT NULL,
  email varchar(255) NOT NULL,
  nama varchar(150) NULL,
  is_active boolean NOT NULL DEFAULT true,
  total_assigned smallint NOT NULL DEFAULT 0,
  total_completed smallint NOT NULL DEFAULT 0,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT pewawancara_pkey PRIMARY KEY (id),
  CONSTRAINT pewawancara_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_users(uuid_id) ON DELETE RESTRICT,
  CONSTRAINT pewawancara_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT pewawancara_email_key UNIQUE (email),
  CONSTRAINT pewawancara_user_id_key UNIQUE (user_id),
  CONSTRAINT pewawancara_admin_id_key UNIQUE (admin_id)
);

-- ==========================================================================
-- kuota_pewawancara (operasional) / slot_sesi (ERD naming)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.kuota_pewawancara (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sesi_id uuid NOT NULL,
  pewawancara_id uuid NOT NULL,
  kuota_ke smallint NOT NULL,
  claimed_at timestamp without time zone NULL,
  CONSTRAINT kuota_pewawancara_pkey PRIMARY KEY (id),
  CONSTRAINT kuota_pewawancara_sesi_id_fkey FOREIGN KEY (sesi_id) REFERENCES public.sesi_wawancara(id) ON DELETE CASCADE,
  CONSTRAINT kuota_pewawancara_pewawancara_id_fkey FOREIGN KEY (pewawancara_id) REFERENCES public.pewawancara(id) ON DELETE CASCADE,
  CONSTRAINT kuota_pewawancara_sesi_kuota_key UNIQUE (sesi_id, kuota_ke),
  CONSTRAINT kuota_pewawancara_sesi_pewawancara_key UNIQUE (sesi_id, pewawancara_id)
);

CREATE OR REPLACE VIEW public.slot_sesi AS
SELECT
  id,
  sesi_id,
  pewawancara_id,
  kuota_ke AS slot_ke,
  claimed_at
FROM public.kuota_pewawancara;
