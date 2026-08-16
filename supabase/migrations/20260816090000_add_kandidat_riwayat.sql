-- 1) Kolom yang hilang di public.hasil_wawancara setelah migrasi ke skema UUID.
--    Kolom-kolom ini masih ada di hasil_wawancara_lama dan MASIH dikirim oleh form
--    wawancara pewawancara (components/pewawancara/detail/FormObservasi.tsx) —
--    tanpa kolom ini datanya diterima FE tapi hilang diam-diam saat disimpan.
ALTER TABLE public.hasil_wawancara
  ADD COLUMN IF NOT EXISTS validasi_kks boolean,
  ADD COLUMN IF NOT EXISTS validasi_kip boolean,
  ADD COLUMN IF NOT EXISTS validasi_sktm boolean,
  ADD COLUMN IF NOT EXISTS aset text,
  ADD COLUMN IF NOT EXISTS kondisi_rumah varchar(60);

COMMENT ON COLUMN public.hasil_wawancara.validasi_kks IS
  'Kepemilikan KKS terverifikasi pewawancara di lapangan (dipulihkan dari hasil_wawancara_lama).';
COMMENT ON COLUMN public.hasil_wawancara.validasi_kip IS
  'Kepemilikan KIP terverifikasi pewawancara di lapangan (dipulihkan dari hasil_wawancara_lama).';
COMMENT ON COLUMN public.hasil_wawancara.validasi_sktm IS
  'Kepemilikan SKTM terverifikasi pewawancara di lapangan (dipulihkan dari hasil_wawancara_lama).';
COMMENT ON COLUMN public.hasil_wawancara.aset IS
  'Daftar aset bernilai (motor, TV, kulkas, dll) hasil observasi pewawancara.';
COMMENT ON COLUMN public.hasil_wawancara.kondisi_rumah IS
  'Kesimpulan kondisi fisik rumah pewawancara: "Layak Menerima Beasiswa" | "Tidak Layak Beasiswa".';

-- 2) Riwayat aktivitas per kandidat (dipakai oleh kartu "Riwayat Kandidat" di
--    halaman Evaluasi Wawancara). Setiap baris adalah satu kejadian nyata:
--    penugasan pewawancara, keputusan admin, dst. Baris tidak pernah diedit,
--    hanya ditambahkan (append-only log).
CREATE TABLE IF NOT EXISTS public.kandidat_riwayat (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  kandidat_id uuid NOT NULL,
  tipe varchar(40) NOT NULL,
  deskripsi text NOT NULL,
  aktor varchar(150) NULL,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT kandidat_riwayat_pkey PRIMARY KEY (id),
  CONSTRAINT kandidat_riwayat_kandidat_id_fkey FOREIGN KEY (kandidat_id)
    REFERENCES public.kandidat(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS kandidat_riwayat_kandidat_id_idx
  ON public.kandidat_riwayat (kandidat_id, created_at DESC);

COMMENT ON TABLE public.kandidat_riwayat IS
  'Log aktivitas append-only per kandidat: penugasan pewawancara, submit wawancara, keputusan admin, dll. Dipakai oleh kartu "Riwayat Kandidat".';
COMMENT ON COLUMN public.kandidat_riwayat.tipe IS
  'Jenis kejadian, mis. impor | penugasan | submit_wawancara | keputusan_admin | catatan';
