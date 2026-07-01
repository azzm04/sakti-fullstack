"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, AlertCircle, UserCheck } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AuthLayout,
  AuthBranding,
  AuthCardWrapper,
  AuthFooterLinks,
} from "@/components/auth";

export default function PewawancaraLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/pewawancara/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan, coba lagi.");
      }

      sessionStorage.setItem("otp_email", email.trim().toLowerCase());
      sessionStorage.setItem("otp_flow", "pewawancara");
      router.push(
        `/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}&flow=pewawancara`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan yang tidak diketahui.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      branding={
        <AuthBranding
          title="Portal Login Pewawancara"
          subtitle="Universitas Diponegoro"
          description="Portal khusus bagi pewawancara yang bertugas dalam seleksi wawancara KIP-Kuliah Universitas Diponegoro. Masukkan email yang terdaftar untuk menerima kode OTP."
        />
      }
    >
      <AuthCardWrapper
        icon={<UserCheck className="w-6 h-6" />}
        title="Masuk sebagai Pewawancara"
        subtitle="Gunakan email yang terdaftar di sistem"
      >
        {error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-secondary">
              Email Pewawancara
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@undip.ac.id"
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

        <AuthFooterLinks>
          <span>
            Mahasiswa KIPK?{" "}
            <Link href="/login" className="text-primary hover:underline font-semibold">
              Login di sini
            </Link>
          </span>
        </AuthFooterLinks>
      </AuthCardWrapper>
    </AuthLayout>
  );
}
