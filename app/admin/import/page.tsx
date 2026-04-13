"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import UploadZone from "@/components/admin/import/UploadZone";
import DataPreviewTable from "@/components/admin/import/DataPreviewTable";
import ValidationStats from "@/components/admin/import/ValidationStats";
import TipsCard from "@/components/admin/import/TipsCard";

export interface CandidateData {
  // Identitas Dasar
  nama: string;
  nim: string;
  prodi: string;
  fakultas: string;

  // Status & Verifikasi
  verifikasi: string;
  seleksi: string;
  status_di_beasiswa_lain: string;
  jalur_masuk: string;

  // Dokumen Identitas
  nik: string;
  no_kk: string;
  nomor_pendaftaran_kipk: string;
  no_kip_kks_sktm: string;
  nomor_kip: string;
  nomor_kks: string;
  nomor_sktm: string;

  // Data Keluarga
  jumlah_orang_tinggal_serumah: number;
  validasi_orang_tinggal_serumah: string;
  jumlah_tanggungan_dalam_kk: number;

  // Kontak
  no_hp: string;
  email: string;

  // Ekonomi
  golongan_ukt: string;
  nominal_ukt: number;
  pekerjaan_bapak: string;
  validasi_kondisi_bapak: string;
  deskripsi_pekerjaan_bapak: string;
  penghasilan_bapak: number;
  validasi_penghasilan_bapak: string;
  pekerjaan_ibu: string;
  validasi_kondisi_ibu: string;
  deskripsi_pekerjaan_ibu: string;
  penghasilan_ibu: number;
  validasi_penghasilan_ibu: string;

  // Dokumentasi
  foto_bersama_keluarga: string;
  validasi_foto_bersama_keluarga: string;
  foto_rumah: string;
  validasi_foto_rumah: string;
  titik_koordinat_lokasi_rumah: string;

  // Alamat & Tempat Tinggal
  alamat: string;
  smtst: string;
  status_mahasiswa: string;
  daya_listrik: string;
  pbb_terakhir: string;
  validasi_pbb_terakhir: string;

  // Aset
  kendaraan_yang_dimiliki: string;
  barang_elektronik_yang_dimiliki: string;
  hp_yang_digunakan_saat_ini: string;

  // Hasil Wawancara
  rekomendasi: string;
  alasan: string;
  pewawancara: string;

  // Validation flags
  hasErrors?: boolean;
  missingFields?: string[];
  no?: number;
}

export interface ValidationSummary {
  valid: number;
  incomplete: number;
  duplicates: number;
  total: number;
}

export default function ImportDataPage() {
  const [uploadedData, setUploadedData] = useState<CandidateData[]>([]);
  const [validation, setValidation] = useState<ValidationSummary>({
    valid: 0,
    incomplete: 0,
    duplicates: 0,
    total: 0,
  });
  const [fileName, setFileName] = useState<string>("");

  const handleDataUploaded = (
    data: CandidateData[],
    stats: ValidationSummary,
    filename: string,
  ) => {
    setUploadedData(data);
    setValidation(stats);
    setFileName(filename);
  };

  const handleSaveAndContinue = async () => {
    // TODO: Send data to backend API
    console.log("Saving data:", uploadedData);
    // await topsisAPI.uploadCandidates(uploadedData);
  };

  return (
    <div className="min-h-screen bg-surface p-10">
      {/* Header & Breadcrumb */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 mb-2">
          <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-on-surface-variant">
            Dashboard
          </span>
          <span className="material-symbols-outlined text-xs text-outline">
            chevron_right
          </span>
          <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-primary">
            Import Data
          </span>
        </nav>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
          Import Data Pendaftar
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Lakukan unggah data mahasiswa untuk memulai kalkulasi seleksi
          beasiswa.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Upload Zone */}
        <div className="col-span-12 lg:col-span-4">
          <UploadZone
            onDataUploaded={handleDataUploaded}
            onSave={handleSaveAndContinue}
            hasData={uploadedData.length > 0}
          />
        </div>

        {/* Right Column: Table Preview */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {uploadedData.length > 0 ? (
            <>
              <DataPreviewTable data={uploadedData} fileName={fileName} />
              <ValidationStats stats={validation} />
              <TipsCard />
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-surface-container-lowest rounded-xl p-12 text-center border-2 border-dashed border-outline-variant"
            >
              <span className="material-symbols-outlined text-6xl text-outline mb-4 block">
                table_chart
              </span>
              <h3 className="text-lg font-bold text-on-surface mb-2 font-headline">
                Belum Ada Data
              </h3>
              <p className="text-sm text-on-surface-variant">
                Upload file Excel untuk melihat preview data
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
