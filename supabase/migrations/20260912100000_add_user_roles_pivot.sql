-- Pivot many-to-many untuk role user — menggantikan users.role sebagai
-- sumber kebenaran otorisasi. Diperlukan karena satu user (mis. mahasiswa
-- KIP-K yang direkrut jadi pewawancara) sekarang bisa punya >1 role
-- sekaligus. Sesi login tetap membawa SATU role aktif (dipilih user saat
-- login jika >1 role tersedia) — lihat app/api/auth/verify-otp/route.ts
-- dan app/api/auth/select-role/route.ts.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role       role_enum NOT NULL,
  created_at timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);

-- Backfill dari kolom scalar users.role yang sudah ada
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- users.role dipertahankan sementara sebagai legacy fallback (dihapus di
-- migrasi terpisah setelah masa observasi produksi), tapi bukan lagi
-- sumber kebenaran — kode aplikasi berhenti mengisinya untuk user baru.
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;

-- Bersihkan duplikasi enum Role vs role_enum. sso_whitelist (satu-satunya
-- pemakai tipe "Role") sudah dead code total — tidak ada kode .ts yang
-- baca/tulis tabel ini lagi (lihat komentar di
-- app/api/admin/pewawancara/[id]/route.ts:3).
ALTER TABLE public.sso_whitelist ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.sso_whitelist
  ALTER COLUMN role TYPE role_enum USING role::text::role_enum;
ALTER TABLE public.sso_whitelist ALTER COLUMN role SET DEFAULT 'MAHASISWA_KIPK';
DROP TYPE IF EXISTS "Role";
