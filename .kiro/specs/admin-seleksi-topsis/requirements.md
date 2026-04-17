# Dokumen Persyaratan

## Pendahuluan

Fitur **Dashboard Admin Seleksi TOPSIS** adalah modul inti pada platform SAKTI (Sistem Administrasi Kelola Tata-kelola Informasi) yang digunakan oleh Administrator Dirmawa Universitas Diponegoro untuk mengelola seluruh alur seleksi penerima beasiswa KIPK (Kartu Indonesia Pintar Kuliah). Modul ini mencakup: impor data pendaftar dari file Excel, manajemen akses verifikator wawancara, kalkulasi dan visualisasi hasil SMART-TOPSIS, penetapan kuota kelulusan, pengesahan dokumen resmi dari rektorat, dan pengiriman pengumuman hasil seleksi massal kepada pendaftar.

---

## Glosarium

- **SAKTI**: Platform sistem pendukung tata kelola beasiswa KIPK Universitas Diponegoro.
- **Administrator**: Pengguna dengan peran `admin` yang memiliki akses penuh ke seluruh modul seleksi pada platform SAKTI.
- **Pendaftar**: Mahasiswa calon penerima beasiswa KIPK yang datanya diimpor ke dalam sistem.
- **Verifikator**: Anggota BEM atau Kamadiksi yang diberi hak akses untuk melakukan wawancara dan verifikasi data pendaftar.
- **SMART-TOPSIS**: Metode pengambilan keputusan multi-kriteria yang menggabungkan Simple Multi-Attribute Rating Technique (SMART) untuk pembobotan kriteria dan Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS) untuk perankingan akhir.
- **Skor_TOPSIS**: Nilai numerik antara 0 dan 1 yang dihasilkan oleh kalkulasi TOPSIS, merepresentasikan kedekatan relatif setiap pendaftar terhadap solusi ideal positif.
- **Kuota**: Jumlah maksimum pendaftar yang ditetapkan Administrator sebagai penerima beasiswa KIPK dalam satu periode seleksi.
- **Surat_Resmi**: Dokumen PDF resmi yang diterbitkan oleh rektorat Universitas Diponegoro sebagai pengesahan hasil seleksi.
- **SSO**: Single Sign-On, sistem autentikasi terpusat Universitas Diponegoro yang digunakan oleh verifikator.
- **Import_Engine**: Subsistem SAKTI yang bertanggung jawab atas parsing, validasi, dan penyimpanan data dari file Excel.
- **TOPSIS_Engine**: Subsistem SAKTI yang menjalankan kalkulasi SMART-TOPSIS terhadap data pendaftar yang telah diimpor.
- **Notification_Service**: Subsistem SAKTI yang mengirimkan email pengumuman kepada pendaftar.
- **Dashboard_Analitik**: Halaman antarmuka pada SAKTI yang menampilkan hasil kalkulasi TOPSIS dalam bentuk tabel peringkat dan statistik ringkasan.

---

## Persyaratan

### Persyaratan 1: Autentikasi Administrator

**User Story:** Sebagai Administrator, saya ingin masuk ke platform SAKTI menggunakan kredensial khusus, sehingga hanya pihak berwenang yang dapat mengakses modul seleksi.

#### Kriteria Penerimaan

1. THE SAKTI SHALL menyediakan halaman login yang hanya dapat diakses oleh pengguna dengan peran `admin`.
2. WHEN Administrator memasukkan kombinasi email dan password yang valid, THE SAKTI SHALL mengautentikasi sesi dan mengarahkan Administrator ke halaman Dashboard Admin.
3. IF Administrator memasukkan kredensial yang tidak valid, THEN THE SAKTI SHALL menampilkan pesan kesalahan yang menjelaskan bahwa email atau password salah tanpa mengungkap detail mana yang keliru.
4. WHILE sesi Administrator aktif, THE SAKTI SHALL mempertahankan status autentikasi selama 8 jam sejak login terakhir.
5. IF sesi Administrator telah berakhir, THEN THE SAKTI SHALL mengarahkan Administrator ke halaman login dan menampilkan notifikasi bahwa sesi telah habis.

