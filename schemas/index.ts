import { z } from "zod";

/* =========================
   Chat
========================= */
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
  timestamp: z.string(), // ISO string dari backend
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

/* =========================
   Telegram
========================= */
export const TelegramStatusSchema = z.object({
  is_activated: z.boolean(),
  chat_id: z.string().optional(),
  username: z.string().optional(),
  last_notification: z.string().optional(),
});
export type TelegramStatus = z.infer<typeof TelegramStatusSchema>;

export const TelegramActivationSchema = z.object({
  user_id: z.string().min(1, "User ID wajib diisi"),
});
export type TelegramActivation = z.infer<typeof TelegramActivationSchema>;

/* =========================
   TOPSIS / Pendaftar
========================= */
export const RecommendationStatusSchema = z.enum([
  "Prioritas Utama",
  "Direkomendasikan",
  "Cadangan",
]);
export type RecommendationStatus = z.infer<typeof RecommendationStatusSchema>;

export const PendaftarSchema = z.object({
  rank: z.number().int().positive(),
  nama: z.string().min(1),
  nim: z.string().min(1),
  prodi: z.string().min(1),
  ipk: z.number().min(0).max(4),
  penghasilan: z.string(),
  penghasilan_raw: z.number().nonnegative(),
  tanggungan: z.number().int().nonnegative(),
  jarak: z.string(),
  prestasi: z.string(),
  skor: z.number().min(0).max(1),
  status: RecommendationStatusSchema,
});
export type Pendaftar = z.infer<typeof PendaftarSchema>;

export const KriteriaSchema = z.object({
  key: z.string(),
  label: z.string(),
  bobot: z.number().int().min(0).max(100),
  type: z.enum(["benefit", "cost"]),
});
export type Kriteria = z.infer<typeof KriteriaSchema>;

// Untuk API response dari backend
export const CandidateSchema = z.object({
  rank: z.number(),
  id: z.string(),
  name: z.string(),
  ipk: z.number(),
  parent_income: z.number(),
  topsis_score: z.number(),
  recommendation_status: RecommendationStatusSchema,
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const RankingResultSchema = z.object({
  candidates: z.array(CandidateSchema),
  total: z.number(),
  page: z.number(),
  total_pages: z.number(),
});
export type RankingResult = z.infer<typeof RankingResultSchema>;

/* =========================
   User
========================= */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["mahasiswa", "admin"]),
  student_id: z.string().optional(),
  major: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

/* =========================
   Auth
========================= */
export const RegisterSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});
export type RegisterPayload = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type LoginPayload = z.infer<typeof LoginSchema>;

// OTP Flow — Mahasiswa login via email SSO
export const SendOtpSchema = z.object({
  email: z
    .string()
    .email("Format email tidak valid")
    .endsWith("@students.undip.ac.id", {
      message: "Harus menggunakan email SSO Undip (@students.undip.ac.id)",
    }),
});
export type SendOtpPayload = z.infer<typeof SendOtpSchema>;

export const VerifyOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  otp: z
    .string()
    .length(6, "Kode OTP harus 6 digit")
    .regex(/^\d+$/, "Kode OTP hanya boleh angka"),
});
export type VerifyOtpPayload = z.infer<typeof VerifyOtpSchema>;

