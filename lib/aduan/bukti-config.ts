export const BUKTI_CONFIG = {
  BUCKET: "bukti-aduan",
  MAX_FILES: 10,
  MAX_TOTAL_BYTES: 10 * 1024 * 1024, // aturan utama: 10 MB total
  MAX_FILE_BYTES: 5 * 1024 * 1024, // pencegah satu file memakai seluruh kuota
  TIPE_DIIZINKAN: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
} as const;