---

### Persyaratan 2: Impor Data Pendaftar dari File Excel

**User Story:** Sebagai Administrator, saya ingin mengunggah file Excel berisi data calon penerima KIPK, sehingga sistem dapat memproses dan memvalidasi data tersebut secara otomatis.

#### Kriteria Penerimaan

1. THE Import_Engine SHALL menerima file dengan format `.xlsx` dan `.csv` sebagai input yang valid.
2. IF Administrator mengunggah file dengan format selain `.xlsx` atau `.csv`, THEN THE Import_Engine SHALL menolak file tersebut dan menampilkan pesan kesalahan yang menyebutkan format yang diterima.
3. IF Administrator mengunggah file yang melebihi ukuran 10 MB, THEN THE Import_Engine SHALL menolak file tersebut dan menampilkan pesan kesalahan yang menyebutkan batas ukuran maksimum.
4. WHEN Administrator mengunggah file yang valid, THE Import_Engine SHALL mem-parsing seluruh baris data dan memetakannya ke skema `CandidateDataSchema`.
5. WHEN proses parsing selesai, THE Import_Engine SHALL menampilkan ringkasan validasi yang mencakup jumlah baris valid, baris tidak lengkap, baris duplikat, dan total baris yang diproses.
6. WHEN proses parsing selesai, THE Import_Engine SHALL menampilkan pratinjau tabel data yang menunjukkan minimal 10 baris pertama beserta status validasi per baris.
7. IF sebuah baris data memiliki kolom wajib yang kosong (nama, NIM, NIK, no_hp, email), THEN THE Import_Engine SHALL menandai baris tersebut sebagai `incomplete` dan mencatat nama kolom yang kosong pada field `missingFields`.
8. IF terdapat dua atau lebih baris dengan nilai NIM yang identik, THEN THE Import_Engine SHALL menandai baris duplikat tersebut dan memasukkannya ke dalam hitungan `duplicates`.
9. WHEN Administrator mengklik tombol simpan setelah meninjau pratinjau data, THE Import_Engine SHALL menyimpan seluruh data yang valid ke dalam basis data SAKTI dan menampilkan konfirmasi jumlah data yang berhasil disimpan.
10. THE Import_Engine SHALL menyelesaikan proses parsing dan validasi untuk file berisi hingga 1.000 baris dalam waktu tidak lebih dari 10 detik.

---

### Persyaratan 3: Manajemen Akses Verifikator

**User Story:** Sebagai Administrator, saya ingin mendaftarkan email SSO calon pewawancara dari BEM atau Kamadiksi, sehingga mereka mendapatkan hak akses sebagai verifikator secara otomatis.

#### Kriteria Penerimaan

1. THE SAKTI SHALL menyediakan antarmuka bagi Administrator untuk memasukkan satu atau lebih alamat email SSO secara bersamaan.
2. WHEN Administrator mengirimkan daftar email SSO yang valid, THE SAKTI SHALL memberikan peran `verifikator` kepada setiap akun yang terdaftar dengan email tersebut dan menampilkan konfirmasi jumlah akun yang berhasil diaktifkan.
3. IF sebuah alamat email yang dimasukkan tidak terdaftar dalam sistem SSO Universitas Diponegoro, THEN THE SAKTI SHALL menampilkan peringatan yang menyebutkan email tersebut dan melewatinya tanpa menghentikan proses untuk email lain yang valid.
4. IF sebuah alamat email yang dimasukkan sudah memiliki peran `verifikator`, THEN THE SAKTI SHALL mengabaikan entri tersebut tanpa menghasilkan kesalahan dan melanjutkan proses.
5. THE SAKTI SHALL menampilkan daftar seluruh verifikator yang aktif beserta nama, email, dan tanggal pemberian akses.
6. WHEN Administrator mencabut akses seorang verifikator, THE SAKTI SHALL menghapus peran `verifikator` dari akun tersebut dan memperbarui daftar verifikator aktif secara langsung.

