import axios from "axios";

// ── Base URL FastAPI (chat) ───────────────────────────────────────────────────
const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: FASTAPI_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Chat API (FastAPI) ────────────────────────────────────────────────────────
export const chatAPI = {
  // POST /api/chat — { pesan, gambar_base64? }
  sendMessage: async (message: string, gambarBase64?: string | null) => {
    const res = await apiClient.post("/api/chat", {
      pesan: message,
      gambar_base64: gambarBase64 ?? null,
    });
    return res.data;
  },
};

// ── Telegram API (Next.js routes) ────────────────────────────────────────────
export const telegramAPI = {
  // POST /api/auth/telegram/activate — generate token & deep link
  activate: async () => {
    const res = await fetch("/api/auth/telegram/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return res.json();
  },

  // GET /api/auth/telegram/status — cek status koneksi Telegram mahasiswa
  getStatus: async () => {
    const res = await fetch("/api/auth/telegram/status");
    return res.json();
  },
};

// ── Auth API (Next.js routes) ─────────────────────────────────────────────────
export const authAPI = {
  // POST /api/auth/send-otp — { email, nama? }
  sendOtp: async (email: string, nama?: string) => {
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nama }),
    });
    return res.json();
  },

  // POST /api/auth/verify-otp — { email, otp }
  verifyOtp: async (email: string, otp: string) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  // POST /api/auth/admin/login — { username, password }
  adminLogin: async (username: string, password: string) => {
    const res = await fetch("/api/auth/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return res.json();
  },

  // POST /api/auth/logout
  logout: async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    return res.json();
  },

  // GET /api/auth/me
  me: async () => {
    const res = await fetch("/api/auth/me");
    return res.json();
  },
};

// ── Kandidat API (Next.js routes) ─────────────────────────────────────────────
export const kandidatAPI = {
  // GET /api/kandidat?page=&limit=&search=&batchId=
  list: async (params?: { page?: number; limit?: number; search?: string; batchId?: string }) => {
    const q = new URLSearchParams();
    if (params?.page)    q.set("page",    String(params.page));
    if (params?.limit)   q.set("limit",   String(params.limit));
    if (params?.search)  q.set("search",  params.search);
    if (params?.batchId) q.set("batchId", params.batchId);
    const res = await fetch(`/api/kandidat?${q}`);
    return res.json();
  },

  // POST /api/kandidat — bulk import
  import: async (payload: { fileName: string; validation: object; data: object[] }) => {
    const res = await fetch("/api/kandidat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};

// ── Evaluasi API (Next.js routes) ─────────────────────────────────────────────
export const evaluasiAPI = {
  // GET /api/admin/evaluasi?search=&filter=&page=
  list: async (params?: { search?: string; filter?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.filter) q.set("filter", params.filter);
    if (params?.page)   q.set("page",   String(params.page));
    const res = await fetch(`/api/admin/evaluasi?${q}`);
    return res.json();
  },

  // GET /api/admin/evaluasi/[id]
  get: async (id: string | number) => {
    const res = await fetch(`/api/admin/evaluasi/${id}`);
    return res.json();
  },

  // PATCH /api/admin/evaluasi/[id]
  update: async (id: string | number, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/evaluasi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // DELETE /api/admin/evaluasi/[id] — reset kolom wawancara
  reset: async (id: string | number) => {
    const res = await fetch(`/api/admin/evaluasi/${id}`, { method: "DELETE" });
    return res.json();
  },
};

// ── Pewawancara API (Next.js routes) ──────────────────────────────────────────
export const pewawancaraAPI = {
  // GET /api/admin/pewawancara?search=
  list: async (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/admin/pewawancara${q}`);
    return res.json();
  },

  // POST /api/admin/pewawancara
  create: async (data: { email: string; nama: string; sso_id?: string }) => {
    const res = await fetch("/api/admin/pewawancara", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // PATCH /api/admin/pewawancara/[id]
  update: async (id: number, data: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/pewawancara/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // DELETE /api/admin/pewawancara/[id]
  delete: async (id: number) => {
    const res = await fetch(`/api/admin/pewawancara/${id}`, { method: "DELETE" });
    return res.json();
  },
};

// ── Sesi WAR API (Next.js routes) ─────────────────────────────────────────────
export const sesiAPI = {
  // GET /api/admin/sesi?tanggal=YYYY-MM-DD
  get: async (tanggal?: string) => {
    const q = tanggal ? `?tanggal=${tanggal}` : "";
    const res = await fetch(`/api/admin/sesi${q}`);
    return res.json();
  },

  // POST /api/admin/sesi — buat sesi baru
  create: async (data: { tanggal: string; kuota_pewawancara?: number; kuota_mahasiswa?: number }) => {
    const res = await fetch("/api/admin/sesi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // PATCH /api/admin/sesi — toggle WAR / update kuota
  update: async (data: { id: number; war_aktif?: boolean; kuota_pewawancara?: number; kuota_mahasiswa?: number }) => {
    const res = await fetch("/api/admin/sesi", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // DELETE /api/admin/sesi?slot_id= — hapus slot pewawancara
  deleteSlot: async (slotId: number) => {
    const res = await fetch(`/api/admin/sesi?slot_id=${slotId}`, { method: "DELETE" });
    return res.json();
  },

  // POST /api/admin/sesi/distribusi — distribusi mahasiswa ke pewawancara
  distribusi: async (sesiId: number) => {
    const res = await fetch("/api/admin/sesi/distribusi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sesi_id: sesiId }),
    });
    return res.json();
  },
};

// ── WAR API (Next.js routes) ──────────────────────────────────────────────────
export const warAPI = {
  // GET /api/war — status WAR hari ini
  status: async () => {
    const res = await fetch("/api/war");
    return res.json();
  },

  // POST /api/war — klaim slot
  klaim: async () => {
    const res = await fetch("/api/war", { method: "POST" });
    return res.json();
  },

  // DELETE /api/war — un-war (batalkan slot sendiri)
  unwar: async () => {
    const res = await fetch("/api/war", { method: "DELETE" });
    return res.json();
  },
};

// ── Mahasiswa (pewawancara) API (Next.js routes) ───────────────────────────────
export const mahasiswaAPI = {
  // GET /api/pewawancara/mahasiswa?mode=saya|hari_ini|semua&search=&page=
  list: async (params?: { mode?: string; search?: string; page?: number }) => {
    const q = new URLSearchParams();
    if (params?.mode)   q.set("mode",   params.mode);
    if (params?.search) q.set("search", params.search);
    if (params?.page)   q.set("page",   String(params.page));
    const res = await fetch(`/api/pewawancara/mahasiswa?${q}`);
    return res.json();
  },
};