// Admin login — pakai adminId + password
export const AdminLoginSchema = z.object({
  adminId: z.string().min(1, "Admin ID wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});
export type AdminLoginPayload = z.infer<typeof AdminLoginSchema>;

// Role enum sesuai database
export const RoleSchema = z.enum(["MAHASISWA_KIPK", "PEWAWANCARA", "ADMIN_DIRMAWA"]);
export type Role = z.infer<typeof RoleSchema>;

/* =========================
   Contact Form
========================= */
export const ContactFormSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  subject: z.string().min(5, "Subjek minimal 5 karakter"),
  message: z.string().min(10, "Pesan minimal 10 karakter"),
});
export type ContactFormData = z.infer<typeof ContactFormSchema>;

/* =========================
   Import Data / Kandidat KIPK
   Header kolom sesuai file Excel asli Dirmawa UNDIP
========================= */
export const CandidateDataSchema = z.object({
  no: z.number().optional(),

  // Identitas & Pendaftaran
  no_pendaftaran_kipk:  z.string().default(""),
  nama:                 z.string().default(""),   // validated client-side via hasErrors
  prodi:                z.string().default(""),
  nik:                  z.string().default(""),
  no_kartu_keluarga:    z.string().default(""),
  nik_kepala_keluarga:  z.string().default(""),
  nisn:                 z.string().default(""),

  // Status Sosial
  status_dtks:    z.string().default(""),
  validasi_dtks:  z.string().default(""),
  status_p3ke:    z.string().default(""),
  validasi_p3ke:  z.string().default(""),
  no_kip:         z.string().default(""),
  validasi_kip:   z.string().default(""),
  no_kks:         z.string().default(""),

  // Asal Sekolah
  asal_sekolah:      z.string().default(""),
  kab_kota_sekolah:  z.string().default(""),
  provinsi_sekolah:  z.string().default(""),

  // Data Diri
  tempat_lahir:   z.string().default(""),
  tanggal_lahir:  z.string().default(""),
  jenis_kelamin:  z.string().default(""),
  alamat_tinggal: z.string().default(""),
  no_hp:          z.string().default(""),
  email:          z.string().default(""),
  sosial_media:   z.string().default(""),

  // Data Ayah
  nama_ayah:           z.string().default(""),
  pekerjaan_ayah:      z.string().default(""),
  ket_pekerjaan_ayah:  z.string().default(""),
  penghasilan_ayah:    z.number().nonnegative().default(0),
  ket_penghasilan_ayah: z.string().default(""),
  status_ayah:         z.string().default(""),

  // Data Ibu
  nama_ibu:            z.string().default(""),
  pekerjaan_ibu:       z.string().default(""),
  ket_pekerjaan_ibu:   z.string().default(""),
  penghasilan_ibu:     z.number().nonnegative().default(0),
  ket_penghasilan_ibu: z.string().default(""),
  status_ibu:          z.string().default(""),

  // Ekonomi Keluarga
  wali:                    z.string().default(""),
  penghasilan_lain:        z.number().nonnegative().default(0),
  jumlah_tanggungan:       z.number().nonnegative().default(0),
  jml_tanggungan_sebenarnya: z.number().nonnegative().default(0),
  nominal_per_kapita:      z.number().nonnegative().default(0),

  // Kondisi Tempat Tinggal
  kepemilikan_rumah:  z.string().default(""),
  tahun_perolehan:    z.string().default(""),
  sumber_listrik:     z.string().default(""),
  luas_tanah:         z.number().nonnegative().default(0),
  luas_bangunan:      z.number().nonnegative().default(0),
  sumber_air:         z.string().default(""),
  mck:                z.string().default(""),
  kondisi_rumah:      z.string().default(""),
  jarak_pusat_kota:   z.number().nonnegative().default(0),

  // Hasil Wawancara
  prestasi:    z.string().default(""),
  rekomendasi: z.string().default(""),
  alasan:      z.string().default(""),
  pewawancara: z.string().default(""),

  // Validation flags
  hasErrors:     z.boolean().default(false),
  missingFields: z.array(z.string()).default([]),
});
export type CandidateData = z.infer<typeof CandidateDataSchema>;

export const ValidationSummarySchema = z.object({
  valid: z.number().nonnegative(),
  incomplete: z.number().nonnegative(),
  duplicates: z.number().nonnegative(),
  total: z.number().nonnegative(),
});
export type ValidationSummary = z.infer<typeof ValidationSummarySchema>;


export const SortKeySchema = z.enum(["rank", "ipk", "penghasilan_raw", "skor"]);
export type SortKey = z.infer<typeof SortKeySchema>;

export const SortDirSchema = z.enum(["asc", "desc"]);
export type SortDir = z.infer<typeof SortDirSchema>;

export const StatusFilterSchema = z.enum([
  "Semua",
  "Prioritas Utama",
  "Direkomendasikan",
  "Cadangan",
]);
export type StatusFilter = z.infer<typeof StatusFilterSchema>;
