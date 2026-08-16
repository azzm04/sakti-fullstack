"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { CandidateData, ValidationSummary } from "@/schemas";
import { UploadCloud, AlertTriangle } from "lucide-react";

// Normalize header: collapse whitespace, trim, uppercase
const normalize = (s: unknown) =>
  String(s ?? "")
    .replace(/[_\s]+/g, " ")
    .trim()
    .toUpperCase();

// Module-level map — avoids useRef closure issues
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
  jalurMasuk?: string;
}

export default function UploadZone({
  onDataUploaded,
  onSave,
  hasData,
  saveStatus = "idle",
  jalurMasuk = "",
}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // ── Validasi kolom wajib ──────────────────────────────────────────────────
  const validateRow = (row: unknown[]): { hasErrors: boolean; missingFields: string[] } => {
    const required: { label: string; keys: string[] }[] = [
      {
        label: "NAMA PENDAFTAR",
        keys: ["NAMA SISWA2", "NAMA SISWA", "NAMA PENDAFTAR", "NAMA"],
      },
      {
        label: "NO. PENDAFTARAN KIPK",
        keys: ["NO. PENDAFTARAN KIP", "NO PENDAFTARAN KIP", "NO. PENDAFTARAN KIPK", "PENDAFTARAN KIPK"],
      },
      {
        label: "NIK",
        keys: ["NIK"],
      },
      {
        label: "EMAIL",
        keys: ["ALAMAT EMAIL", "EMAIL"],
      },
    ];

    const missingFields: string[] = [];
    required.forEach(({ label, keys }) => {
      const val = keys
        .map((k) => {
          const idx = _headerMap[normalize(k)];
          return idx !== undefined ? String(row[idx] ?? "").trim() : "";
        })
        .find((v) => v !== "");
      if (!val) missingFields.push(label);
    });

    return { hasErrors: missingFields.length > 0, missingFields };
  };

  // ── Proses file ───────────────────────────────────────────────────────────
  const processFile = useCallback(
    (file: File) => {
      setIsProcessing(true);
      setParseError(null);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Baca sebagai array-of-arrays
          const rawRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
          });

          // Deteksi baris header: baris dengan teks terbanyak + bonus kolom kunci
          let headerRowIndex = 0;
          let bestScore = 0;
          for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
            const row = rawRows[i];
            const norm = row.map(normalize);
            const textCols = norm.filter((v) => v && isNaN(Number(v))).length;
            const hasNama = norm.some(
              (v) => v === "NAMA" || v === "NAMA SISWA2" || v === "NAMA SISWA",
            );
            const hasNik = norm.some((v) => v === "NIK");
            const score = textCols + (hasNama ? 10 : 0) + (hasNik ? 5 : 0);
            if (score > bestScore) {
              bestScore = score;
              headerRowIndex = i;
            }
          }

          // Buat map header → index
          const headerRow = rawRows[headerRowIndex].map(normalize);
          const headerMap: Record<string, number> = {};
          headerRow.forEach((h, idx) => {
            if (h) headerMap[h] = idx;
          });
          _headerMap = headerMap;

          console.log("[UploadZone] Header row index:", headerRowIndex);
          console.log("[UploadZone] Detected headers:", headerRow.filter(Boolean));

          // ── Helper fungsi ──────────────────────────────────────────────
          const get = (row: unknown[], ...keys: string[]): string => {
            for (const key of keys) {
              const idx = headerMap[normalize(key)];
              if (idx !== undefined && row[idx] !== undefined && row[idx] !== "") {
                return String(row[idx]).trim();
              }
            }
            return "";
          };

          const getNum = (row: unknown[], ...keys: string[]): number => {
            const val = get(row, ...keys);
            if (!val) return 0;
            // Bersihkan format Rupiah: "Rp. 2.250.000" atau " 2.250.000 "
            const cleaned = val
              .replace(/[Rp\s]/gi, "")
              .replace(/\./g, "")   // titik ribuan
              .replace(",", ".");   // koma desimal
            const n = parseFloat(cleaned);
            return isNaN(n) ? 0 : n;
          };

          // Kolom "Ket. Penghasilan Ayah/bln" di CSV berisi angka nominal asli
          // (berbeda dengan kolom "Penghasilan Ayah" yang berisi range teks)
          const getPenghasilan = (row: unknown[], ketKey: string, rangeKey: string): number => {
            const ket = getNum(row, ketKey);
            if (ket > 0) return ket;
            // Fallback: parse range teks  "Rp. 1.000.001 - Rp. 1.250.000" → ambil nilai tengah
            const range = get(row, rangeKey);
            if (!range) return 0;
            const nums = range
              .replace(/[Rp.\s]/gi, "")
              .split("-")
              .map((v) => parseFloat(v.replace(/\./g, "")))
              .filter((n) => !isNaN(n));
            if (nums.length === 0) return 0;
            return nums.reduce((a, b) => a + b, 0) / nums.length;
          };

          // ── Proses baris data ──────────────────────────────────────────
          const dataRows = rawRows
            .slice(headerRowIndex + 1)
            .filter((row) =>
              row.some((cell) => cell !== "" && cell !== null && cell !== undefined),
            );

          const candidates: CandidateData[] = dataRows.map((row, index) => {
            const validation = validateRow(row);

            return {
              no: index + 1,

              // ── Identitas pendaftaran ──
              no_pendaftaran_kipk: get(
                row,
                "NO. PENDAFTARAN KIP",
                "NO PENDAFTARAN KIP",
                "NO. PENDAFTARAN KIPK",
                "NO PENDAFTARAN KIPK",
                "PENDAFTARAN KIPK",
              ),
              no_kip: get(row, "NO. KIP", "NO KIP", "NOMOR KIP"),
              no_kks: get(row, "NO. KKS", "NO KKS", "NOMOR KKS"),
              nama_pendaftar: get(
                row,
                "NAMA SISWA2",
                "NAMA SISWA",
                "NAMA PENDAFTAR",
                "NAMA",
              ),
              prodi_pendaftar: get(row, "PRODI", "PROGRAM STUDI", "JURUSAN"),
              nik: get(row, "NIK"),
              no_kartu_keluarga: get(
                row,
                "NO. KARTU KELUARGA",
                "NO KARTU KELUARGA",
                "NO. KK",
                "NO KK",
              ),
              nik_kepala_keluarga: get(
                row,
                "NIK KEPALA KELUARGA",
                "NIK KK",
              ),
              nisn: get(row, "NISN"),

              // ── Status sosial ──
              aktif_dtsen: get(row, "AKTIF DTSEN", "STATUS DTKS", "STATUS DTSEN", "STATUS DATA TUNGGAL"),
              validasi_aktif_dtsen: get(row, "VALIDASI AKTIF DTSEN", "VALIDASI DTKS", "VALIDASI DTSEN"),
              desil_dtsen: get(row, "DESIL DTSEN", "STATUS P3KE"),
              validasi_desil_dtsen: get(row, "VALIDASI P3KE", "VALIDASI DESIL DTSEN"), 
              validasi_kip: get(row, "VALIDASI KIP"),
              validasi_kks: get(row, "VALIDASI KKS"),

              // ── Sekolah ──
              asal_sekolah: get(row, "ASAL SEKOLAH", "SEKOLAH ASAL", "NAMA SEKOLAH"),
              kab_kota_sekolah: get(row, "KAB/KOTA SEKOLAH", "KAB KOTA SEKOLAH", "KOTA SEKOLAH"),
              provinsi_sekolah: get(row, "PROVINSI SEKOLAH", "PROVINSI ASAL"),

              // ── Data pribadi ──
              tempat_lahir: get(row, "TEMPAT LAHIR"),
              tanggal_lahir: get(row, "TANGGAL LAHIR"),
              jenis_kelamin: get(row, "JENIS KELAMIN"),
              alamat: get(row, "ALAMAT TINGGAL", "ALAMAT", "ALAMAT DOMISILI"),
              no_hp: get(
                row,
                "NO. HANDPHONE",
                "NO HANDPHONE",
                "NO. HP",
                "NO HP",
                "NO. TELP",
              ),
              email: get(row, "ALAMAT EMAIL", "EMAIL"),

              // ── Ayah ──
              pekerjaan_ayah: get(row, "PEKERJAAN AYAH"),
              ket_pekerjaan_ayah: get(row, "KET. PEKERJAAN AYAH"),
              penghasilan_ayah: getPenghasilan(
                row,
                "KET. PENGHASILAN AYAH/ BLN",
                "PENGHASILAN AYAH",
              ),
              status_ayah: get(row, "STATUS AYAH"),

              // ── Ibu ──
              pekerjaan_ibu: get(row, "PEKERJAAN IBU"),
              ket_pekerjaan_ibu: get(row, "KET. PEKERJAAN IBU"),
              penghasilan_ibu: getPenghasilan(
                row,
                "KET. PENGHASILAN IBU/ BLN",
                "PENGHASILAN IBU",
              ),
              status_ibu: get(row, "STATUS IBU"),

              // ── Ekonomi ──
              penghasilan_lain: getNum(row, "PENGHASILAN LAIN/ BLN", "PENGHASILAN LAIN"),
              jumlah_tanggungan: getNum(row, "JUMLAH TANGGUNGAN", "JML TANGGUNGAN"),
              jumlah_orang_rumah: getNum(
                row,
                "JML TANGGUNGAN SEBENARNYA",
                "JUMLAH TANGGUNGAN SEBENARNYA",
                "JUMLAH ORANG RUMAH",
              ),
              nominal_per_kapita: getNum(row, "NOMINAL PER KAPITA"),

              // ── Rumah ──
              kepemilikan_rumah: get(row, "KEPEMILIKAN RUMAH"),
              sumber_listrik: get(row, "SUMBER LISTRIK", "DAYA LISTRIK"),
              sumber_air: get(row, "SUMBER AIR"),
              mck: get(row, "MCK"),

              // ── Lokasi ──
              kab_kota: get(
                row,
                "KAB/KOTA SEKOLAH",
                "KAB KOTA",
                "KAB/KOTA",
                "KOTA",
              ),
              provinsi: get(row, "PROVINSI SEKOLAH", "PROVINSI"),
              jarak_pusat_kota: getNum(row, "JARAK PUSAT KOTA (KM)", "JARAK PUSAT KOTA"),

              // ── Lainnya ──
              jalur_masuk: get(row, "JALUR MASUK", "JALUR"),

              hasErrors: validation.hasErrors,
              missingFields: validation.missingFields,
            };
          });

          // Hitung stats
          const validCount = candidates.filter((c) => !c.hasErrors).length;
          const incompleteCount = candidates.filter((c) => c.hasErrors).length;

          // Deteksi duplikat berdasarkan NIK
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
          console.error("Error processing file:", error);
          setParseError(
            "Gagal memproses file. Pastikan format sesuai template.",
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
      if (file) processFile(file);
    },
    [processFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`p-8 rounded-2xl border-[1.5px] border-dashed transition-[border-color,background-color,opacity] duration-200 cursor-pointer
          ${isDragActive ? "border-admin-accent bg-admin-accent/5" : "border-admin-border hover:border-admin-accent/40 hover:bg-admin-surface-soft"}
          ${isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            className="w-16 h-16 bg-admin-accent/[0.12] rounded-2xl flex items-center justify-center mb-4"
          >
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-admin-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud size={28} className="text-admin-accent" />
            )}
          </motion.div>

          <h3 className="font-admin-heading text-base font-bold text-admin-text mb-1">
            {isProcessing ? "Memproses File..." : "Drag & Drop File"}
          </h3>

          <p className="text-xs text-admin-text-3 mb-5 px-2">
            {isDragActive
              ? "Lepaskan file di sini..."
              : "Unggah file Excel atau CSV data pendaftar KIP-K"}
          </p>

          {!isProcessing && (
            <button
              type="button"
              className="px-5 py-2 text-sm font-semibold bg-admin-accent text-white rounded-xl hover:bg-admin-accent-hover transition-colors"
            >
              Pilih File
            </button>
          )}

          <p className="mt-4 text-[10px] text-admin-text-4">
            .xlsx · .xls · .csv · maks. 10MB
          </p>

          <AnimatePresence>
            {uploadedFile && !isProcessing && !parseError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-admin-accent/10 border border-admin-accent/25 rounded-lg"
              >
                <div className="w-2 h-2 rounded-full bg-admin-accent" />
                <span className="text-xs text-admin-accent-ink font-medium truncate max-w-[200px]">
                  {uploadedFile.name}
                </span>
              </motion.div>
            )}

            {parseError && !isProcessing && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-start gap-2 px-3 py-2 bg-admin-danger-bg border border-admin-danger-border rounded-lg text-left"
              >
                <AlertTriangle
                  size={14}
                  className="text-admin-danger-text shrink-0 mt-0.5"
                />
                <span className="text-xs text-admin-danger-text font-medium">
                  {parseError}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info format kolom */}
      <div className="mt-4 p-3 bg-admin-surface-soft border border-admin-border rounded-xl">
        <p className="text-[11px] font-semibold text-admin-text-3 uppercase tracking-wider mb-1.5">
          Kolom wajib di file
        </p>
        <div className="flex flex-wrap gap-1.5">
          {["Nama Siswa2", "No. Pendaftaran KIP", "NIK", "Alamat Email"].map((col) => (
            <span
              key={col}
              className="text-[10px] font-medium px-2 py-0.5 bg-white border border-admin-border rounded text-admin-text-2"
            >
              {col}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-admin-text-4">
          Header CSV harus sesuai dengan format file{" "}
          <em>Data Verifikasi Validasi SNBT Eligible</em>.
        </p>
      </div>

      {/* Tombol simpan */}
      {hasData && saveStatus !== "saved" && (
        <button
          onClick={onSave}
          disabled={saveStatus === "saving" || !jalurMasuk}
          className={`mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
            ${saveStatus === "saving"
              ? "bg-admin-accent/60 text-white cursor-wait"
              : !jalurMasuk
              ? "bg-admin-border text-admin-placeholder cursor-not-allowed"
              : "bg-admin-accent text-white hover:bg-admin-accent-hover"
            }`}
        >
          {saveStatus === "saving" ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan...
            </>
          ) : !jalurMasuk ? (
            "← Pilih jalur masuk dulu"
          ) : (
            <>Simpan — {jalurMasuk}</>
          )}
        </button>
      )}
    </>
  );
}
