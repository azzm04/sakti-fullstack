"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  FileText,
  Mail,
  ArrowLeft,
} from "lucide-react";
import {
  AuthLayout,
  AuthBranding,
  AuthCardWrapper,
  AuthFooterLinks,
} from "@/components/auth";

export default function VerifyKandidatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    no_pendaftaran_kipk: "",
    nama: "",
    email: "",
  });

  const [emailSSO, setEmailSSO] = useState("");
  const [kandidatId, setKandidatId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Cek link personal (?token=...) dari email "Lolos" — kalau valid & belum
  // pernah dipakai, skip langsung ke step OTP tanpa isi ulang 3 data manual.
  // Gagal (token salah/kedaluwarsa/sudah dipakai) → tetap jatuh ke form
  // manual step 1 seperti biasa, tidak ada yang buntu.
  const [checkingToken, setCheckingToken] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) return;

    setCheckingToken(true);
    fetch("/api/auth/verify-kandidat/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Link tidak valid");

        setKandidatId(data.kandidat.id);
        setSuccess("Identitas Anda terverifikasi otomatis. Silakan masukkan email SSO Undip Anda.");
        setStep(2);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Link tidak valid atau sudah kedaluwarsa. Silakan verifikasi manual di bawah.",
        );
      })
      .finally(() => setCheckingToken(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerifyData = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-kandidat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verifikasi gagal");
      }

      setKandidatId(data.kandidat.id);
      setSuccess("Data terverifikasi! Silakan masukkan email SSO Undip Anda.");
      setStep(2);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpSSO = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp-sso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kandidat_id: kandidatId,
          email_sso: emailSSO,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim OTP");
      }

      setSuccess(data.message);

      if (typeof window !== "undefined") {
        sessionStorage.setItem("otp_email", emailSSO.trim().toLowerCase());
        sessionStorage.setItem("otp_flow", "kipk-sso");
        sessionStorage.setItem("otp_kandidat_id", kandidatId ?? "");
      }

      setTimeout(() => {
        router.push(
          `/verify-otp?email=${encodeURIComponent(emailSSO.trim().toLowerCase())}`,
        );
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan yang tidak diketahui.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      branding={
        <AuthBranding
          title="Verifikasi Data Mahasiswa KIP-Kuliah"
          subtitle="Universitas Diponegoro"
          description="Platform SAKTI Universitas Diponegoro memfasilitasi tata kelola beasiswa KIP-Kuliah secara terpadu. Bagi mahasiswa baru yang telah dinyatakan LOLOS seleksi, silakan lakukan verifikasi data pendaftaran dan tautkan Email SSO (@students.undip.ac.id) Anda untuk mengaktifkan akun SAKTI."
        />
      }
    >
      <AuthCardWrapper
        icon={<User className="w-6 h-6" />}
        title="Verifikasi Maba"
        subtitle={
          step === 1
            ? "Verifikasi data pendaftaran KIP-K Anda"
            : "Tautkan Email SSO Undip Anda"
        }
      >
        {error && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-500 text-green-700 bg-green-50 py-2.5">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="text-xs ml-2 font-medium">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {checkingToken && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Memeriksa link verifikasi...
          </div>
        )}

        {!checkingToken && step === 1 && (
          <form onSubmit={handleVerifyData} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary">
                Nomor Pendaftaran KIPK
              </Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="No Pendaftaran KIP-Kuliah"
                  className="pl-10 h-11 text-sm bg-muted border-border focus:bg-tertiary"
                  value={formData.no_pendaftaran_kipk}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      no_pendaftaran_kipk: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary">
                Nama Lengkap
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Sesuai Pendaftaran Awal KIPK"
                  className="pl-10 h-11 text-sm bg-muted border-border focus:bg-tertiary"
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary">
                Email Pribadi
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email saat daftar KIPK"
                  className="pl-10 h-11 text-sm bg-muted border-border focus:bg-tertiary"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mencari Data...
                </>
              ) : (
                "Verifikasi Sekarang"
              )}
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSendOtpSSO} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary">
                Email SSO Undip
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="nim@students.undip.ac.id"
                  className="pl-10 h-11 text-sm bg-muted border-border focus:bg-tertiary"
                  value={emailSSO}
                  onChange={(e) => setEmailSSO(e.target.value)}
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                Gunakan email institusi berakhiran{" "}
                <span className="font-semibold text-primary">
                  @students.undip.ac.id
                </span>
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 mt-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Kode OTP"
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-xs text-muted-foreground hover:text-primary mt-4 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Kembali ke form sebelumnya
            </button>
          </form>
        )}

        <AuthFooterLinks>
          <span>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-semibold"
            >
              Login di sini
            </Link>
          </span>
        </AuthFooterLinks>
      </AuthCardWrapper>
    </AuthLayout>
  );
}
