"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    // Simpan email sementara untuk halaman verify-otp
    sessionStorage.setItem("otp_email", email)
    router.push("/verify-otp")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-body">
      <div className="w-full max-w-sm px-4">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-headline font-extrabold text-primary">SAKTI</h1>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Asisten KIPK Terpadu dan Interaktif
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
        >
          <h2 className="text-lg font-semibold text-slate-800 mb-1">
            Masuk ke SAKTI
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Gunakan email SSO Undip Anda
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email SSO Undip
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nim@students.undip.ac.id"
                required
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold
                hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors"
            >
              {loading ? "Mengirim OTP..." : "Kirim Kode OTP"}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Admin DIRMAWA?{" "}
          <a href="/admin/login" className="text-primary hover:underline font-medium">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  )
}
