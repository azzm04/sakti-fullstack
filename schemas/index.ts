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

// OTP Flow — bisa pakai email pribadi atau SSO
export const SendOtpSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  nama: z.string().optional(), // wajib untuk jalur email pribadi
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
   Sesuai tabel kandidat di database
========================= */
export const CandidateDataSchema = z.object({
  no: z.number().optional(),

  // Data Awal (1–23)
  no_pendaftaran_kipk: z.string().default(""),
  no_bantuan_sosial:   z.string().default(""),
  nama:                z.string().default(""),
  prodi:               z.string().default(""),
  nik:                 z.string().default(""),
  no_kartu_keluarga:   z.string().default(""),
  nisn:                z.string().default(""),
  asal_sekolah:        z.string().default(""),
  status_dtsen:        z.string().default(""),
  jumlah_tanggungan:   z.number().nonnegative().default(0),
  jumlah_orang_rumah:  z.number().nonnegative().default(0),
  pekerjaan_ayah:      z.string().default(""),
  pekerjaan_ibu:       z.string().default(""),
  penghasilan_ayah:    z.number().nonnegative().default(0),
  penghasilan_ibu:     z.number().nonnegative().default(0),
  kab_kota:            z.string().default(""),
  provinsi:            z.string().default(""),
  alamat:              z.string().default(""),
  pbb:                 z.number().nonnegative().default(0),
  daya_listrik:        z.string().default(""),
  no_hp:               z.string().default(""),
  email:               z.string().default(""),

  // Koordinat
  koordinat:  z.string().default(""),
  latitude:   z.number().default(0),
  longitude:  z.number().default(0),

  // Validasi (24–46) — diisi pewawancara
  validasi_kks:              z.string().default(""),
  validasi_kip:              z.string().default(""),
  validasi_sktm:             z.string().default(""),
  sosial_media:              z.string().default(""),
  ket_pekerjaan_ayah:        z.string().default(""),
  ket_penghasilan_ayah:      z.string().default(""),
  ket_pekerjaan_ibu:         z.string().default(""),
  ket_penghasilan_ibu:       z.string().default(""),
  penghasilan_lain:          z.number().nonnegative().default(0),
  jml_tanggungan_sebenarnya: z.number().nonnegative().default(0),
  validasi_orang_rumah:      z.number().nonnegative().default(0),
  kepemilikan_rumah:         z.string().default(""),
  tahun_perolehan:           z.string().default(""),
  luas_tanah:                z.number().nonnegative().default(0),
  luas_bangunan:             z.number().nonnegative().default(0),
  sumber_air:                z.string().default(""),
  mck:                       z.string().default(""),
  aset:                      z.string().default(""),
  kondisi_rumah:             z.string().default(""),
  jarak_pusat_kota:          z.number().nonnegative().default(0),
  rekomendasi:               z.string().default(""),
  alasan:                    z.string().default(""),
  pewawancara:               z.string().default(""),

  // Validation flags (client-side only)
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

/* =========================
   Kandidat DB (full row)
========================= */
export const KandidatSchema = z.object({
  id:                        z.union([z.string(), z.number()]),
  import_batch_id:           z.number().nullable().optional(),
  no:                        z.number(),
  no_pendaftaran_kipk:       z.string().default(""),
  no_bantuan_sosial:         z.string().default(""),
  nama:                      z.string().default(""),
  prodi:                     z.string().default(""),
  nik:                       z.string().default(""),
  no_kartu_keluarga:         z.string().default(""),
  nisn:                      z.string().default(""),
  asal_sekolah:              z.string().default(""),
  status_dtsen:              z.string().default(""),
  jumlah_tanggungan:         z.number().default(0),
  jumlah_orang_rumah:        z.number().default(0),
  pekerjaan_ayah:            z.string().default(""),
  pekerjaan_ibu:             z.string().default(""),
  penghasilan_ayah:          z.number().default(0),
  penghasilan_ibu:           z.number().default(0),
  kab_kota:                  z.string().default(""),
  provinsi:                  z.string().default(""),
  alamat:                    z.string().default(""),
  pbb:                       z.number().default(0),
  daya_listrik:              z.string().default(""),
  no_hp:                     z.string().default(""),
  email:                     z.string().default(""),
  koordinat:                 z.string().default(""),
  latitude:                  z.number().default(0),
  longitude:                 z.number().default(0),
  // Validasi wawancara
  validasi_kks:              z.string().default(""),
  validasi_kip:              z.string().default(""),
  validasi_sktm:             z.string().default(""),
  sosial_media:              z.string().default(""),
  ket_pekerjaan_ayah:        z.string().default(""),
  ket_penghasilan_ayah:      z.string().default(""),
  ket_pekerjaan_ibu:         z.string().default(""),
  ket_penghasilan_ibu:       z.string().default(""),
  penghasilan_lain:          z.number().default(0),
  jml_tanggungan_sebenarnya: z.number().default(0),
  validasi_orang_rumah:      z.number().default(0),
  kepemilikan_rumah:         z.string().default(""),
  tahun_perolehan:           z.string().default(""),
  luas_tanah:                z.number().default(0),
  luas_bangunan:             z.number().default(0),
  sumber_air:                z.string().default(""),
  mck:                       z.string().default(""),
  aset:                      z.string().default(""),
  kondisi_rumah:             z.string().default(""),
  jarak_pusat_kota:          z.number().default(0),
  rekomendasi:               z.string().default(""),
  alasan:                    z.string().default(""),
  pewawancara:               z.string().default(""),
  hasil_akhir:               z.number().nullable().optional(),
  jalur_masuk:               z.string().default(""),
  skor_total:                z.number().default(0),
  ranking:                   z.number().nullable().optional(),
  status_wawancara:          z.string().default("pending"),
  pewawancara_id:            z.number().nullable().optional(),
  interviewed_at:            z.string().nullable().optional(),
  status_seleksi:            z.string().nullable().optional(),
  catatan_admin:             z.string().nullable().optional(),
  created_at:                z.string().optional(),
  updated_at:                z.string().optional(),
  // Join field dari API
  pewawancara_data: z.object({
    id:     z.number(),
    nama:   z.string(),
    email:  z.string(),
    sso_id: z.string().nullable().optional(),
  }).nullable().optional(),
});
export type Kandidat = z.infer<typeof KandidatSchema>;

/* =========================
   Evaluasi list item (admin)
========================= */
export const MahasiswaEvaluasiSchema = z.object({
  id:                        z.string(),
  no:                        z.number(),
  no_pendaftaran_kipk:       z.string(),
  nama:                      z.string(),
  prodi:                     z.string(),
  nik:                       z.string().optional(),
  no_hp:                     z.string().optional(),
  email:                     z.string().optional(),
  hasil_akhir:               z.number().nullable().optional(),
  alasan:                    z.string().optional(),
  pewawancara:               z.string().optional(),
  status_wawancara:          z.string().optional(),
  pewawancara_id:            z.number().nullable().optional(),
  // Field validasi wawancara — untuk cek kelengkapan
  jalur_masuk:               z.string().optional(),
  validasi_kks:              z.string().optional(),
  validasi_kip:              z.string().optional(),
  validasi_sktm:             z.string().optional(),
  sosial_media:              z.string().optional(),
  ket_pekerjaan_ayah:        z.string().optional(),
  ket_penghasilan_ayah:      z.string().optional(),
  ket_pekerjaan_ibu:         z.string().optional(),
  ket_penghasilan_ibu:       z.string().optional(),
  jml_tanggungan_sebenarnya: z.number().optional(),
  validasi_orang_rumah:      z.number().optional(),
  kepemilikan_rumah:         z.string().optional(),
  tahun_perolehan:           z.string().optional(),
  luas_tanah:                z.number().optional(),
  luas_bangunan:             z.number().optional(),
  sumber_air:                z.string().optional(),
  mck:                       z.string().optional(),
  kondisi_rumah:             z.string().optional(),
  jarak_pusat_kota:          z.number().optional(),
});
export type MahasiswaEvaluasi = z.infer<typeof MahasiswaEvaluasiSchema>;

/* =========================
   Pewawancara DB
========================= */
export const PewawancaraSchema = z.object({
  id:              z.number(),
  email:           z.string(),
  nama:            z.string().nullable(),
  sso_id:          z.string().nullable().optional(),
  total_assigned:  z.number().default(0),
  total_completed: z.number().default(0),
  is_active:       z.boolean().default(true),
  created_at:      z.string().optional(),
});
export type Pewawancara = z.infer<typeof PewawancaraSchema>;

/* =========================
   Sesi WAR
========================= */
export const SesiWawancaraSchema = z.object({
  id:                z.number(),
  tanggal:           z.string(),
  kuota_pewawancara: z.number(),
  kuota_mahasiswa:   z.number(),
  war_aktif:         z.boolean(),
  war_dibuka_at:     z.string().nullable().optional(),
  war_ditutup_at:    z.string().nullable().optional(),
  distribusi_done:   z.boolean(),
});
export type SesiWawancara = z.infer<typeof SesiWawancaraSchema>;

export const SlotPewawancaraSchema = z.object({
  id:            z.number(),
  slot_ke:       z.number(),
  claimed_at:    z.string(),
  pewawancara_id: z.number(),
  pewawancara:   z.object({ nama: z.string(), email: z.string() }).nullable().optional(),
});
export type SlotPewawancara = z.infer<typeof SlotPewawancaraSchema>;

/* =========================
   WAR Status (pewawancara dashboard)
========================= */
export const WarStatusSchema = z.object({
  war_aktif:   z.boolean(),
  slot_terisi: z.number(),
  slot_saya:   z.object({ slot_ke: z.number(), claimed_at: z.string() }).nullable(),
  sesi:        SesiWawancaraSchema.pick({
    id: true, tanggal: true, kuota_pewawancara: true,
    kuota_mahasiswa: true, war_dibuka_at: true, distribusi_done: true,
  }).nullable(),
  slots: z.array(z.object({
    slot_ke:     z.number(),
    pewawancara: z.object({ nama: z.string() }).nullable().optional(),
  })),
});
export type WarStatus = z.infer<typeof WarStatusSchema>;

/* =========================
   Mahasiswa list (pewawancara)
========================= */
export const MahasiswaListItemSchema = z.object({
  id:                  z.string(),
  no:                  z.number(),
  no_pendaftaran_kipk: z.string(),
  nama:                z.string(),
  prodi:               z.string(),
  rekomendasi:         z.string().optional(),
  pewawancara:         z.string().optional(),
  status_wawancara:    z.string().optional(),
  pewawancara_id:      z.number().nullable().optional(),
});
export type MahasiswaListItem = z.infer<typeof MahasiswaListItemSchema>;

export const MahasiswaApiResponseSchema = z.object({
  data:               z.array(MahasiswaListItemSchema),
  total:              z.number(),
  page:               z.number(),
  totalPages:         z.number(),
  jatah_selesai:      z.number().optional(),
  jatah_total:        z.number().optional(),
  jatah_sudah_selesai: z.boolean().optional(),
  locked:             z.boolean().optional(),
  error:              z.string().optional(),
});
export type MahasiswaApiResponse = z.infer<typeof MahasiswaApiResponseSchema>;

/* =========================
   Kalkulasi SMART-TOPSIS
========================= */
export const KandidatResultSchema = z.object({
  id:                  z.union([z.string(), z.number()]),
  no:                  z.number().optional(),
  no_pendaftaran_kipk: z.string(),
  nama:                z.string(),
  prodi:               z.string(),
  jalur_masuk:         z.string().default(""),
  skor_total:          z.number(),
  ranking:             z.number(),
  lolos:               z.boolean(),
});
export type KandidatResult = z.infer<typeof KandidatResultSchema>;

/* =========================
   Seleksi (API SMART-TOPSIS eksternal)
========================= */
export const RankedKandidatSchema = z.object({
  rank:                z.number(),
  id:                  z.union([z.string(), z.number()]),
  nama:                z.string(),
  prodi:               z.string(),
  no_pendaftaran_kipk: z.string(),
  skor:                z.number().optional(),
  rekomendasi:         z.string().optional(),
}).catchall(z.unknown());
export type RankedKandidat = z.infer<typeof RankedKandidatSchema>;

export const TopsisApiResultSchema = z.object({
  data:  z.array(RankedKandidatSchema).optional(),
  total: z.number().optional(),
}).catchall(z.unknown());
export type TopsisApiResult = z.infer<typeof TopsisApiResultSchema>;

/* =========================
   Evaluasi stats API response
========================= */
export const EvaluasiApiResponseSchema = z.object({
  data:         z.array(MahasiswaEvaluasiSchema),
  total:        z.number(),
  page:         z.number(),
  totalPages:   z.number(),
  totalSelesai: z.number(),
  totalBelum:   z.number(),
});
export type EvaluasiApiResponse = z.infer<typeof EvaluasiApiResponseSchema>;
