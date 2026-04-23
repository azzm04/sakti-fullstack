"use client";

import { useCurrentUser } from "@/hook/useCurrentUser";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  GraduationCap,
  Hash,
  ArrowRight,
  Bot,
  Shield,
  Zap,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const DUMMY = {
  prodi: "S1 Teknik Informatika",
  nim: "21110631170001",
  progressMonev: 75,
  hariTersisa: 14,
};
import { useState, useEffect } from "react";

export default function DashboardMahasiswa() {
  const { user, loading, firstName, initials } = useCurrentUser();
  const [firstNameState, setFirstName] = useState("");
  const [loadingState, setLoading] = useState(true);
  const [isMonevFilled, setIsMonevFilled] = useState(false);
  // Mengambil data dari database/API saat komponen pertama kali dirender
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // --- CONTOH JIKA MENGGUNAKAN API FETCH ---
        // const response = await fetch('/api/mahasiswa/dashboard');
        // const data = await response.json();
        // setFirstName(data.nama);
        // setIsMonevFilled(data.statusMonev === 'COMPLETED');

        setTimeout(() => {
          setFirstName("Muzzz");
          // Ubah value ini jadi 'true' untuk melihat perubahan tombol & teks!
          setIsMonevFilled(false);
          setLoading(false);
        }, 1000); // delay 1 detik seolah-olah loading dari database
      } catch (error) {
        console.error("Gagal mengambil data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
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
                {loading ? (
                  <span className="inline-block w-40 h-6 bg-slate-200 rounded animate-pulse" />
                ) : (
                  (user?.nama ?? "-")
                )}
              </p>
            </div>
          </div>

          {/* Info Grid - Responsif: Kolom bertumpuk di mobile, sejajar di desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto md:min-w-[500px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
            {[
              { icon: User, label: "Nama Lengkap", value: user?.nama ?? "-" },
              {
                icon: GraduationCap,
                label: "Program Studi",
                value: DUMMY.prodi,
              },
              { icon: Hash, label: "NIM", value: DUMMY.nim, mono: true },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <Icon size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    {label}
                  </p>
                  <p
                    className={`text-sm font-semibold text-slate-700 truncate ${mono ? "font-mono" : ""}`}
                  >
                    {loading ? (
                      <span className="inline-block w-full h-4 bg-slate-200 rounded animate-pulse" />
                    ) : (
                      value
                    )}
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
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-second to-secondary p-6 sm:p-8 shadow-md"
      >
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -right-8 w-64 h-64 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex-1 max-w-xl">
            <h2 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight mb-3">
              Selamat Datang, {loading ? "..." : firstName}!
            </h2>

            {/* Deskripsi berubah secara dinamis */}
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              {isMonevFilled
                ? "Terima kasih telah mengisi laporan Monitoring dan Evaluasi (Monev) periode ini. Seluruh administrasi Anda sudah terpantau dengan baik."
                : "Anda belum mengisi laporan Monitoring dan Evaluasi (Monev) periode ini. Segera lengkapi laporan Anda agar evaluasi KIP-K berjalan lancar."}
            </p>

            {/* Tombol berubah secara dinamis */}
            {isMonevFilled ? (
              <Link
                href="/mahasiswa/monev" // Ganti dengan route halaman riwayat monev kamu
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Lihat Riwayat Monev <ArrowRight size={16} />
              </Link>
            ) : (
              <Link
                href="/mahasiswa/monev/isi" // Ganti dengan route halaman form monev kamu
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-xl hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                Isi Laporan Monev <ArrowRight size={16} />
              </Link>
            )}
          </div>

          {/* Stats - Berjejer 2 kolom di mobile, stack vertikal di desktop */}
          <div className="grid grid-cols-2 md:flex md:flex-col gap-3 w-full md:w-auto shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <p className="text-white font-extrabold text-3xl leading-none mb-1">
                {DUMMY.progressMonev}%
              </p>
              <p className="text-blue-200 text-xs font-medium">
                Progress Monev
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 text-center border border-white/10">
              <p className="text-white font-extrabold text-3xl leading-none mb-1">
                {DUMMY.hariTersisa}
              </p>
              <p className="text-blue-200 text-xs font-medium">Hari Tersisa</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 3. SAKTI Assistant (Modern Interaktif) ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link
          href="/mahasiswa/chatbot"
          className="group relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden"
        >
          {/* Efek Glow Background saat hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          <div className="relative shrink-0 w-max z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform duration-300">
              <Bot size={28} className="text-primary" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-[3px] border-white shadow-sm" />
          </div>

          <div className="flex-1 min-w-0 z-10">
            <div className="flex items-center gap-3 mb-1.5">
              <p className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">
                SAKTI Assistant
              </p>
              <span className="px-2.5 py-0.5 bg-gradient-to-r from-primary to-blue-600 text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider shadow-sm">
                AI Terintegrasi
              </span>
            </div>
            <p className="text-sm text-secondary truncate mb-4">
              Asisten virtual cerdas siap membantu administrasi KIP-Kuliah Anda
              24/7.
            </p>

            {/* Badges yang lebih modern */}
            <div className="flex gap-2.5 flex-wrap">
              {["Cek Syarat", "Status Pencairan", "Panduan Upload"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-slate-50 border border-slate-200 text-secondary hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors text-[11px] rounded-full font-semibold"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Ikon panah yang bergerak saat hover */}
          <div className="hidden sm:flex w-10 h-10 rounded-full bg-slate-50 items-center justify-center shrink-0 group-hover:bg-primary transition-colors z-10 group-hover:shadow-md group-hover:shadow-primary/20">
            <ChevronRight
              size={20}
              className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all"
            />
          </div>
        </Link>
      </motion.div>

      {/* ── 4. Feature Cards (Modern Interaktif) ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {/* Aktivasi Bot Telegram */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Bot size={22} className="text-primary group-hover:text-white" />
            </div>
          </div>

          <h3 className="font-extrabold text-slate-800 text-lg mb-2 group-hover:text-primary transition-colors">
            Notifikasi Telegram
          </h3>
          <p className="text-sm text-secondary leading-relaxed flex-1 mb-6">
            Jangan lewatkan tenggat waktu! Dapatkan pengingat otomatis Monev dan
            info KIP-K langsung ke HP Anda.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-auto pt-4 border-t border-slate-100">
            <Link
              href="/mahasiswa/aktivasi-bot"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:shadow-primary/20 active:scale-95 w-full sm:w-auto"
            >
              <Bot size={16} /> Aktifkan Sekarang
            </Link>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider text-center sm:text-right">
              Gratis & Aman
            </span>
          </div>
        </div>

        {/* Pelaporan Penyalahgunaan */}
        <div className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-red-200 transition-all duration-300 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />

          <div className="flex items-start justify-between mb-6">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-500 transition-colors duration-300">
              <Shield
                size={22}
                className="text-red-500 group-hover:text-white"
              />
            </div>
          </div>

          <h3 className="font-extrabold text-slate-800 text-lg mb-2 group-hover:text-red-600 transition-colors">
            Lapor Penyalahgunaan
          </h3>
          <p className="text-sm text-secondary leading-relaxed flex-1 mb-6">
            Menemukan indikasi pemotongan dana KIP-K secara sepihak? Laporkan
            segera. Identitas Anda dijamin anonim.
          </p>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <Link
              href="/mahasiswa/pengaduan"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 text-sm font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all hover:shadow-md hover:shadow-red-500/20 active:scale-95 w-full sm:w-auto group/btn"
            >
              Buat Laporan Rahasia
              <ExternalLink
                size={16}
                className="group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform"
              />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
