-- Jalur UM & SBUB: kolom Golongan UKT (import) dan tahap filtering kuota
-- pasca-wawancara (kondisi_orang_tua, status_final, ranking_kuota).
ALTER TABLE kandidat ADD COLUMN golongan_ukt smallint;
ALTER TABLE hasil_wawancara ADD COLUMN kondisi_orang_tua varchar(30);
ALTER TABLE hasil_wawancara ADD COLUMN status_final varchar(30);
ALTER TABLE hasil_wawancara ADD COLUMN ranking_kuota integer;
