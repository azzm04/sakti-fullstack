"use client"

import { useState } from "react"
import { IconBolt, IconCheck, IconExternalLink } from "@tabler/icons-react"
import { BackgroundGradient } from "@/components/ui/background-gradient"
import { telegramAPI } from "@/lib/api"

interface ActivationButtonProps {
  onActivated?: () => void;
  variant?: "default" | "inline";
}

export default function ActivationButton({ onActivated, variant = "inline" }: ActivationButtonProps) {
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivation = async () => {
    setIsActivating(true);
    setError(null);
    try {
      const data = await telegramAPI.activate();
      if (data?.deepLink) {
        setIsActivated(true);
        window.open(data.deepLink, "_blank");
        onActivated?.();
      } else {
        setError(data?.error ?? "Gagal mendapatkan link aktivasi.");
      }
    } catch {
      setError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsActivating(false);
    }
  };

  if (variant === "inline") {
    return (
      <div className="space-y-2">
        {error && (
          <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg p-2">
            {error}
          </p>
        )}

        {isActivated ? (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-800">
            <IconCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Link aktivasi dibuka di tab baru</p>
              <p className="text-emerald-700 mt-0.5">
                Buka Telegram Anda lalu tekan tombol <b>Start</b> pada bot untuk menyelesaikan koneksi.
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleActivation}
            disabled={isActivating}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000352] text-white text-sm font-medium rounded-lg hover:bg-[#1a1e68] transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
          >
            {isActivating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Menghubungkan...</span>
              </>
            ) : (
              <>
                <IconExternalLink className="w-4 h-4" />
                <span>Aktivasi Bot Telegram</span>
              </>
            )}
          </button>
        )}
      </div>
    );
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
  );
}
