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
   UI / Filter helpers
========================= */
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
