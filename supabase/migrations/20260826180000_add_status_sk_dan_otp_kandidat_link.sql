-- Status penetapan SK resmi (pasca ACC pimpinan + DIKTI) per kandidat,
-- terpisah dari hasil_wawancara.hasil_akhir (rekomendasi internal kita) dan
-- hasil_wawancara.status_final (hasil filtering kuota UM/SBUB).
ALTER TABLE kandidat ADD COLUMN nim_resmi varchar(20);
ALTER TABLE kandidat ADD COLUMN status_sk varchar(30);

-- Menghubungkan OTP verification generik (dipakai semua role) balik ke
-- kandidat spesifik, supaya /api/auth/verify-otp tahu kapan harus membuat
-- baris penerima_kipk tanpa mengganggu alur login role lain.
ALTER TABLE otp_tokens ADD COLUMN kandidat_id uuid REFERENCES kandidat(id) ON DELETE SET NULL;
