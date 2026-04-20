"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Home,
} from "lucide-react";

export default function VerifyKandidatPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    no_pendaftaran_kipk: "",
    nama: "",
    email: "",
  });

  const [emailSSO, setEmailSSO] = useState("");
  const [kandidatId, setKandidatId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // VERIFIKASI DATA PENDAFTARAN KIP-KULIAH
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

  // KIRIM OTP KE EMAIL SSO UNDIP
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
        sessionStorage.setItem("otp_jalur", "sso");
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-primary/65 z-10 mix-blend-multiply" />
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
              <h1 className="text-xl font-bold tracking-wider uppercase">
                Sistem SAKTI
              </h1>
              <p className="text-sm text-blue-200">Universitas Diponegoro</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-6 leading-tight">
            Verifikasi Data <br /> Mahasiswa KIP-Kuliah
          </h2>

          <p className="text-blue-100/80 leading-relaxed text-sm max-w-md text-justify">
            Platform SAKTI Universitas Diponegoro memfasilitasi tata kelola
            beasiswa KIP-Kuliah secara terpadu. Bagi mahasiswa baru yang telah
            dinyatakan LOLOS seleksi, silakan lakukan verifikasi data
            pendaftaran dan tautkan Email SSO (@students.undip.ac.id) Anda untuk
            mengaktifkan akun SAKTI.
          </p>
        </div>

        {/* KOLOM KANAN: Form Card */}
        <div className="w-full flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-[420px] rounded-xl shadow-2xl p-8 sm:p-10 border border-white/20">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary mb-4">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Verifikasi Maba
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {step === 1
                  ? "Verifikasi data pendaftaran KIP-K Anda"
                  : "Tautkan Email SSO Undip Anda"}
              </p>
            </div>

            <div className="space-y-5">
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

              {step === 1 && (
                <form onSubmit={handleVerifyData} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">
                      Nomor Pendaftaran KIPK
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="No Pendaftaran KIP-Kuliah"
                        className="pl-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white"
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
                    <Label className="text-xs font-semibold text-slate-600">
                      Nama Lengkap
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Sesuai Pendaftaran Awal KIPK"
                        className="pl-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                        value={formData.nama}
                        onChange={(e) =>
                          setFormData({ ...formData, nama: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600">
                      Email Pribadi
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="Email saat daftar KIPK"
                        className="pl-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white"
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
                    className="w-full h-11 mt-2 font-bold bg-[#3b5998] hover:bg-[#3b5998]/90 text-white shadow-md transition-all"
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
                    <Label className="text-xs font-semibold text-slate-600">
                      Email SSO Undip
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        placeholder="nim@students.undip.ac.id"
                        className="pl-10 h-11 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                        value={emailSSO}
                        onChange={(e) => setEmailSSO(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Gunakan email institusi berakhiran{" "}
                      <span className="font-semibold text-primary">
                        @students.undip.ac.id
                      </span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 mt-2 font-bold bg-[#3b5998] hover:bg-[#3b5998]/90 text-white shadow-md transition-all"
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
                    className="w-full text-xs text-slate-500 hover:text-primary mt-4 flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Kembali ke form sebelumnya
                  </button>
                </form>
              )}

              <div className="pt-6 border-t border-slate-100 flex flex-row items-center justify-center gap-3 text-[13px] text-slate-500">
                <Link
                  href="/#beranda"
                  className="hover:text-[#3b5998] transition-colors flex items-center gap-1.5 font-semibold text-[#3b5998]"
                >
                  <Home className="w-4 h-4" /> Beranda
                </Link>

                <span className="text-slate-300">|</span>
                <span>
                  Sudah punya akun?{" "}
                  <Link
                    href="/login"
                    className="text-[#3b5998] hover:underline font-semibold"
                  >
                    Login di sini
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
