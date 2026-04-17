"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, User, ArrowRight, ChevronRight } from "lucide-react";

/**
 * Flow login mahasiswa:
 *
 * Step 1 — Pilih jalur:
 *   A) Sudah punya SSO → langsung input email @students.undip.ac.id
 *   B) Belum punya SSO → input nama + email pribadi
 *
 * Step 2 — Verifikasi OTP (redirect ke /verify-otp)
 *
 * Step 3 (Jalur B setelah OTP) — Input email SSO (opsional, bisa skip)
 *   → ditangani di /verify-otp setelah OTP sukses
 */

type Jalur = "sso" | "pribadi" | null;

export default function LoginPage() {
  const router  = useRouter();
  const [jalur, setJalur]   = useState<Jalur>(null);
  const [nama, setNama]     = useState("");
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const isSso    = jalur === "sso";
  const isPribadi = jalur === "pribadi";

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!jalur) return;
    setLoading(true);
    setError("");

    const body: Record<string, string> = { email: email.trim().toLowerCase() };
    if (isPribadi && nama.trim()) body.nama = nama.trim();

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Terjadi kesalahan, coba lagi.");
      setLoading(false);
      return;
    }

    // Simpan ke sessionStorage untuk halaman verify-otp
    sessionStorage.setItem("otp_email", email.trim().toLowerCase());
    sessionStorage.setItem("otp_jalur", jalur); // "sso" | "pribadi"
    router.push("/verify-otp");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-body">
      <div className="w-full max-w-sm px-4">

        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-primary">SAKTI</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Asisten KIPK Terpadu dan Interaktif</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Masuk ke SAKTI</h2>
          <p className="text-sm text-slate-500 mb-6">Pilih cara masuk sesuai kondisi Anda</p>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Pilih jalur ── */}
            {!jalur && (
              <motion.div
                key="pilih"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <button
                  onClick={() => setJalur("sso")}
                  className="w-full flex items-center justify-between gap-3 p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Sudah punya email SSO</p>
                      <p className="text-xs text-slate-500">nim@students.undip.ac.id</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                </button>

                <button
                  onClick={() => setJalur("pribadi")}
                  className="w-full flex items-center justify-between gap-3 p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <User size={16} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Belum punya email SSO</p>
                      <p className="text-xs text-slate-500">Gunakan email pribadi aktif</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-primary transition-colors" />
                </button>
              </motion.div>
            )}

            {/* ── Step 2: Form input ── */}
            {jalur && (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {/* Back */}
                <button
                  type="button"
                  onClick={() => { setJalur(null); setError(""); setEmail(""); setNama(""); }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors mb-2"
                >
                  ← Ganti pilihan
                </button>

                {/* Label konteks */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
                  isSso ? "bg-primary/8 text-primary" : "bg-slate-100 text-slate-600"
                }`}>
                  {isSso ? <Mail size={13} /> : <User size={13} />}
                  {isSso ? "Login dengan Email SSO Undip" : "Login dengan Email Pribadi"}
                </div>

                {/* Nama — hanya untuk jalur pribadi */}
                {isPribadi && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Sesuai data pendaftaran KIPK"
                      required
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {isSso ? "Email SSO Undip" : "Email Aktif"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isSso ? "nim@students.undip.ac.id" : "emailkamu@gmail.com"}
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                      focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  />
                  {isPribadi && (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Harus cocok dengan email yang terdaftar di data KIPK.
                    </p>
                  )}
                </div>

                {error && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email || (isPribadi && !nama)}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={15} />
                  )}
                  {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Admin DIRMAWA?{" "}
          <a href="/admin-login" className="text-primary hover:underline font-medium">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}
