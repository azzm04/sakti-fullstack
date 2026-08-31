/**
 * Satu-satunya tempat definisi "jalur masuk" untuk seluruh fitur Hasil Akhir
 * (Import SK, Kirim Email, Export Excel, dst).
 *
 * SEBELUMNYA jalur ini didefinisikan ulang manual di beberapa file
 * (SectionImportSK, SectionKirimEmail, route kirim-email, dll) — salah satu
 * sempat typo spasi vs underscore ("SNBP_NON ELIGIBLE" vs "SNBP_NON_ELIGIBLE")
 * yang menyebabkan jalur Non-Eligible selalu 0 penerima secara diam-diam
 * (tidak error, tidak crash — cuma hasilnya kosong).
 *
 * Mulai sekarang: import JALUR_OPTIONS / JalurKey / JALUR_DB_ALIASES dari
 * sini saja. Jangan definisikan ulang array jalur di file lain.
 */

export const JALUR_KEYS = [
  "SNBP_ELIGIBLE",
  "SNBP_NON_ELIGIBLE",
  "SNBT_ELIGIBLE",
  "SNBT_NON_ELIGIBLE",
  "UM",
  "SBUB",
] as const;

export type JalurKey = (typeof JALUR_KEYS)[number];

export const JALUR_LABELS: Record<JalurKey, string> = {
  SNBP_ELIGIBLE: "SNBP Eligible",
  SNBP_NON_ELIGIBLE: "SNBP Non-Eligible",
  SNBT_ELIGIBLE: "SNBT Eligible",
  SNBT_NON_ELIGIBLE: "SNBT Non-Eligible",
  UM: "Ujian Mandiri (UM)",
  SBUB: "SBUB",
};

/** Dipakai di UI (checkbox, select, dsb) — pengganti JALUR_OPTIONS lokal di tiap komponen. */
export const JALUR_OPTIONS = JALUR_KEYS.map((key) => ({
  key,
  label: JALUR_LABELS[key],
})) as { key: JalurKey; label: string }[];

/**
 * Alias nilai yang mungkin tersimpan di kolom `jalur_masuk` pada tabel `kandidat`
 * (karena data lama/import bisa punya variasi penulisan).
 * Dipakai di route API (kirim-email, preview-email, email-queue) untuk query `.in("jalur_masuk", ...)`.
 */
export const JALUR_DB_ALIASES: Record<JalurKey, string[]> = {
  SNBP_ELIGIBLE: ["SNBP", "SNBP Eligible", "SNBP_ELIGIBLE"],
  SNBP_NON_ELIGIBLE: [
    "SNBP non-eligible",
    "SNBP Non-Eligible",
    "SNBP Non Eligible",
    "SNBP_NON_ELIGIBLE",
  ],
  SNBT_ELIGIBLE: ["SNBT", "SNBT Eligible", "SNBT_ELIGIBLE"],
  SNBT_NON_ELIGIBLE: [
    "SNBT non-eligible",
    "SNBT Non-Eligible",
    "SNBT Non Eligible",
    "SNBT_NON_ELIGIBLE",
  ],
  UM: ["UM", "Ujian Mandiri"],
  SBUB: ["SBUB"],
};

/** Helper: gabungkan alias dari beberapa jalur sekaligus (dipakai saat user pilih multi-jalur). */
export function resolveJalurAliases(jalurList: string[]): string[] {
  return jalurList.flatMap((j) => JALUR_DB_ALIASES[j as JalurKey] ?? []);
}

/**
 * Nilai persis yang ditulis ke kolom `kandidat.jalur_masuk` saat import —
 * SENGAJA sama dengan string yang sudah dipakai import page hari ini, supaya
 * konsolidasi definisi jalur ke file ini tidak mengubah data yang sudah ada.
 */
export const JALUR_IMPORT_VALUE: Record<JalurKey, string> = {
  SNBP_ELIGIBLE: "SNBP Eligible",
  SNBP_NON_ELIGIBLE: "SNBP Non Eligible",
  SNBT_ELIGIBLE: "SNBT Eligible",
  SNBT_NON_ELIGIBLE: "SNBT Non Eligible",
  UM: "UM",
  SBUB: "SBUB",
};

/** Dipakai di picker jalur saat import & selector Analitik: {value, label}. */
export const JALUR_VALUE_OPTIONS = JALUR_KEYS.map((key) => ({
  value: JALUR_IMPORT_VALUE[key],
  label: JALUR_LABELS[key],
}));

/** Jalur yang butuh tahap Filtering Kuota pasca-wawancara. */
export const FILTERING_JALUR_KEYS: JalurKey[] = ["UM", "SBUB"];

/** Resolve nilai bebas di `kandidat.jalur_masuk` kembali ke JalurKey kanonik. */
export function jalurKeyFromValue(value: string | null | undefined): JalurKey | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) return null;
  for (const key of JALUR_KEYS) {
    if (JALUR_DB_ALIASES[key].some((alias) => alias.toLowerCase() === normalized)) {
      return key;
    }
  }
  return null;
}

/** Apakah kandidat jalur ini perlu melewati tahap Filtering Kuota? */
export function needsKuotaFiltering(jalurValue: string | null | undefined): boolean {
  const key = jalurKeyFromValue(jalurValue);
  return key !== null && FILTERING_JALUR_KEYS.includes(key);
}