---

### Persyaratan 4: Kalkulasi dan Tampilan Dashboard Analitik SMART-TOPSIS

**User Story:** Sebagai Administrator, saya ingin mengakses Dashboard Analitik yang menampilkan hasil kalkulasi SMART-TOPSIS, sehingga saya dapat meninjau peringkat pendaftar secara komprehensif.

#### Kriteria Penerimaan

1. WHEN Administrator mengakses Dashboard Analitik, THE TOPSIS_Engine SHALL menjalankan kalkulasi SMART-TOPSIS terhadap seluruh data pendaftar yang telah tersimpan dan menghasilkan `Skor_TOPSIS` untuk setiap pendaftar.
2. THE Dashboard_Analitik SHALL menampilkan tabel peringkat yang memuat minimal kolom: peringkat, nama, NIM, program studi, IPK, penghasilan orang tua, jumlah tanggungan, dan `Skor_TOPSIS`.
3. THE Dashboard_Analitik SHALL menampilkan kartu ringkasan statistik yang mencakup total pendaftar, jumlah pendaftar dengan status "Prioritas Utama", "Direkomendasikan", dan "Cadangan".
4. WHEN Administrator mengubah bobot kriteria pada antarmuka pembobotan, THE TOPSIS_Engine SHALL menghitung ulang seluruh `Skor_TOPSIS` dan memperbarui tabel peringkat tanpa memuat ulang halaman.
5. THE Dashboard_Analitik SHALL mendukung pengurutan tabel berdasarkan kolom peringkat, IPK, penghasilan orang tua, dan `Skor_TOPSIS` secara menaik maupun menurun.
6. THE Dashboard_Analitik SHALL mendukung penyaringan tabel berdasarkan status rekomendasi ("Semua", "Prioritas Utama", "Direkomendasikan", "Cadangan").
7. THE TOPSIS_Engine SHALL menyelesaikan kalkulasi untuk hingga 1.000 pendaftar dalam waktu tidak lebih dari 5 detik.
8. THE Dashboard_Analitik SHALL menampilkan indikator pemuatan selama kalkulasi TOPSIS sedang berjalan.

---

### Persyaratan 5: Penetapan Kuota dan Penentuan Hasil Seleksi

**User Story:** Sebagai Administrator, saya ingin menetapkan batas kuota penerima beasiswa, sehingga sistem dapat secara otomatis memisahkan pendaftar yang lolos dari yang tidak lolos berdasarkan peringkat TOPSIS.

#### Kriteria Penerimaan

1. THE Dashboard_Analitik SHALL menyediakan kontrol input bagi Administrator untuk memasukkan nilai `Kuota` berupa bilangan bulat positif.
2. WHEN Administrator menetapkan nilai `Kuota`, THE Dashboard_Analitik SHALL menandai sejumlah pendaftar teratas sesuai nilai `Kuota` sebagai "Lolos" dan seluruh pendaftar di bawahnya sebagai "Tidak Lolos" berdasarkan urutan `Skor_TOPSIS` dari tertinggi ke terendah.
3. THE Dashboard_Analitik SHALL menampilkan garis pemisah visual yang jelas antara pendaftar berstatus "Lolos" dan "Tidak Lolos" pada tabel peringkat.
4. IF nilai `Kuota` yang dimasukkan Administrator melebihi total jumlah pendaftar yang tersimpan, THEN THE Dashboard_Analitik SHALL menampilkan peringatan yang menyebutkan bahwa kuota melebihi jumlah pendaftar dan meminta konfirmasi sebelum menyimpan.
5. IF nilai `Kuota` yang dimasukkan bukan bilangan bulat positif, THEN THE Dashboard_Analitik SHALL menampilkan pesan validasi dan tidak menyimpan nilai tersebut.
6. WHEN Administrator menyimpan nilai `Kuota`, THE SAKTI SHALL mencatat nilai tersebut beserta timestamp dan identitas Administrator yang menetapkannya.

