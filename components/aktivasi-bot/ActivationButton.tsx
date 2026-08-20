"use client"

import { useState } from "react"
import { IconBolt, IconCheck, IconExternalLink } from "@tabler/icons-react"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { telegramAPI } from "@/lib/api"

export default function ActivationButton() {
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated]   = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const handleActivation = async () => {
    setIsActivating(true)
    setError(null)
    try {
      const data = await telegramAPI.activate()
      if (data?.deepLink) {
        setIsActivated(true)
        window.open(data.deepLink, "_blank")
      } else {
        setError(data?.error ?? "Gagal mendapatkan link aktivasi.")
      }
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.")
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <BackgroundGradient className="rounded-4xl p-8 shadow-xl">
      <div className="relative z-10">
        <IconBolt className="w-10 h-10 mb-4 text-white opacity-80" />
        <h3 className="text-2xl font-bold mb-2 text-white">Mulai Sekarang</h3>
        <p className="text-blue-100 text-sm mb-8 leading-relaxed">
          Hubungkan akun Telegram Anda dalam hitungan detik untuk proteksi status beasiswa yang lebih baik.
        </p>

        {error && (
          <p className="text-red-300 text-xs text-center mb-4 bg-red-900/30 rounded-lg p-2">
            {error}
          </p>
        )}

        {isActivated ? (
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-bold">
              <IconCheck className="w-5 h-5" /> Link Berhasil Dibuat!
            </div>
            <p className="text-white/80 text-xs leading-relaxed">
              Jendela Telegram sudah dibuka. Tekan tombol{" "}
              <b>Start</b> di bot untuk menyelesaikan aktivasi.
            </p>
          </div>
        ) : (
          <button
            onClick={handleActivation}
            disabled={isActivating}
            className="w-full py-3.5 bg-white rounded-xl font-bold shadow-md overflow-hidden flex items-center justify-center disabled:opacity-60 hover:brightness-95 transition-all active:scale-95"
          >
            {isActivating ? (
              <span className="flex items-center gap-2 text-primary text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Mengaktifkan...
              </span>
            ) : (
              <span className="flex items-center gap-2 text-primary text-sm font-bold">
                <IconExternalLink className="w-4 h-4" />
                Aktivasi Bot Sekarang
              </span>
            )}
          </button>
        )}

        <p className="text-[10px] text-center mt-4 text-white/60 font-medium">
          Dengan mengaktifkan, Anda menyetujui Ketentuan Layanan Bot SAKTI
        </p>
      </div>
    </BackgroundGradient>
  )
}
