"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const ROLE_REDIRECT: Record<string, string> = {
  MAHASISWA_KIPK: "/mahasiswa/dashboard",
  PEWAWANCARA:    "/pewawancara",
  ADMIN_DIRMAWA:  "/admin",
}

export default function VerifyOtpPage() {
  const [otp, setOtp]             = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [email, setEmail]         = useState("")
  const [jalur, setJalur]         = useState<"sso" | "pribadi">("sso")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showSsoStep, setShowSsoStep]       = useState(false)
  const [emailSso, setEmailSso]   = useState("")
  const [ssoLoading, setSsoLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("otp_email")
    if (!savedEmail) {
      router.push("/login")
      return
    }
    setEmail(savedEmail)
    setJalur((sessionStorage.getItem("otp_jalur") as "sso" | "pribadi") ?? "sso")
  }, [router])

  // Countdown cooldown resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  async function handleVerify() {
    if (otp.length < 6) return
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
      headers: { "Content-Type": "application/json" },
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      setOtp("")
      return
    }

    sessionStorage.removeItem("otp_email")
    sessionStorage.removeItem("otp_jalur")

    if (jalur === "pribadi") {
      setShowSsoStep(true)
      return
    }

    router.push(ROLE_REDIRECT[data.role] ?? "/")
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError("")

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    })

    if (res.ok) {
      setResendCooldown(60)
      setOtp("")
    }
  }

  async function handleSsoSubmit(skip: boolean) {
    setSsoLoading(true)
    if (!skip && emailSso) {
      // TODO: PATCH /api/auth/update-sso { emailSso }
      await fetch("/api/auth/update-sso", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailSso: emailSso.trim().toLowerCase() }),
      }).catch(() => {})
    }
    setSsoLoading(false)
    router.push(ROLE_REDIRECT["MAHASISWA_KIPK"])
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-body">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-primary">SAKTI</h1>
        </div>

        {/* ── Step SSO (setelah OTP sukses, jalur pribadi) ── */}
        {showSsoStep ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Tambahkan Email SSO</h2>
            <p className="text-sm text-slate-500 mb-6">
              Jika sudah punya email SSO Undip, masukkan sekarang. Bisa dilewati dan diisi nanti.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email SSO Undip <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <input
                  type="email"
                  value={emailSso}
                  onChange={(e) => setEmailSso(e.target.value)}
                  placeholder="nim@students.undip.ac.id"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
              </div>
              <button
                onClick={() => handleSsoSubmit(false)}
                disabled={ssoLoading || !emailSso}
                className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold
                  hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {ssoLoading ? "Menyimpan..." : "Simpan & Masuk"}
              </button>
              <button
                onClick={() => handleSsoSubmit(true)}
                disabled={ssoLoading}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500
                  hover:bg-slate-100 transition-colors"
              >
                Lewati, isi nanti →
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Masukkan Kode OTP
          </h2>
          <p className="text-sm text-slate-500 mb-2">
            Kode 6 digit telah dikirim ke:
          </p>
          <p className="text-sm font-medium text-primary mb-6 truncate">{email}</p>

          {/* Input OTP */}
          <div className="flex justify-center mb-5">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(val) => {
                setOtp(val)
                if (val.length === 6) {
                  // Auto-submit saat 6 digit terisi
                  setTimeout(() => {
                    document.getElementById("btn-verify")?.click()
                  }, 100)
                }
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <div className="mx-1 text-muted-foreground text-sm">—</div>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}

          <button
            id="btn-verify"
            onClick={handleVerify}
            disabled={loading || otp.length < 6}
            className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold
              hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors mb-4"
          >
            {loading ? "Memverifikasi..." : "Verifikasi"}
          </button>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Tidak menerima kode?{" "}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-primary font-medium hover:underline disabled:opacity-50
                  disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : "Kirim ulang"}
              </button>
            </p>
          </div>
        </div>
        )} {/* end showSsoStep ternary */}

        <button
          onClick={() => router.push("/login")}
          className="w-full text-center text-xs text-slate-400 mt-4 hover:text-slate-600"
        >
          ← Kembali ke halaman login
        </button>
      </div>
    </div>
  )
}