---

### Persyaratan 6: Unggah Surat Resmi Pengesahan Rektorat

**User Story:** Sebagai Administrator, saya ingin mengunggah Surat Resmi dari rektorat setelah hasil seleksi disahkan pimpinan, sehingga dokumen pengesahan tersimpan dan terhubung dengan data hasil seleksi.

#### Kriteria Penerimaan

1. THE SAKTI SHALL menyediakan antarmuka unggah dokumen yang hanya dapat diakses setelah nilai `Kuota` telah ditetapkan dan disimpan.
2. THE SAKTI SHALL menerima file `Surat_Resmi` dengan format PDF dan ukuran maksimum 5 MB.
3. IF Administrator mengunggah file dengan format selain PDF, THEN THE SAKTI SHALL menolak file tersebut dan menampilkan pesan kesalahan yang menyebutkan format yang diterima.
4. IF Administrator mengunggah file PDF yang melebihi ukuran 5 MB, THEN THE SAKTI SHALL menolak file tersebut dan menampilkan pesan kesalahan yang menyebutkan batas ukuran maksimum.
5. WHEN Administrator berhasil mengunggah `Surat_Resmi`, THE SAKTI SHALL menyimpan file tersebut dan menampilkan konfirmasi yang mencakup nama file, ukuran, dan timestamp unggahan.
6. WHEN `Surat_Resmi` telah diunggah, THE SAKTI SHALL menampilkan pratinjau atau tautan unduhan dokumen tersebut pada halaman laporan final.
7. WHEN Administrator mengunggah `Surat_Resmi` baru untuk menggantikan yang sudah ada, THE SAKTI SHALL menyimpan versi terbaru dan mempertahankan riwayat versi sebelumnya.

---

### Persyaratan 7: Pengiriman Pengumuman Hasil Seleksi Massal

**User Story:** Sebagai Administrator, saya ingin mengirimkan pengumuman hasil seleksi secara massal ke email seluruh pendaftar, sehingga setiap pendaftar mengetahui status kelulusan mereka melalui saluran resmi.

#### Kriteria Penerimaan

1. THE SAKTI SHALL menyediakan tombol pengiriman pengumuman yang hanya aktif setelah `Surat_Resmi` berhasil diunggah.
2. WHEN Administrator memicu pengiriman pengumuman, THE SAKTI SHALL menampilkan dialog konfirmasi yang menampilkan jumlah penerima email sebelum pengiriman dilakukan.
3. WHEN Administrator mengkonfirmasi pengiriman, THE Notification_Service SHALL mengirimkan email kepada setiap pendaftar yang terdaftar dalam data impor menggunakan alamat email pada field `email` dari `CandidateDataSchema`.
4. THE Notification_Service SHALL menyertakan dalam setiap email: nama pendaftar, NIM, status hasil seleksi ("Lolos" atau "Tidak Lolos"), dan tautan atau lampiran `Surat_Resmi`.
5. THE Notification_Service SHALL menyelesaikan pengiriman email kepada seluruh pendaftar dalam waktu tidak lebih dari 30 menit untuk daftar hingga 1.000 penerima.
6. WHEN proses pengiriman selesai, THE Notification_Service SHALL menampilkan laporan pengiriman yang mencakup jumlah email berhasil terkirim dan jumlah email yang gagal.
7. IF pengiriman email ke alamat tertentu gagal, THEN THE Notification_Service SHALL mencatat alamat email yang gagal beserta kode kesalahan dan menyertakannya dalam laporan pengiriman tanpa menghentikan pengiriman ke penerima lain.
8. THE SAKTI SHALL mencegah pengiriman pengumuman yang sama dikirim lebih dari satu kali kecuali Administrator secara eksplisit mengkonfirmasi pengiriman ulang.
