-- Link verifikasi personal & sekali pakai untuk /verify-kandidat — token
-- digenerate otomatis saat kandidat.status_sk = 'Ditetapkan' (lihat
-- lib/status-sk.ts), dan dikunci (verifikasi_token_used_at terisi) begitu
-- registrasi benar-benar sukses (lihat lib/penerima-kipk.ts).
ALTER TABLE kandidat ADD COLUMN verifikasi_token varchar(64) UNIQUE;
ALTER TABLE kandidat ADD COLUMN verifikasi_token_used_at timestamptz;
