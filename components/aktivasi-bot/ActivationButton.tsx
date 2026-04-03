'use client';

import { useState } from 'react';
import { IconBolt, IconCheck } from '@tabler/icons-react';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { CanvasText } from '@/components/ui/canvas-text';
import { telegramAPI } from '@/lib/api';

export default function ActivationButton() {
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated]   = useState(false);

  const handleActivation = async () => {
    setIsActivating(true);
    try {
      await telegramAPI.activateBot('user-id-example');
      setIsActivated(true);
      setTimeout(() => window.open('https://t.me/SAKTIBot', '_blank'), 2000);
    } catch {
      alert('Gagal mengaktifkan bot. Silakan coba lagi.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <BackgroundGradient className="rounded-4xl p-8 shadow-xl">
      <div className="relative z-10">
        <IconBolt className="w-10 h-10 mb-4 text-white opacity-80" />
        <h3 className="text-2xl font-headline font-bold mb-2 text-white">Mulai Sekarang</h3>
        <p className="text-blue-100 text-sm font-body mb-8 leading-relaxed">
          Hubungkan akun Telegram Anda dalam hitungan detik untuk proteksi status beasiswa yang lebih baik.
        </p>

        <button
          onClick={handleActivation}
          disabled={isActivating || isActivated}
          className="w-full py-3.5 bg-white rounded-xl font-bold shadow-md overflow-hidden flex items-center justify-center disabled:opacity-60 hover:brightness-95 transition-all active:scale-95"
        >
          {isActivating ? (
            <span className="flex items-center gap-2 text-primary text-sm">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Mengaktifkan...
            </span>
          ) : isActivated ? (
            <span className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
              <IconCheck className="w-5 h-5" /> Berhasil Diaktifkan!
            </span>
          ) : (
            <CanvasText
              text="Aktivasi Bot Sekarang"
              className="text-sm font-extrabold text-primary"
              backgroundClassName="bg-white"
              colors={[
                'rgba(0, 86, 179, 1)',   'rgba(0, 86, 179, 0.85)', 'rgba(0, 86, 179, 0.7)',
                'rgba(0, 86, 179, 0.55)','rgba(0, 86, 179, 0.4)',  'rgba(0, 86, 179, 0.25)',
                'rgba(0, 86, 179, 0.1)',
              ]}
              lineGap={3}
              animationDuration={18}
            />
          )}
        </button>

        <p className="text-[10px] text-center mt-4 text-white/60 font-medium">
          Dengan mengaktifkan, Anda menyetujui Ketentuan Layanan Bot SAKTI
        </p>
      </div>
    </BackgroundGradient>
  );
}
