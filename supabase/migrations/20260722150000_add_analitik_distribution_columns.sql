alter table public.hasil_analitik_dt
  add column if not exists distribusi_jenis_kelamin jsonb,
  add column if not exists distribusi_fakultas jsonb;
