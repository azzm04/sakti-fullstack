"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogIn,
  Home,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      // Validasi format email SSO Undip
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
        {/* KOLOM BAGIAN KIRI (Hidden di Mobile, Muncul di Desktop) */}
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
            Portal Login <br /> Mahasiswa KIP-Kuliah
          </h2>

          <p className="text-blue-100/80 leading-relaxed text-sm max-w-md text-justify">
            Portal khusus bagi Mahasiswa Aktif penerima beasiswa KIP-Kuliah
            Universitas Diponegoro. Silakan masuk menggunakan Email SSO
            (@students.undip.ac.id) Anda untuk mengakses layanan informasi,
            pelaporan monitoring evaluasi (Monev), dan kanal pengaduan resmi.
          </p>
        </div>

        {/* KOLOM BAGIAN KANAN: Form Card */}
        <div className="w-full flex justify-center lg:justify-end">
          <div className="bg-white w-full max-w-105 rounded-xl shadow-2xl p-8 sm:p-10 border border-white/20">
            {/* Header Form */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 text-primary mb-4">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 font-headline">
                Masuk ke SAKTI
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Gunakan email SSO Undip Anda
              </p>
            </div>

            <div className="space-y-5">
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
                  <Label className="text-xs font-semibold text-slate-600">
                    Email SSO Undip
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@students.undip.ac.id"
                      required
                      className="w-full pl-10 h-11 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex justify-center items-center gap-2 h-11 mt-2 font-bold rounded-lg bg-[#3b5998] hover:bg-[#3b5998]/90 text-white shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
              <div className="pt-6 border-t border-slate-100 flex flex-row items-center justify-center gap-3 text-[13px] text-slate-500">
                <Link
                  href="/"
                  className="hover:text-[#3b5998] transition-colors flex items-center gap-1.5 font-semibold text-[#3b5998]"
                >
                  <Home className="w-4 h-4" /> Beranda
                </Link>

                <span className="text-slate-300">|</span>

                <span>
                  Mahasiswa KIPK Baru?{" "}
                  <Link
                    href="/verify-kandidat"
                    className="text-[#3b5998] hover:underline font-semibold"
                  >
                    Verifikasi
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

// OPSIONAL BIAR RAPI
function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <label className={`block ${className}`}>{children}</label>;
}
