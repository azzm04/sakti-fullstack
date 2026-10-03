-- sso_whitelist sudah tidak dipakai: validasi Mahasiswa KIP-K sekarang lewat
-- tabel kandidat (status SK), pewawancara lewat users + user_roles +
-- pewawancara. Tidak ada FK/view/function yang masih merujuk tabel ini.
DROP TABLE IF EXISTS public.sso_whitelist;
