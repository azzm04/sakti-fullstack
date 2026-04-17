"use client";

import { useCurrentUser } from "@/hook/useCurrentUser";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User, GraduationCap, Hash, ArrowRight,
  Bot, Shield, Zap, ExternalLink, ChevronRight,
} from "lucide-react";

const DUMMY = {
  prodi: "S1 Teknik Informatika",
  nim: "21110631170001",
  progressMonev: 75,
  hariTersisa: 14,
};

export default function DashboardMahasiswa() {
  const { user, loading, firstName, initials } = useCurrentUser();

  return (
    // Diperlebar menjadi max-w-6xl dan ditambahkan padding dinamis untuk mobile/tablet
    <div className="w-full max-w-6xl mx-auto space-y-6 py-6 px-4 sm:px-6 lg:px-8">
      
      {/* ── 1. Profile Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar + Greeting */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {loading ? "?" : initials}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                Selamat Datang
              </p>
              <p className="font-bold text-slate-800 text-lg sm:text-xl leading-tight">
                {loading ? <span className="inline-block w-40 h-6 bg-slate-200 rounded animate-pulse" /> : user?.nama ?? "-"}
              </p>
            </div>
          </div>

          {/* Info Grid - Responsif: Kolom bertumpuk di mobile, sejajar di desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto md:min-w-[500px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            {[
              { icon: User, label: "Nama Lengkap", value: user?.nama ?? "-" },
              { icon: GraduationCap, label: "Program Studi", value: DUMMY.prodi },
              { icon: Hash, label: "NIM", value: DUMMY.nim, mono: true },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                  <p className={`text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}>
                    {loading ? <span className="inline-block w-full h-4 bg-slate-200 rounded animate-pulse" /> : value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 2. Hero Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3faa] via-[#1e4fd8] to-[#2563eb] p-6 sm:p-8 shadow-md"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-8 w-64 h-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-[10px] font-bold text-white uppercase tracking-wider mb-4 border border-white/10">
              🎓 Penerima KIP-Kuliah 2024
            </span>
            <h2 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-3">
              Selamat Datang, {loading ? "..." : firstName}!
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Pantau status pencairan, kelola laporan Monev, dan pastikan semua administrasi Anda berjalan lancar langsung dari dashboard Anda.
            </p>
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              Lihat Status Pencairan <ArrowRight size={16} />
            </Link>
          </div>

          {/* Stats - Berjejer 2 kolom di mobile, stack vertikal di desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <p className="text-white font-extrabold text-3xl leading-none mb-1">{DUMMY.progressMonev}%</p>
              <p className="text-blue-200 text-xs font-medium">Progress Monev</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <p className="text-white font-extrabold text-3xl leading-none mb-1">{DUMMY.hariTersisa}</p>
              <p className="text-blue-200 text-xs font-medium">Hari Tersisa</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. SAKTI Assistant ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link
          href="/mahasiswa/chatbot"
          className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-primary hover:shadow-md transition-all"
        >
          <div className="relative shrink-0 w-max">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot size={24} className="text-primary" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-slate-800 group-hover:text-primary transition-colors">SAKTI Assistant</p>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">AI</span>
            </div>
            <p className="text-sm text-slate-500 truncate mb-3 sm:mb-2">
              Butuh bantuan seputar KIP-Kuliah? Tanya langsung ke asisten virtual kami.
            </p>
            <div className="flex gap-2 flex-wrap">
              {["Syarat pengajuan", "Status pencairan", "Upload dokumen"].map((tag) => (
                <span key={tag} className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[11px] rounded-lg font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ChevronRight size={20} className="hidden sm:block text-slate-300 group-hover:text-primary transition-colors shrink-0" />
        </Link>
      </motion.div>

      {/* ── 4. Feature Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Aktivasi Bot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col hover:border-blue-200 transition-colors">
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Bot size={22} className="text-primary" />
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              <Zap size={12} /> Rekomendasi
            </span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-2">Aktivasi Bot Telegram</h3>
          <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-5">
            Dapatkan notifikasi real-time untuk deadline Monev, status pencairan, dan pengumuman penting langsung di Telegram Anda.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-auto">
            <Link
              href="/mahasiswa/aktivasi-bot"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <Bot size={16} /> Aktivasi Sekarang
            </Link>
            <span className="text-xs text-slate-400 font-medium text-center sm:text-left">Gratis untuk mahasiswa</span>
          </div>
        </div>

        {/* Pengaduan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col hover:border-red-200 transition-colors">
          <div className="flex items-start justify-between mb-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
              <Shield size={22} className="text-red-500" />
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              Pengaduan
            </span>
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-2">Pelaporan Penyalahgunaan</h3>
          <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-5">
            Temukan indikasi pemotongan dana atau pungutan liar? Laporkan secara anonim. Identitas Anda dilindungi sepenuhnya.
          </p>
          <div className="mt-auto">
            <Link
              href="/mahasiswa/pengaduan"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors w-full sm:w-auto"
            >
              Buat Laporan <ExternalLink size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

    </div>
  );
}