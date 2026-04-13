"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { CandidateData, ValidationSummary } from "@/app/admin/import/page";

interface Props {
  onDataUploaded: (
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) => void;
  onSave: () => void;
  hasData: boolean;
}

export default function UploadZone({ onDataUploaded, onSave, hasData }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const validateRow = (
    row: any,
  ): { hasErrors: boolean; missingFields: string[] } => {
    const requiredFields = ["NAMA", "NIM", "PRODI", "NIK", "NO HP", "EMAIL"];
    const missingFields: string[] = [];

    requiredFields.forEach((field) => {
      if (!row[field] || row[field].toString().trim() === "") {
        missingFields.push(field);
      }
    });

    return {
      hasErrors: missingFields.length > 0,
      missingFields,
    };
  };

  const processExcelFile = useCallback(
    (file: File) => {
      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map Excel columns to our data structure
          const candidates: CandidateData[] = jsonData.map(
            (row: any, index: number) => {
              const validation = validateRow(row);

              return {
                // Identitas Dasar
                nama: row["NAMA"]?.toString() || "",
                nim: row["NIM"]?.toString() || "",
                prodi: row["PRODI"]?.toString() || "",
                fakultas: row["FAKULTAS"]?.toString() || "",

                // Status & Verifikasi
                verifikasi: row["VERIFIKASI"]?.toString() || "",
                seleksi: row["SELEKSI"]?.toString() || "",
                status_di_beasiswa_lain:
                  row["STATUS DI BEASISWA LAIN"]?.toString() || "",
                jalur_masuk: row["JALUR MASUK"]?.toString() || "",

                // Dokumen Identitas
                nik: row["NIK"]?.toString() || "",
                no_kk: row["No KK"]?.toString() || "",
                nomor_pendaftaran_kipk:
                  row["Nomor Pendaftaran KIP-K"]?.toString() || "",
                no_kip_kks_sktm: row["No. KIP/KKS/SKTM"]?.toString() || "",
                nomor_kip: row["Nomor KIP"]?.toString() || "",
                nomor_kks: row["Nomor KKS"]?.toString() || "",
                nomor_sktm: row["Nomor SKTM"]?.toString() || "",

                // Data Keluarga
                jumlah_orang_tinggal_serumah:
                  parseInt(row["Jumlah Orang Tinggal Serumah"]) || 0,
                validasi_orang_tinggal_serumah:
                  row["Validasi orang tinggal serumah"]?.toString() || "",
                jumlah_tanggungan_dalam_kk:
                  parseInt(row["Jumlah Tanggungan dalam KK"]) || 0,

                // Kontak
                no_hp: row["NO HP"]?.toString() || "",
                email: row["EMAIL"]?.toString() || "",

                // Ekonomi
                golongan_ukt: row["Golongan UKT"]?.toString() || "",
                nominal_ukt: parseFloat(row["Nominal UKT"]) || 0,
                pekerjaan_bapak: row["Pekerjaan Bapak"]?.toString() || "",
                validasi_kondisi_bapak:
                  row["Validasi Kondisi Bapak"]?.toString() || "",
                deskripsi_pekerjaan_bapak:
                  row["Deskripsi Pekerjaan Bapak"]?.toString() || "",
                penghasilan_bapak: parseFloat(row["Penghasilan Bapak"]) || 0,
                validasi_penghasilan_bapak:
                  row["Validasi Penghasilan Bapak"]?.toString() || "",
                pekerjaan_ibu: row["Pekerjaan Ibu"]?.toString() || "",
                validasi_kondisi_ibu:
                  row["Validasi Kondisi Ibu"]?.toString() || "",
                deskripsi_pekerjaan_ibu:
                  row["Deskripsi Pekerjaan Ibu"]?.toString() || "",
                penghasilan_ibu: parseFloat(row["Penghasilan Ibu"]) || 0,
                validasi_penghasilan_ibu:
                  row["Validasi Penghasilan Ibu"]?.toString() || "",

                // Dokumentasi
                foto_bersama_keluarga:
                  row["Foto bersama keluarga di dalam rumah"]?.toString() || "",
                validasi_foto_bersama_keluarga:
                  row["Validasi Foto Bersama Keluarga"]?.toString() || "",
                foto_rumah: row["Foto Rumah"]?.toString() || "",
                validasi_foto_rumah:
                  row["Validasi Foto Rumah"]?.toString() || "",
                titik_koordinat_lokasi_rumah:
                  row["Titik Koordinat Lokasi Rumah"]?.toString() || "",

                // Alamat & Tempat Tinggal
                alamat: row["ALAMAT"]?.toString() || "",
                smtst: row["SMTST"]?.toString() || "",
                status_mahasiswa: row["STATUS MAHASISWA"]?.toString() || "",
                daya_listrik: row["Daya Listrik"]?.toString() || "",
                pbb_terakhir: row["PBB Terakhir"]?.toString() || "",
                validasi_pbb_terakhir:
                  row["Validasi PBB terakhir"]?.toString() || "",

                // Aset
                kendaraan_yang_dimiliki:
                  row["Kendaraan yang dimiliki"]?.toString() || "",
                barang_elektronik_yang_dimiliki:
                  row["Barang elektronik yang dimiliki"]?.toString() || "",
                hp_yang_digunakan_saat_ini:
                  row["HP yang digunakan saat ini"]?.toString() || "",

                // Hasil Wawancara
                rekomendasi: row["Rekomendasi"]?.toString() || "",
                alasan: row["Alasan"]?.toString() || "",
                pewawancara: row["Pewawancara"]?.toString() || "",

                // Validation flags
                hasErrors: validation.hasErrors,
                missingFields: validation.missingFields,
                no: index + 1,
              };
            },
          );

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

      reader.readAsBinaryString(file);
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
        <button
          onClick={onSave}
          disabled={!hasData}
          className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">
            check_circle
          </span>
          Simpan & Lanjutkan
        </button>

        <button
          onClick={handleDownloadTemplate}
          className="w-full py-3.5 bg-surface-container-lowest text-primary border border-primary/10 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-fixed-dim/10 transition-all"
        >
          <span className="material-symbols-outlined text-sm">download</span>
          Download Template
        </button>
      </div>
    </>
  );
}
