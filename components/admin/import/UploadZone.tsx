"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { CandidateData, ValidationSummary } from "@/schemas";

// Normalize header strings: collapse whitespace, trim, uppercase
const normalize = (s: any) => String(s ?? "").replace(/\s+/g, " ").trim().toUpperCase();

// Module-level map — avoids useRef closure issues with Turbopack
let _headerMap: Record<string, number> = {};

interface Props {
  onDataUploaded: (
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) => void;
  onSave: () => void;
  hasData: boolean;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}

export default function UploadZone({ onDataUploaded, onSave, hasData, saveStatus = "idle" }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Validate required fields using the same normalized keys as get()
  const validateRow = (
    row: any[],
  ): { hasErrors: boolean; missingFields: string[] } => {
    const required: Array<{ label: string; keys: string[] }> = [
      { label: "NAMA",          keys: ["NAMA"] },
      { label: "NIK",           keys: ["NIK"] },
      { label: "NO. HANDPHONE", keys: ["NO. HANDPHONE", "NO HANDPHONE", "NO HP"] },
      { label: "ALAMAT EMAIL",  keys: ["ALAMAT EMAIL", "EMAIL"] },
    ];
    const missingFields: string[] = [];
    required.forEach(({ label, keys }) => {
      const val = keys.map((k) => {
        const idx = _headerMap[normalize(k)];
        return idx !== undefined ? String(row[idx] ?? "").trim() : "";
      }).find((v) => v !== "");
      if (!val) missingFields.push(label);
    });
    return { hasErrors: missingFields.length > 0, missingFields };
  };

  const processExcelFile = useCallback(
    (file: File) => {
      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // ── Step 1: Baca sebagai array of arrays untuk deteksi baris header ──
          const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          // Cari baris header: baris yang punya setidaknya 3 kolom berisi teks
          // (lebih toleran — tidak bergantung pada nama kolom spesifik)
          let headerRowIndex = 0;
          let bestScore = 0;

          for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
            const row = rawRows[i];
            const normalized = row.map(normalize);
            // Score: berapa banyak kolom yang terisi teks (bukan angka)
            const textCols = normalized.filter((v) => v && isNaN(Number(v))).length;
            // Bonus jika ada kolom kunci
            const hasNama = normalized.some((v) => v === "NAMA");
            const hasNik  = normalized.some((v) => v === "NIK" || v === "NIM");
            const score   = textCols + (hasNama ? 10 : 0) + (hasNik ? 5 : 0);

            if (score > bestScore) {
              bestScore = score;
              headerRowIndex = i;
            }
          }

          // ── Step 2: Buat mapping header → index ──
          const headerRow = rawRows[headerRowIndex].map(normalize);
          const headerMap: Record<string, number> = {};
          headerRow.forEach((h, idx) => {
            if (h) headerMap[h] = idx;
          });
          // Write to module-level map so validateRow can access it
          _headerMap = headerMap;

          // Debug: log detected headers so we can verify mapping
          console.log("[UploadZone] Header row index:", headerRowIndex);
          console.log("[UploadZone] Detected headers:", headerRow.filter(Boolean));

          // Helper: ambil nilai dari row berdasarkan nama kolom (flexible matching)
          const get = (row: any[], ...keys: string[]): string => {
            for (const key of keys) {
              const idx = headerMap[normalize(key)];
              if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
                return String(row[idx]).trim();
              }
            }
            return "";
          };

          const getNum = (row: any[], ...keys: string[]): number => {
            const val = get(row, ...keys);
            if (!val) return 0;
            // Hapus semua karakter non-digit kecuali koma dan titik
            // Format Indonesia: 2.250.000,00 → hapus titik ribuan, ganti koma desimal
            const cleaned = val
              .replace(/[Rp\s]/gi, "")   // hapus "Rp" dan spasi
              .replace(/\./g, "")         // hapus titik ribuan
              .replace(",", ".");         // ganti koma desimal ke titik
            const n = parseFloat(cleaned);
            return isNaN(n) ? 0 : n;
          };

          // ── Step 3: Proses baris data (setelah header) ──
          const dataRows = rawRows.slice(headerRowIndex + 1).filter((row) =>
            row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
          );

          const candidates: CandidateData[] = dataRows.map((row, index) => {
            const rowObj: Record<string, any> = {};
            headerRow.forEach((h, i) => { if (h) rowObj[h] = row[i]; });

            const validation = validateRow(row);

            return {
              no: index + 1,

              // Identitas & Pendaftaran
              no_pendaftaran_kipk: get(row, "NO. PENDAFTARAN KIPK", "NO.PENDAFTARAN KIPK", "NO PENDAFTARAN KIPK", "PENDAFTARAN KIPK"),
              nama:                get(row, "NAMA", "NAMA LENGKAP", "NAMA MAHASISWA"),
              prodi:               get(row, "PRODI", "JURUSAN", "PROGRAM STUDI", "PROGRAM STUDI/JURUSAN"),
              nik:                 get(row, "NIK"),
              no_kartu_keluarga:   get(row, "NO. KARTU KELUARGA", "NO KARTU KELUARGA", "NO. KK", "NO KK"),
              nik_kepala_keluarga: get(row, "NIK KEPALA KELUARGA"),
              nisn:                get(row, "NISN"),

              // Status Sosial
              status_dtks:   get(row, "STATUS DTKS", "STATUS DTSEN", "STATUS DATA TUNGGAL"),
              validasi_dtks: get(row, "VALIDASI DTKS", "VALIDASI KKS", "VALIDASI DTSEN"),
              status_p3ke:   get(row, "STATUS P3KE", "VALIDASI SKTM"),
              validasi_p3ke: get(row, "VALIDASI P3KE"),
              no_kip:        get(row, "NO. KIP", "NO KIP", "NO. BANSOS", "NO BANSOS", "NOMOR BANTUAN SOSIAL", "NO. KIP/KKS/SKTM"),
              validasi_kip:  get(row, "VALIDASI KIP"),
              no_kks:        get(row, "NO. KKS", "NO KKS"),

              // Asal Sekolah
              asal_sekolah:     get(row, "ASAL SEKOLAH", "SEKOLAH ASAL", "NAMA SEKOLAH ASAL"),
              kab_kota_sekolah: get(row, "KAB/KOTA SEKOLAH", "KOTA", "KAB/KOTA", "KOTA/KABUPATEN ASAL"),
              provinsi_sekolah: get(row, "PROVINSI SEKOLAH", "PROVINSI", "PROVINSI ASAL"),

              // Data Diri
              tempat_lahir:   get(row, "TEMPAT LAHIR"),
              tanggal_lahir:  get(row, "TANGGAL LAHIR"),
              jenis_kelamin:  get(row, "JENIS KELAMIN"),
              alamat_tinggal: get(row, "ALAMAT TINGGAL", "ALAMAT", "ALAMAT DOMISILI"),
              no_hp:          get(row, "NO. TELP", "NO. HANDPHONE", "NO HANDPHONE", "NO HP", "NOMOR HP AKTIF", "NO. HP"),
              email:          get(row, "ALAMAT EMAIL", "EMAIL", "ALAMAT EMAIL AKTIF"),
              sosial_media:   get(row, "IG/TWITTER/TIKTOK", "ALAMAT IG/TWITTER/TIKTOK", "SOSIAL MEDIA", "KOORDINAT", "KOORDINAT TITIK LOKASI", "LINK GPS"),

              // Data Ayah
              nama_ayah:            get(row, "NAMA AYAH", "NAMA BAPAK", "NAMA BAPAK/WALI"),
              pekerjaan_ayah:       get(row, "PEKERJAAN AYAH", "PEKERJAAN BAPAK", "PEKERJAAN BAPAK/WALI"),
              ket_pekerjaan_ayah:   get(row, "KET. PEKERJAAN AYAH", "VALIDASI KET. PEKERJAAN AYAH"),
              penghasilan_ayah:     getNum(row, "KET. PENGHASILAN AYAH/BLN", "KET. PENGHASILAN AYAH/ BLN", "KET. PENGHASILAN AYAH", "PENGHASILAN BAPAK/WALI", "PENGHASILAN BAPAK"),
              ket_penghasilan_ayah: get(row, "PENGHASILAN AYAH", "VALIDASI KET. PENGHASILAN AYAH/BLN"),
              status_ayah:          get(row, "STATUS AYAH"),

              // Data Ibu
              nama_ibu:            get(row, "NAMA IBU"),
              pekerjaan_ibu:       get(row, "PEKERJAAN IBU"),
              ket_pekerjaan_ibu:   get(row, "KET. PEKERJAAN IBU", "VALIDASI KET. PEKERJAAN IBU"),
              penghasilan_ibu:     getNum(row, "KET. PENGHASILAN IBU/BLN", "KET. PENGHASILAN IBU/ BLN", "KET. PENGHASILAN IBU", "PENGHASILAN IBU"),
              ket_penghasilan_ibu: get(row, "PENGHASILAN IBU", "VALIDASI KET. PENGHASILAN IBU/BLN"),
              status_ibu:          get(row, "STATUS IBU"),

              // Ekonomi Keluarga
              wali:                      get(row, "WALI (JIKA ADA)", "WALI"),
              penghasilan_lain:          getNum(row, "PENGHASILAN LAIN/BLN", "PENGHASILAN LAIN/ BLN", "PENGHASILAN LAIN", "VALIDASI PENGHASILAN LAIN/BLN"),
              jumlah_tanggungan:         getNum(row, "JUMLAH TANGGUNGAN", "JUMLAH ORANG YANG TINGGAL DI RUMAH"),
              jml_tanggungan_sebenarnya: getNum(row, "JML TANGGUNGAN SEBENARNYA", "VALIDASI JUMLAH TANGGUNGAN SEBENARNYA"),
              nominal_per_kapita:        getNum(row, "NOMINAL PER KAPITA", "JUMLAH PBB TERAKHIR DIBAYAR", "PBB", "PBB TERAKHIR"),

              // Kondisi Tempat Tinggal
              kepemilikan_rumah: get(row, "KEPEMILIKAN RUMAH"),
              tahun_perolehan:   get(row, "TAHUN PEROLEHAN", "TAHUN PEROLEHAN RUMAH"),
              sumber_listrik:    get(row, "SUMBER LISTRIK", "DAYA LISTRIK", "LISTRIK"),
              luas_tanah:        getNum(row, "LUAS TANAH"),
              luas_bangunan:     getNum(row, "LUAS BANGUNAN"),
              sumber_air:        get(row, "SUMBER AIR", "SUMBER AIR MINUM"),
              mck:               get(row, "MCK"),
              kondisi_rumah:     get(row, "KONDISI RUMAH"),
              jarak_pusat_kota:  getNum(row, "JARAK PUSAT KOTA (KM)", "JARAK PUSAT KOTA"),

              // Hasil Wawancara
              prestasi:    get(row, "PRESTASI", "ASET", "ASET YANG DIMILIKI"),
              rekomendasi: get(row, "REKOMENDASI"),
              alasan:      get(row, "ALASAN"),
              pewawancara: get(row, "NAMA PEWAWANCARA", "PEWAWANCARA"),

              hasErrors:     validation.hasErrors,
              missingFields: validation.missingFields,
            };
          });

          // Calculate validation stats
          const validCount = candidates.filter((c) => !c.hasErrors).length;
          const incompleteCount = candidates.filter((c) => c.hasErrors).length;

          // Check for duplicates based on NIK
          const nikSet = new Set<string>();
          let duplicateCount = 0;
          candidates.forEach((c) => {
            if (c.nik && nikSet.has(c.nik)) {
              duplicateCount++;
            } else if (c.nik) {
              nikSet.add(c.nik);
            }
          });

          const stats: ValidationSummary = {
            valid: validCount,
            incomplete: incompleteCount,
            duplicates: duplicateCount,
            total: candidates.length,
          };

          onDataUploaded(candidates, stats, file.name);
          setUploadedFile(file);
        } catch (error) {
          console.error("Error processing Excel file:", error);
          alert(
            "Gagal memproses file. Pastikan format Excel sesuai dengan template.",
          );
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [onDataUploaded],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        processExcelFile(file);
      }
    },
    [processExcelFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleDownloadTemplate = () => {
    // Create template with all required columns
    const templateData = [
      {
        NAMA: "Ahmad Fauzi",
        NIM: "24060122140001",
        PRODI: "Teknik Informatika",
        FAKULTAS: "Sains dan Matematika",
        VERIFIKASI: "Sudah",
        SELEKSI: "Lolos",
        "STATUS DI BEASISWA LAIN": "Tidak Ada",
        "JALUR MASUK": "SNBP",
        NIK: "3374010101010001",
        "No KK": "3374010101010001",
        "Nomor Pendaftaran KIP-K": "KIPK2026001",
        "No. KIP/KKS/SKTM": "KIP123456",
        "Nomor KIP": "KIP123456",
        "Nomor KKS": "",
        "Nomor SKTM": "",
        "Jumlah Orang Tinggal Serumah": 5,
        "Validasi orang tinggal serumah": "Valid",
        "NO HP": "081234567890",
        "Golongan UKT": "UKT 1",
        "Nominal UKT": 500000,
        "Pekerjaan Bapak": "Petani",
        "Validasi Kondisi Bapak": "Masih Hidup",
        "Deskripsi Pekerjaan Bapak": "Petani padi",
        "Penghasilan Bapak": 2000000,
        "Validasi Penghasilan Bapak": "Valid",
        "Pekerjaan Ibu": "Ibu Rumah Tangga",
        "Validasi Kondisi Ibu": "Masih Hidup",
        "Deskripsi Pekerjaan Ibu": "",
        "Penghasilan Ibu": 0,
        "Validasi Penghasilan Ibu": "Valid",
        "Foto bersama keluarga di dalam rumah": "foto1.jpg",
        "Validasi Foto Bersama Keluarga": "Valid",
        "Foto Rumah": "rumah1.jpg",
        "Validasi Foto Rumah": "Valid",
        "Titik Koordinat Lokasi Rumah": "-7.0123, 110.4567",
        ALAMAT: "Jl. Contoh No. 123, Semarang",
        SMTST: "Semester 1",
        "STATUS MAHASISWA": "Aktif",
        "Daya Listrik": "900 VA",
        "Jumlah Tanggungan dalam KK": 4,
        EMAIL: "ahmad@students.undip.ac.id",
        "PBB Terakhir": "500000",
        "Validasi PBB terakhir": "Valid",
        "Kendaraan yang dimiliki": "Sepeda Motor",
        "Barang elektronik yang dimiliki": "TV, Kulkas",
        "HP yang digunakan saat ini": "Samsung A series",
        Rekomendasi: "Sangat Direkomendasikan",
        Alasan: "Kondisi ekonomi kurang mampu",
        Pewawancara: "Dr. Budi Santoso",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Import_KIP-K_UNDIP.xlsx");
  };

  return (
    <>
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`bg-surface-container-lowest p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer
          ${
            isDragActive
              ? "border-primary bg-primary-fixed-dim/10"
              : "border-outline-variant hover:border-primary"
          }
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            className="w-16 h-16 bg-primary-fixed-dim/20 rounded-full flex items-center justify-center mb-4"
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              {isProcessing ? "hourglass_empty" : "cloud_upload"}
            </span>
          </motion.div>

          <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">
            {isProcessing ? "Memproses File..." : "Drag & Drop File"}
          </h3>

          <p className="text-sm text-on-surface-variant mb-6 px-4">
            {isDragActive
              ? "Lepaskan file di sini..."
              : "Unggah file Excel atau CSV sesuai template yang disediakan."}
          </p>

          {!isProcessing && (
            <button className="px-6 py-2 bg-surface-container-high hover:bg-surface-container-highest text-primary font-semibold text-sm rounded-xl transition-all">
              Pilih File
            </button>
          )}

          <p className="mt-4 text-[10px] text-outline">
            Maksimal ukuran file 10MB (.xlsx, .xls, .csv)
          </p>

          <AnimatePresence>
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 flex items-center gap-2 px-3 py-2 bg-primary-fixed-dim/20 rounded-lg"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
                <span className="text-xs text-primary font-medium truncate max-w-[200px]">
                  {uploadedFile.name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-3">
        {/* <button
          onClick={onSave}
          disabled={!hasData || saveStatus === "saving" || saveStatus === "saved"}
          className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 shadow-sm transition-all ${
            saveStatus === "saved"
              ? "bg-emerald-500 text-white cursor-default"
              : saveStatus === "saving"
              ? "bg-primary/70 text-white cursor-wait"
              : saveStatus === "error"
              ? "bg-red-500 text-white"
              : hasData
              ? "bg-primary hover:bg-primary/90 text-white"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          {saveStatus === "saving" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : saveStatus === "saved" ? (
            <>
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Tersimpan & Tabel Dilengkapi
            </>
          ) : saveStatus === "error" ? (
            <>
              <span className="material-symbols-outlined text-[18px]">error</span>
              Gagal — Coba Lagi
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">save</span>
              Simpan ke Database
            </>
          )}
        </button> */}
      </div>
    </>
  );
}
