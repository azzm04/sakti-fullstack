"use client";

import { useState } from "react";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import {
  IconBolt,
  IconLock,
  IconDevices,
  IconHeadset,
  IconCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { telegramAPI } from "@/lib/api";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AktivasiBotPage() {
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const handleActivation = async () => {
    setIsActivating(true);
    try {
      // Panggil API untuk aktivasi bot
      const response = await telegramAPI.activateBot("user-id-example");
      console.log("Activation response:", response);
      setIsActivated(true);

      // Redirect ke Telegram bot setelah 2 detik
      setTimeout(() => {
        window.open("https://t.me/SAKTIBot", "_blank");
      }, 2000);
    } catch (error) {
      console.error("Activation error:", error);
      alert("Gagal mengaktifkan bot. Silakan coba lagi.");
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full bg-surface">
      {/* Header Section */}
      <header className="mb-12">
        <div className="flex items-center space-x-2 text-on-surface-variant mb-4">
          <span className="text-xs font-bold uppercase tracking-wider">
            Layanan Notifikasi
          </span>
          <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
          <span className="text-xs font-medium">Monitoring & Evaluasi</span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight mb-4 tracking-tight">
          Aktivasi Smart Bot SAKTI
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg font-body leading-relaxed">
          Jangan pernah lewatkan tenggat waktu Monev Beasiswa Anda. Bot SAKTI di
          Telegram hadir untuk memberikan pengingat cerdas dan validasi berkala
          secara interaktif.
        </p>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Timeline & Schedule Section */}
        <section className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-lowest rounded-4xl p-8 relative overflow-hidden shadow-lg border border-outline-variant/10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-headline text-2xl font-bold text-primary">
                Jadwal Notifikasi & Flow
              </h3>
              <span className="bg-primary-container/10 text-primary-container text-xs font-bold px-3 py-1 rounded-full uppercase">
                Real-time Sync
              </span>
            </div>

            {/* Vertical Timeline Visual */}
            <div className="relative pl-8 space-y-12"> 
              {/* Line */}
              <div className="absolute left-3.75 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary-fixed to-outline-variant/30"></div>

              {/* Step 1: Automated Reminders */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="relative"
              >
                <div className="absolute -left-6.25 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest ring-4 ring-primary/10"></div>
                <div>
                  <span className="font-label text-xs font-bold text-primary-container tracking-widest uppercase">
                    Fase Persiapan
                  </span>
                  <h4 className="text-xl font-bold text-on-surface mt-1">
                    H-30 sampai H-3
                  </h4>
                  <p className="text-on-surface-variant mt-2 text-sm leading-relaxed max-w-lg">
                    Bot akan mengirimkan pesan pengingat rutin secara otomatis
                    setiap 3 hari sekali untuk memastikan Anda menyiapkan
                    dokumen Monev.
                  </p>
                  <div className="mt-4 inline-flex items-center space-x-2 bg-surface-container-low px-4 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-primary-container text-sm">
                      auto_awesome
                    </span>
                    <span className="text-xs font-medium italic text-on-surface-variant">
                      `Halo Andi! 30 hari lagi periode Monev dimulai...`
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Step 2: Interactive Validation */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="absolute -left-6.25 top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest ring-4 ring-primary/10"></div>
                <div>
                  <span className="font-label text-xs font-bold text-primary-container tracking-widest uppercase">
                    Validasi Interaktif
                  </span>
                  <h4 className="text-xl font-bold text-on-surface mt-1">
                    H-2 dan H-1
                  </h4>
                  <p className="text-on-surface-variant mt-2 text-sm leading-relaxed max-w-lg">
                    Bot akan bertanya langsung untuk memvalidasi status
                    pengisian form Anda.
                  </p>

                  {/* Mock Chat UI */}
                  <div className="mt-6 space-y-4 max-w-md">
                    <div className="bg-surface-container-high/50 p-4 rounded-2xl rounded-tl-none border border-outline-variant/10">
                      <p className="text-sm font-medium">
                        Sudahkah Anda mengisi form Monev beasiswa semester ini?
                      </p>
                      <div className="flex space-x-3 mt-4">
                        <button className="flex-1 py-2 bg-primary-container text-on-primary-container rounded-xl text-xs font-bold shadow-sm">
                          Sudah
                        </button>
                        <button className="flex-1 py-2 bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-xl text-xs font-bold">
                          Belum
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 3: Branching Logic */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-outline-variant border-4 border-surface-container-lowest ring-4 ring-outline-variant/10"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center space-x-2 text-primary mb-2">
                      <IconCheck className="w-5 h-5" />
                      <span className="text-xs font-bold">Status: Sudah</span>
                    </div>
                    <p className="text-xs text-on-surface-variant italic leading-relaxed">
                      `Terima kasih, semoga sukses! Data Anda telah tercatat
                      aman di sistem.`
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-error/5 border border-error/10">
                    <div className="flex items-center space-x-2 text-error mb-2">
                      <IconAlertTriangle className="w-5 h-5" />
                      <span className="text-xs font-bold">Status: Belum</span>
                    </div>
                    <p className="text-xs text-on-surface-variant italic leading-relaxed">
                      Bot akan mengirimkan pengingat mendesak (Urgent Reminder)
                      kembali pada H-1 pagi.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA and Benefits Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Activation Card */}
          <BackgroundGradient className="rounded-4xl p-8 shadow-xl">
            <div className="relative z-10">
              <IconBolt className="w-10 h-10 mb-4 text-white opacity-80" />
              <h3 className="text-2xl font-headline font-bold mb-2 text-white">
                Mulai Sekarang
              </h3>
              <p className="text-blue-100 text-sm font-body mb-8 leading-relaxed">
                Hubungkan akun Telegram Anda dalam hitungan detik untuk proteksi
                status beasiswa yang lebih baik.
              </p>
              <button
                onClick={handleActivation}
                disabled={isActivating || isActivated}
                className="w-full py-4 bg-surface-container-lowest text-primary bg-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:bg-secondary transition-all shadow-md group disabled:opacity-50"
              >
                {isActivating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>Mengaktifkan...</span>
                  </>
                ) : isActivated ? (
                  <>
                    <IconCheck className="w-5 h-5" />
                    <span>Berhasil Diaktifkan!</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">chat</span>
                    <span>Aktivasi Bot Sekarang</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-center mt-4 text-white/60 font-medium">
                Dengan mengaktifkan, Anda menyetujui Ketentuan Layanan Bot SAKTI
              </p>
            </div>
          </BackgroundGradient>

          {/* Feature Highlights */}
          <div className="bg-surface-container-low rounded-4xl p-6 space-y-6 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2">
              Keunggulan Bot
            </h4>

            <div className="flex items-start space-x-4 px-2">
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <IconLock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Privasi Terjamin</p>
                <p className="text-xs text-on-surface-variant">
                  Data Anda diamankan dengan protokol enkripsi tingkat tinggi.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 px-2">
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <IconDevices className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Multi-Device</p>
                <p className="text-xs text-on-surface-variant">
                  Akses notifikasi di HP, Tablet, maupun Desktop via Telegram.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 px-2">
              <div className="bg-surface-container-lowest p-2 rounded-lg">
                <IconHeadset className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Interaksi 24/7</p>
                <p className="text-xs text-on-surface-variant">
                  Tanya status pendaftaran kapan saja melalui menu SAKABOT.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Illustration Card */}
          <div className="h-48 rounded-4xl overflow-hidden relative group shadow-lg">
            <Image
              alt="Abstract Tech Connectivity"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="/tech-abstract.jpg"
              fill
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-6">
              <p className="text-white text-xs font-medium leading-tight">
                Teknologi automasi untuk kemudahan studi Anda.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* FAQ or Help Section */}
      <div className="mt-16 pt-8 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h5 className="text-sm font-bold text-on-surface">
              Butuh bantuan aktivasi?
            </h5>
            <p className="text-xs text-on-surface-variant">
              Tim IT SAKTI siap membantu Anda melalui kanal bantuan 24 jam.
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="px-6 py-2 rounded-xl text-primary text-xs font-bold border border-primary/20 hover:bg-primary/5 transition-colors">
              Panduan Manual
            </button>
            <button className="px-6 py-2 rounded-xl text-on-surface text-xs font-bold bg-surface-container-high hover:bg-surface-container-highest transition-colors">
              Hubungi Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
