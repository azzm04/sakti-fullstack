-- ============================================================================
-- Pengamanan data fitur Pengingat Monev Telegram — PRD v2.1 K8 & §8
-- Jalankan manual di Supabase SQL Editor (BUKAN lewat prisma migrate dev).
-- Aman dijalankan ulang.
-- ============================================================================

-- 0. Cek kondisi saat ini (jalankan dulu, catat hasilnya)
select relname, relrowsecurity
from pg_class
where relname in ('token_aktivasi_telegram', 'penerima_kipk', 'log_notifikasi', 'periode_monev')
  and relkind = 'r';

-- 1. Aktifkan RLS TANPA policy untuk anon/authenticated → akses lewat REST
--    Supabase dengan anon key ditolak. Prisma (role pemilik tabel, biasanya
--    postgres) dan service role tetap bisa mengakses karena keduanya
--    melewati RLS. Pastikan kolom tableowner di query berikut = role yang
--    dipakai DATABASE_URL; kalau berbeda, Prisma akan ikut terblokir.
select tablename, tableowner from pg_tables
where tablename in ('token_aktivasi_telegram', 'penerima_kipk', 'log_notifikasi', 'periode_monev');

alter table public.token_aktivasi_telegram enable row level security;
alter table public.penerima_kipk           enable row level security;
alter table public.log_notifikasi          enable row level security;
alter table public.periode_monev           enable row level security;

-- 2. Format kode aktivasi berubah (sekarang hash SHA-256). Token lama
--    tidak bisa dipakai lagi, jadi bersihkan.
delete from public.token_aktivasi_telegram;

-- 3. Satu akun Telegram hanya boleh terhubung ke satu mahasiswa.
--    Cek duplikat dulu; jika query ini mengembalikan baris, bereskan
--    datanya sebelum membuat index.
select telegram_id, count(*)
from public.penerima_kipk
where telegram_id is not null
group by telegram_id
having count(*) > 1;

create unique index if not exists uq_penerima_kipk_telegram_id
  on public.penerima_kipk (telegram_id)
  where telegram_id is not null;

-- 4. Verifikasi
select relname, relrowsecurity
from pg_class
where relname in ('token_aktivasi_telegram', 'penerima_kipk', 'log_notifikasi', 'periode_monev')
  and relkind = 'r';
