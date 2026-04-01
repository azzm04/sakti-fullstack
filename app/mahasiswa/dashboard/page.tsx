'use client';

import { useState } from 'react';
import { HoverEffect } from '@/components/ui/card-hover-effect';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { IconRobot, IconGavel, IconBolt } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardMahasiswa() {
  const features = [
    {
      title: "Aktivasi Bot Telegram",
      description: "Dapatkan notifikasi real-time mengenai batas waktu pelaporan Monev, status pencairan dana, dan pengumuman penting langsung di ponsel Anda tanpa perlu login berulang kali.",
      icon: <IconRobot className="w-8 h-8" />,
      link: "/mahasiswa/aktivasi-bot"
    },
    {
      title: "Pelaporan Penyalahgunaan Dana",
      description: "Temukan indikasi pemotongan dana atau pungutan liar? Laporkan secara anonim. Identitas Anda akan dilindungi sepenuhnya melalui sistem perlindungan whistleblower kami.",
      icon: <IconGavel className="w-8 h-8" />,
      link: "#"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <section className="relative overflow-hidden rounded-4xl p-10 text-on-primary">
        <BackgroundGradient className="rounded-4xl p-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 text-white">
              Penerima KIP-K 2024
            </span>
            <h2 className="font-headline text-4xl font-black mb-4 leading-tight text-white">
              Selamat Datang di Portal SAKTI, Andi!
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed opacity-90">
              Pantau status pencairan, lengkapi laporan Monev, dan pastikan seluruh administrasi Anda tetap terkelola dengan baik untuk masa depan yang lebih cerah.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 transform translate-x-12">
            <span className="material-symbols-outlined text-[20rem] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
        </BackgroundGradient>
      </section>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Telegram Card */}
        <div className="bg-surface-container-lowest rounded-4xl p-8 flex flex-col shadow-lg border border-outline-variant/10">
          <div className="flex items-start justify-between mb-8">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl">
              <IconRobot className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full text-xs font-bold">
              Rekomendasi
            </span>
          </div>
          <h3 className="font-headline text-2xl font-bold text-primary mb-3">
            Aktivasi Bot Telegram
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Dapatkan notifikasi real-time mengenai batas waktu pelaporan Monev, status pencairan dana, dan pengumuman penting langsung di ponsel Anda tanpa perlu login berulang kali.
          </p>
          <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center gap-4">
            <Link href="/mahasiswa/aktivasi-bot" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95">
                <IconBolt className="w-5 h-5" />
                Aktivasi Sekarang
              </button>
            </Link>
            <span className="text-xs text-on-surface-variant font-medium">
              Gratis selamanya untuk mahasiswa.
            </span>
          </div>
        </div>

        {/* Whistleblower Card */}
        <div className="bg-surface-container-lowest rounded-4xl p-8 flex flex-col shadow-lg border border-outline-variant/10">
          <div className="flex items-start justify-between mb-8">
            <div className="p-4 bg-error-container text-error rounded-2xl">
              <IconGavel className="w-10 h-10" />
            </div>
            <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold">
              Layanan Pengaduan
            </span>
          </div>
          <h3 className="font-headline text-2xl font-bold text-primary mb-3">
            Pelaporan Penyalahgunaan Dana
          </h3>
          <p className="text-on-surface-variant leading-relaxed mb-8">
            Temukan indikasi pemotongan dana atau pungutan liar? Laporkan secara anonim. Identitas Anda akan dilindungi sepenuhnya melalui sistem perlindungan whistleblower kami.
          </p>
          <div className="mt-auto pt-6">
            <a 
              href="https://forms.google.com/whistleblower" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all"
            >
              <span>Isi Formulir Pengaduan</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>

      {/* Status Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-headline text-xl font-bold text-primary">
              Status Pencairan Semester Genap
            </h4>
            <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">
              Update: 2 Jam Lalu
            </span>
          </div>

          {/* Progress Tracker */}
          <div className="relative py-4">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-variant -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-surface-tint -translate-y-1/2 rounded-full"></div>
            
            <div className="relative flex justify-between items-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Verifikasi
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-surface-tint text-on-primary flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                  SK Rektor
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-surface-container-lowest border-4 border-surface-tint text-primary flex items-center justify-center shadow-lg animate-pulse">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-primary">
                  Proses Bank
                </span>
              </div>

              <div className="flex flex-col items-center gap-2 opacity-30">
                <div className="w-10 h-10 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">payments</span>
                </div>
                <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Cair
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-surface-container-lowest rounded-2xl flex items-center gap-4">
            <span className="material-symbols-outlined text-tertiary">info</span>
            <p className="text-sm text-on-surface-variant italic">
              `Estimasi pencairan ke rekening Anda dalam 3-5 hari kerja setelah proses Bank selesai.`
            </p>
          </div>
        </div>

        <div className="bg-surface-container-highest rounded-4xl p-8 flex flex-col justify-center items-center text-center shadow-lg">
          <img
            alt="Student Group"
            className="w-24 h-24 rounded-full object-cover mb-4 grayscale opacity-50"
            src="/placeholder-students.jpg"
          />
          <h4 className="font-headline text-lg font-bold text-primary mb-2">
            Bantuan Teknis?
          </h4>
          <p className="text-sm text-on-surface-variant mb-6">
            Hubungi admin universitas melalui sistem tiket internal kami.
          </p>
          <button className="w-full py-3 bg-surface-container-lowest text-primary font-bold rounded-xl hover:bg-white transition-colors">
            Buka Tiket
          </button>
        </div>
      </div>
    </div>
  );
}