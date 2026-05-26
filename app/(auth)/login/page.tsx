"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, AlertCircle, LogIn } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AuthLayout,
  AuthBranding,
  AuthCardWrapper,
  AuthFooterLinks,
} from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan, coba lagi.");
      }

      sessionStorage.setItem("otp_email", email.trim().toLowerCase());
      router.push(
        `/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`,
      );
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
    <AuthLayout
      branding={
        <AuthBranding
          title="Portal Login Mahasiswa KIP-Kuliah"
          subtitle="Universitas Diponegoro"
          description="Portal khusus bagi Mahasiswa Aktif penerima beasiswa KIP-Kuliah Universitas Diponegoro. Silakan masuk menggunakan Email SSO (@students.undip.ac.id) Anda untuk mengakses layanan informasi, pelaporan monitoring evaluasi (Monev), dan kanal pengaduan resmi."
        />
      }
    >
      <AuthCardWrapper
        icon={<LogIn className="w-6 h-6" />}
        title="Masuk ke SAKTI"
        subtitle="Gunakan email SSO Undip Anda"
      >
        {/* Alert Pesan Error */}
        {error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary">
              Email SSO Undip
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@students.undip.ac.id"
                required
                className="w-full pl-10 h-11 text-sm bg-muted border border-border rounded-lg focus:bg-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex justify-center items-center gap-2 h-11 mt-2 font-bold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Mengirim OTP...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                Kirim Kode OTP
              </>
            )}
          </button>
        </form>

        {/* Footer / Links */}
        <AuthFooterLinks>
          <span>
            Mahasiswa KIPK Baru?{" "}
            <Link
              href="/verify-kandidat"
              className="text-primary hover:underline font-semibold"
            >
              Verifikasi
            </Link>
          </span>
        </AuthFooterLinks>
      </AuthCardWrapper>
    </AuthLayout>
  );
}
