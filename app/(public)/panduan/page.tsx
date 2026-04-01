"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import { motion } from "framer-motion";
import {
  Play,
  CheckCircle2,
  CreditCard,
  Users,
  TrendingDown,
  Home,
  Banknote,
  BookOpen,
  Award,
  BadgeCheck,
  ShieldAlert,
  Megaphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function PanduanPage() {
  const steps = [
    {
      number: "01",
      title: "Pendaftaran Akun",
      description:
        "Siswa melakukan pendaftaran mandiri melalui portal KIP-K dengan NIK, NISN, dan NPSN yang valid.",
    },
    {
      number: "02",
      title: "Pengisian Data",
      description:
        "Melengkapi data ekonomi, keluarga, dan dokumen pendukung sesuai kondisi yang sebenarnya.",
    },
    {
      number: "03",
      title: "Pemilihan Seleksi",
      description:
        "Memilih jalur seleksi masuk perguruan tinggi (SNBP/SNBT/Mandiri) pada dashboard KIP-K.",
    },
    {
      number: "04",
      title: "Penetapan Penerima",
      description:
        "Verifikasi dokumen dan kunjungan lapangan oleh perguruan tinggi sebelum penetapan resmi.",
      highlighted: true,
    },
  ];

  const eligibility = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Pemegang KIP / PIP",
      description:
        "Siswa SMA/SMK sederajat yang memiliki Kartu Indonesia Pintar.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Keluarga PKH / KKS",
      description:
        "Berasal dari keluarga peserta Program Keluarga Harapan atau pemegang KKS.",
    },
    {
      icon: <TrendingDown className="w-6 h-6" />,
      title: "Desil 1 - 4 DTKS",
      description:
        "Masuk dalam kelompok masyarakat miskin/rentan miskin maksimal pada desil 4.",
      highlighted: true,
    },
  ];

  const documents = [
    {
      icon: <Home className="w-8 h-8" />,
      title: "Foto Rumah",
      subtitle: "Tampak depan & ruang keluarga",
    },
    {
      icon: <Banknote className="w-8 h-8" />,
      title: "Slip Gaji",
      subtitle: "Atau surat keterangan penghasilan",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Raport",
      subtitle: "Semester 1 s/d 5 dilegalisir",
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Sertifikat",
      subtitle: "Prestasi akademik/non-akademik",
    },
  ];

  return (
    <div className="bg-[#F8FAFC] font-body text-slate-600 selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="pt-20">
        {/* ================= HERO SECTION ================= */}
        <section className="relative bg-white py-20 px-8 overflow-hidden border-b border-slate-200">
          <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">
                Official Resources 2026
              </span>
              <h1 className="text-5xl md:text-6xl font-extrabold text-primary leading-[1.1] font-headline tracking-tight">
                Panduan Pendaftaran KIP-Kuliah 2026
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-xl">
                Akses resmi panduan langkah demi langkah program bantuan
                pendidikan nasional. Berdasarkan sumber terverifikasi dari
                Kemdikbudristek untuk calon mahasiswa berprestasi.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a href="#tutorial" className="scroll-smooth">
                  <button className="flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold transition-all hover:bg-primary/90 shadow-lg active:scale-95">
                    <Play className="w-5 h-5 fill-current" />
                    Lihat Tutorial
                  </button>
                </a>
                <a href="#syarat" className="scroll-smooth">
                  <button className="flex items-center gap-2 bg-white text-slate-600 px-8 py-4 rounded-xl font-bold border border-slate-300 transition-all hover:bg-slate-50 active:scale-95">
                    Pelajari Syarat
                  </button>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden md:block h-112.5"
            >
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>

              <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden z-10">
                <Image
                  alt="Academic Focus"
                  src="https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2000&auto=format&fit=crop"
                  fill
                  style={{ objectFit: "cover" }}
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-xl z-20 flex items-center gap-4 border border-slate-100">
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <BadgeCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">
                    Informasi Resmi
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Update: Jan 2026
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= VIDEO SECTION ================= */}
        <section className="py-24 px-8 bg-slate-50" id="tutorial">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">
                Tutorial Pendaftaran KIP-Kuliah
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto text-lg">
                Tonton panduan visual lengkap yang memandu Anda melalui seluruh
                proses portal pendaftaran online.
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              className="relative group cursor-pointer overflow-hidden rounded-[2rem] shadow-2xl bg-slate-900 h-[300px] md:h-[500px]"
            >
              <Image
                alt="Video Placeholder"
                src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop"
                fill
                style={{ objectFit: "cover" }}
                className="opacity-60 transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                <div className="flex flex-col md:flex-row justify-between md:items-end text-white gap-4">
                  <div>
                    <p className="font-bold text-xl mb-1">
                      Panduan Pengisian Data 2026
                    </p>
                    <p className="text-sm text-slate-300 font-medium">
                      Durasi: 12:45 • @kemdikbud.ri
                    </p>
                  </div>
                  <a
                    className="text-sm font-bold hover:underline bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm text-center"
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Buka di YouTube
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= STEP-BY-STEP SECTION ================= */}
        <section className="py-24 px-8 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  Prosedur Utama
                </span>
                <h2 className="text-3xl lg:text-4xl font-bold text-primary font-headline tracking-tight">
                  Tahapan Pendaftaran
                </h2>
              </div>
              <p className="text-slate-500 max-w-md md:text-right text-lg">
                Ikuti empat langkah utama ini untuk memastikan aplikasi Anda
                diterima dan diproses oleh sistem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`bg-slate-50 p-8 rounded-3xl space-y-5 hover:shadow-lg transition-all border ${
                    step.highlighted
                      ? "border-primary shadow-md bg-blue-50/50"
                      : "border-slate-100"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                      step.highlighted
                        ? "bg-primary text-white shadow-md"
                        : "bg-white text-primary border border-slate-200 shadow-sm"
                    }`}
                  >
                    {step.number}
                  </div>
                  <h3 className="font-bold text-xl text-primary font-headline">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ELIGIBILITY & DOCUMENTS ================= */}
        <section className="py-24 px-8 bg-slate-50" id="syarat">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16">
              {/* Syarat Penerima */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">
                    Syarat Penerima
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Prioritas diberikan kepada siswa yang memenuhi salah satu
                    kriteria berikut:
                  </p>
                </div>

                <div className="space-y-4">
                  {eligibility.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className={`flex gap-5 p-6 bg-white rounded-2xl border shadow-sm ${
                        item.highlighted
                          ? "border-l-4 border-l-primary border-y-slate-100 border-r-slate-100"
                          : "border-slate-100"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-xl h-fit ${item.highlighted ? "bg-blue-50 text-primary" : "bg-slate-50 text-slate-500"}`}
                      >
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary mb-1 text-lg">
                          {item.title}
                        </h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Dokumen yang Diperlukan */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">
                    Dokumen Pendukung
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Siapkan file digital dalam format JPG/PDF dengan ukuran
                    maksimal 300KB per file.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="p-8 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-4 hover:border-primary/30 hover:shadow-md transition-all group"
                    >
                      <div className="text-slate-400 group-hover:text-primary transition-colors duration-300">
                        {doc.icon}
                      </div>
                      <div>
                        <div className="text-base font-bold text-primary mb-1">
                          {doc.title}
                        </div>
                        <div className="text-xs text-slate-500 leading-relaxed">
                          {doc.subtitle}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHISTLEBLOWER / REPORTING SECTION ================= */}
        <section className="py-24 px-8 bg-white">
          <div className="max-w-5xl mx-auto bg-primary/40 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-secondary/80">
            {/* Efek Cahaya Latar menggunakan warna Destructive (Merah) & Primary (Biru) */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-8 flex flex-col items-center">
              {/* Ikon Shield Alert */}
              <div className="w-20 h-20 bg-destructive/20 rounded-3xl flex items-center justify-center border border-destructive/30 shadow-inner mb-2">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-5xl font-extrabold text-white font-headline tracking-tight">
                Kawal Transparansi <span className="text-primary">KIP-Kuliah</span>
              </h2>
              
              <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                Mengetahui ada penerima KIP-Kuliah yang gaya hidupnya tergolong keluarga mampu atau tidak tepat sasaran? 
                Bantu kami menjaga keadilan program ini. <br className="hidden md:block" />
                <span className="text-secondary font-bold bg-white px-3 py-1 rounded-md mt-4 inline-block shadow-sm">
                  Identitas pelapor dijamin 100% rahasia.
                </span>
              </p>
              
              <div className="pt-6">
                {/* Ganti URL href di bawah ini dengan link Google Form kalian */}
                <a 
                  href="https://forms.gle/contohlinkgform" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <button className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-primary/90 transition-all active:scale-95 border border-white/10">
                    <Megaphone className="w-5 h-5" />
                    Buat Laporan Penyelewengan
                  </button>
                </a>
              </div>
              
              <p className="text-xs text-white/50 max-w-lg mx-auto mt-6">
                *Laporan palsu atau fitnah dapat dikenakan sanksi akademik. Pastikan Anda memiliki bukti yang cukup sebelum melapor.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}
