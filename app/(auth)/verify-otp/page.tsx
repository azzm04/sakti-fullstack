"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ROLE_REDIRECT: Record<string, string> = {
  MAHASISWA_KIPK: "/mahasiswa/dashboard",
  PEWAWANCARA: "/pewawancara",
  ADMIN_DIRMAWA: "/admin",
};

export default function VerifyOtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const sessionEmail = sessionStorage.getItem("otp_email");

    if (urlEmail) {
      setEmail(urlEmail);
    } else if (sessionEmail) {
      setEmail(sessionEmail);
    } else {
      router.push("/login");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(e?: React.SyntheticEvent) {
    if (e) e.preventDefault();
    if (otp.length < 6) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memverifikasi OTP.");
      }

      // Hapus session storage HANYA setelah sukses
      sessionStorage.removeItem("otp_email");

      setSuccess("Verifikasi Berhasil! Mengalihkan...");

      // Redirect berdasarkan role
      setTimeout(() => {
        router.push(ROLE_REDIRECT[data.user?.role || data.role] ?? "/");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        setOtp("");
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim ulang OTP.");
      }

      setSuccess("Kode OTP baru telah dikirim ke email Anda.");
      setResendCooldown(60);
      setOtp("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-body">
      <div className="absolute inset-0 z-0">
        {/* PERUBAHAN: Opacity diturunkan menjadi 65% atau 70%, dan efek blur dihapus */}
        <div className="absolute inset-0 bg-primary/65 z-10 mix-blend-multiply" />

        {/* Lapisan kedua (opsional) untuk memastikan warnanya tidak terlalu pekat tapi tetap jelas terbaca teksnya */}
        <div className="absolute inset-0 bg-blue-900/40 z-10" />

        <Image
          src="/widyapuraya.jpeg"
          alt="Background Undip"
          fill
          priority
          className="object-cover object-center"
        />
      </div>

      <div className="relative z-20 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 px-6 sm:px-8 py-12 items-center min-h-screen">
        {/* KOLOM KIRI (Hidden di Mobile, Muncul di Desktop) */}
        <div className="hidden lg:flex flex-col text-white pr-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center p-2">
              <Image src="/next.svg" alt="Logo" width={40} height={40} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider uppercase font-headline">
                Sistem SAKTI
              </h1>
              <p className="text-sm text-blue-200">Universitas Diponegoro</p>
            </div>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight font-headline">
            Keamanan Akun <br /> & Verifikasi OTP
          </h2>

          <p className="text-blue-100/80 leading-relaxed text-sm max-w-md text-justify">
            Sebagai langkah keamanan dan validasi identitas, kami telah
            mengirimkan kode otentikasi 6-digit (OTP) ke email SSO Anda. Silakan
            masukkan kode tersebut untuk memverifikasi kepemilikan akun dan
            melanjutkan akses ke dalam portal SAKTI.
          </p>
        </div>

        {/* KOLOM KANAN: Form Card */}
        <div className="w-full flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-[420px] rounded-xl shadow-2xl p-8 sm:p-10 border border-white/20">
            {/* Header Form */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 font-headline">
                Verifikasi OTP
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Kode 6-digit dikirim ke <br />
                <span className="font-semibold text-primary">{email}</span>
              </p>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="py-2.5">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs ml-2 leading-relaxed">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="success" className="py-2.5">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs ml-2 font-medium">
                        {success}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (val.length === 6) {
                      setTimeout(() => handleVerify(), 150);
                    }
                  }}
                  disabled={loading || !!success}
                >
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={0}
                      className="w-10 h-12 text-lg font-bold"
                    />
                    <InputOTPSlot
                      index={1}
                      className="w-10 h-12 text-lg font-bold"
                    />
                    <InputOTPSlot
                      index={2}
                      className="w-10 h-12 text-lg font-bold"
                    />
                  </InputOTPGroup>
                  <div className="mx-2 text-slate-300">—</div>
                  <InputOTPGroup>
                    <InputOTPSlot
                      index={3}
                      className="w-10 h-12 text-lg font-bold"
                    />
                    <InputOTPSlot
                      index={4}
                      className="w-10 h-12 text-lg font-bold"
                    />
                    <InputOTPSlot
                      index={5}
                      className="w-10 h-12 text-lg font-bold"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.length < 6 || !!success}
                className="w-full flex items-center justify-center gap-2 h-11 mt-2 font-bold rounded-lg bg-[#3b5998] hover:bg-[#3b5998]/90 text-white shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Verifikasi Kode
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-500">
                  Tidak menerima kode?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading || !!success}
                    className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {resendCooldown > 0
                      ? `Kirim ulang (${resendCooldown}s)`
                      : "Kirim ulang"}
                  </button>
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-center text-xs text-slate-500">
                <Link
                  href="/login"
                  className="hover:text-primary transition-colors flex items-center gap-1 font-medium text-slate-400"
                >
                  ← Kembali ke Halaman Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}