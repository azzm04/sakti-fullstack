'use client'

import { motion } from 'framer-motion';
import { Bell, CalendarClock, ShieldCheck, Smartphone } from 'lucide-react';
import { IconLock, IconDevices, IconHeadset } from '@tabler/icons-react';
import ActivationButton from '@/components/aktivasi-bot/ActivationButton';

const TIMELINE = [
  {
    phase: 'Fase Persiapan',
    title: 'H-30 sampai H-3',
    desc: 'Bot mengirimkan pesan pengingat rutin setiap 3 hari sekali agar Anda memiliki cukup waktu menyiapkan dokumen Monev.',
    preview: { bg: 'bg-surface-container-low', text: '"Halo Andi! 30 hari lagi periode Monev dimulai..."', icon: 'auto_awesome' },
    delay: 0.2,
  },
  {
    phase: 'Pengingat Akhir',
    title: 'H-2 dan H-1',
    desc: 'Bot mengirimkan pengingat mendesak dua kali — pada H-2 dan H-1 pagi — agar Anda tidak melewatkan batas waktu pengisian form Monev.',
    delay: 0.4,
  },
];

const FEATURES = [
  { icon: IconLock,    title: 'Privasi Terjamin',  desc: 'Data Anda diamankan dengan protokol enkripsi tingkat tinggi.' },
  { icon: IconDevices, title: 'Multi-Device',      desc: 'Akses notifikasi di HP, Tablet, maupun Desktop via Telegram.' },
  { icon: IconHeadset, title: 'Notifikasi 24/7',   desc: 'Pengingat otomatis dikirim tepat waktu tanpa perlu login.' },
];

const SCHEDULE = [
  { label: 'Batas Pengisian',  value: '30 Juni 2026',  icon: CalendarClock, color: 'text-amber-300' },
  { label: 'Verifikasi Prodi', value: '7 Juli 2026',   icon: ShieldCheck,   color: 'text-emerald-300' },
  { label: 'Notif via Bot',    value: 'Otomatis',      icon: Smartphone,    color: 'text-blue-200' },
];

export default function AktivasiBotPage() {
  return (
    <div className="p-6 md:p-12 max-w-7xl mx-auto w-full bg-surface">

      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center space-x-2 text-on-surface-variant mb-4">
          <span className="text-xs font-bold uppercase tracking-wider">Layanan Notifikasi</span>
          <div className="w-1 h-1 bg-outline-variant rounded-full" />
          <span className="text-xs font-medium">Monitoring & Evaluasi</span>
        </div>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-primary leading-tight mb-4 tracking-tight">
          Aktivasi Smart Bot SAKTI
        </h1>
        <p className="text-on-surface-variant max-w-2xl text-lg font-body leading-relaxed">
          Jangan pernah lewatkan tenggat waktu Monev Beasiswa Anda. Bot SAKTI di Telegram hadir
          untuk memberikan pengingat otomatis tanpa perlu membuka aplikasi.
        </p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Timeline */}
        <section className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-4xl p-8 relative overflow-hidden shadow-lg border border-outline-variant/10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-headline text-2xl font-bold text-primary">Jadwal Notifikasi & Flow</h3>
              <span className="bg-primary-container/10 text-primary-container text-xs font-bold px-3 py-1 rounded-full uppercase">
                Real-time Sync
              </span>
            </div>

            <div className="relative pl-8 space-y-12">
              <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-outline-variant/20" />

              {TIMELINE.map((step) => (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delay }}
                  className="relative"
                >
                  <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-primary border-4 border-surface-container-lowest ring-4 ring-primary/10" />
                  <span className="font-label text-xs font-bold text-primary tracking-widest uppercase">{step.phase}</span>
                  <h4 className="text-xl font-bold text-on-surface mt-1">{step.title}</h4>
                  <p className="text-on-surface-variant mt-2 text-sm leading-relaxed max-w-lg">{step.desc}</p>

                  {/* Step 1 preview */}
                  {step.preview && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl">
                      <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                      <span className="text-xs font-medium italic text-on-surface-variant">{step.preview.text}</span>
                    </div>
                  )}

                  {/* Step 2 previews */}
                  {step.phase === 'Pengingat Akhir' && (
                    <div className="mt-4 flex flex-col gap-2 max-w-md">
                      <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
                        <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs font-medium italic text-amber-700">
                          "⚠️ Andi, besok adalah batas akhir pengisian Monev. Segera lengkapi!"
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2 rounded-xl">
                        <Bell className="w-4 h-4 text-red-500 shrink-0 animate-pulse" />
                        <span className="text-xs font-medium italic text-red-600">
                          "🚨 Hari ini TERAKHIR! Jangan sampai beasiswamu bermasalah."
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">

          {/* CTA — only interactive part */}
          <ActivationButton />

          {/* Feature Highlights */}
          <div className="bg-surface-container-low rounded-4xl p-6 space-y-5 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-2">Keunggulan Bot</h4>
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start space-x-4 px-2">
                <div className="bg-surface-container-lowest p-2 rounded-lg shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="text-xs text-on-surface-variant">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Card */}
          <div className="rounded-4xl overflow-hidden bg-gradient-to-br from-primary to-primary/70 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Jadwal Monev 2025/2026</p>
                <p className="text-white/70 text-xs">Semester Genap</p>
              </div>
            </div>
            <div className="space-y-2">
              {SCHEDULE.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-white/80 text-xs">{label}</span>
                  </div>
                  <span className="text-white text-xs font-bold">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-white/50 text-[10px] mt-4 text-center">
              Bot akan mengingatkan Anda secara otomatis sebelum setiap tenggat.
            </p>
          </div>
        </aside>
      </div>

      {/* Footer Help */}
      <div className="mt-16 pt-8 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h5 className="text-sm font-bold text-on-surface">Butuh bantuan aktivasi?</h5>
            <p className="text-xs text-on-surface-variant">Tim IT SAKTI siap membantu Anda melalui kanal bantuan 24 jam.</p>
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
