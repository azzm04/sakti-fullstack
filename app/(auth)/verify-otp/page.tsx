"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

const ROLE_REDIRECT: Record<string, string> = {
  MAHASISWA_KIPK: "/mahasiswa/dashboard",
  PEWAWANCARA:    "/pewawancara",
  ADMIN_DIRMAWA:  "/admin",
}

export default function VerifyOtpPage() {
  const [digits, setDigits] = useState(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [jalur, setJalur] = useState<"sso" | "pribadi">("sso")
  const [resendCooldown, setResendCooldown] = useState(0)
  // Step SSO setelah OTP sukses (hanya jalur pribadi)
  const [showSsoStep, setShowSsoStep] = useState(false)
  const [emailSso, setEmailSso] = useState("")
  const [ssoLoading, setSsoLoading] = useState(false)
  const router = useRouter()

  // Buat refs untuk setiap input digit
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null))

  useEffect(() => {
    const savedEmail = sessionStorage.getItem("otp_email")
    if (!savedEmail) {
      router.push("/login")
      return
    }
    setEmail(savedEmail)
    setJalur((sessionStorage.getItem("otp_jalur") as "sso" | "pribadi") ?? "sso")
    // Focus ke input pertama
    inputRefs.current[0]?.focus()
  }, [router])

  // Countdown cooldown resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const next = [...digits]
    pasted.split("").forEach((char, i) => { next[i] = char })
    setDigits(next)
    // Focus ke input terakhir yang terisi, atau input ke-6
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  function handleDigit(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...digits]
    next[i] = val.slice(-1)
    setDigits(next)
    // Auto focus ke input berikutnya
    if (val && i < 5) inputRefs.current[i + 1]?.focus()
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    // Backspace — kembali ke input sebelumnya
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  async function handleVerify() {
    const otp = digits.join("")
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
      // Reset input saat salah
      setDigits(Array(6).fill(""))
      inputRefs.current[0]?.focus()
      return
    }

    sessionStorage.removeItem("otp_email")
    sessionStorage.removeItem("otp_jalur")

    // Jalur pribadi → tampilkan step input SSO dulu
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
      setResendCooldown(60) // cooldown 60 detik
      setDigits(Array(6).fill(""))
      inputRefs.current[0]?.focus()
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

          {/* Input 6 digit */}
          <div className="flex gap-2 mb-4 justify-center">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                value={d}
                maxLength={1}
                inputMode="numeric"
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className="w-11 h-12 text-center text-xl border-2 border-slate-300 rounded-xl
                  focus:border-primary focus:outline-none font-bold text-slate-800
                  transition-colors"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg mb-4">
              {error}
            </p>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || digits.join("").length < 6}
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
