"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  AuthLayout,
  AuthBranding,
  AuthCardWrapper,
} from "@/components/auth";

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
  // "pewawancara" | "mahasiswa" | "kipk-sso" — menentukan endpoint resend yang tepat
  const [loginFlow, setLoginFlow] = useState<"pewawancara" | "mahasiswa" | "kipk-sso">("mahasiswa");
  const [kandidatId, setKandidatId] = useState("");

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    const sessionEmail = sessionStorage.getItem("otp_email");
    const flow =
      searchParams.get("flow") ??
      sessionStorage.getItem("otp_flow") ??
      "mahasiswa";
    setLoginFlow(
      flow === "pewawancara" ? "pewawancara" : flow === "kipk-sso" ? "kipk-sso" : "mahasiswa",
    );
    setKandidatId(sessionStorage.getItem("otp_kandidat_id") ?? "");

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

      sessionStorage.removeItem("otp_email");
      sessionStorage.removeItem("otp_flow");
      setSuccess("Verifikasi Berhasil! Mengalihkan...");

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

    const resendEndpoint =
      loginFlow === "pewawancara"
        ? "/api/auth/pewawancara/login"
        : loginFlow === "kipk-sso"
          ? "/api/auth/send-otp-sso"
          : "/api/auth/login";

    const resendBody =
      loginFlow === "kipk-sso"
        ? { kandidat_id: kandidatId, email_sso: email }
        : { email };

    try {
      const res = await fetch(resendEndpoint, {
        method: "POST",
        body: JSON.stringify(resendBody),
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

  const backHref = loginFlow === "pewawancara" ? "/pewawancara-login" : "/login";

  return (
    <AuthLayout
      branding={
        <AuthBranding
          title="Keamanan Akun & Verifikasi OTP"
          subtitle="Universitas Diponegoro"
          description="Sebagai langkah keamanan dan validasi identitas, kami telah mengirimkan kode otentikasi 6-digit (OTP) ke email Anda. Silakan masukkan kode tersebut untuk memverifikasi kepemilikan akun dan melanjutkan akses ke dalam portal SAKTI."
        />
      }
    >
      <AuthCardWrapper
        icon={<ShieldCheck className="w-6 h-6" />}
        title="Verifikasi OTP"
        subtitle={`Kode 6-digit dikirim ke ${email}`}
      >
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
                <InputOTPSlot index={0} className="w-10 h-12 text-lg font-bold" />
                <InputOTPSlot index={1} className="w-10 h-12 text-lg font-bold" />
                <InputOTPSlot index={2} className="w-10 h-12 text-lg font-bold" />
              </InputOTPGroup>
              <div className="mx-2 text-muted-foreground">—</div>
              <InputOTPGroup>
                <InputOTPSlot index={3} className="w-10 h-12 text-lg font-bold" />
                <InputOTPSlot index={4} className="w-10 h-12 text-lg font-bold" />
                <InputOTPSlot index={5} className="w-10 h-12 text-lg font-bold" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.length < 6 || !!success}
            className="w-full flex items-center justify-center gap-2 h-11 mt-2 font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
            <p className="text-xs text-muted-foreground">
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

          <div className="pt-6 border-t border-border flex justify-center text-xs text-muted-foreground">
            <Link
              href={backHref}
              className="hover:text-primary transition-colors flex items-center gap-1 font-medium"
            >
              ← Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </AuthCardWrapper>
    </AuthLayout>
  );
}
