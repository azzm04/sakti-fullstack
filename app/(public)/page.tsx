import Navbar from "@/components/layout/Navbar";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { CanvasText } from "@/components/ui/canvas-text";
import Image from "next/image";

export default function LandingPage() {
  return (
    <div className="bg-[#F8FAFC] font-body text-secondary selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="pt-20">
        <section className="relative min-h-217.5 flex items-center overflow-hidden px-8 lg:px-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full max-w-7xl mx-auto">
            <div className="z-10">
              <span className="inline-block px-4 py-1.5 mb-6 text-[11px] font-bold tracking-[0.15em] text-[#743B00] bg-[#743B00]/10 rounded-full uppercase">
                Puslapdik Kemendikbudristek
              </span>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.2] text-primary mb-8 tracking-tight">
                Sistem Informasi Akademik dan
                
                <div className="block w-full mt-2">
                  <CanvasText
                    text="KIP-Kuliah Terpadu"
                    className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white"
                    backgroundClassName="bg-white"
                    colors={[
                      "rgba(0, 86, 179, 1)",   /* Warna Solid #0056B3 */
                      "rgba(0, 86, 179, 0.9)",
                      "rgba(0, 86, 179, 0.8)",
                      "rgba(0, 86, 179, 0.7)",
                      "rgba(0, 86, 179, 0.6)",
                      "rgba(0, 86, 179, 0.5)",
                      "rgba(0, 86, 179, 0.4)",
                      "rgba(0, 86, 179, 0.3)",
                      "rgba(0, 86, 179, 0.2)",
                      "rgba(0, 86, 179, 0.1)",
                    ]}
                    lineGap={4} // Sedikit diperkecil agar cairan terlihat lebih padat
                    animationDuration={20}
                  />
                </div>
              </h1>
              
              <p className="text-lg text-secondary leading-relaxed mb-10 max-w-xl">
                Wujudkan mimpi pendidikan tinggi Anda melalui integrasi data akademik yang cerdas dan bantuan biaya pendidikan nasional yang tepat sasaran.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/dashboard/student">
                  <button className="bg-primary text-white px-8 py-4 rounded-md font-bold text-base hover:bg-primary/90 transition-all flex items-center gap-3">
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                
                <button className="bg-transparent border border-secondary text-secondary px-8 py-4 rounded-md font-bold text-base hover:bg-secondary/5 transition-all">
                  Pelajari Alur
                </button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -top-20 -right-20 w-150 h-150 bg-primary/5 rounded-full blur-3xl"></div>
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
                <Image
                  className="w-full h-150 object-cover"
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                  alt="Mahasiswa belajar"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-xl">952k+ Mahasiswa</div>
                      <div className="text-white/80 text-sm">Telah terbantu di tahun 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              <div>
                <div className="text-4xl font-extrabold text-primary mb-2">2026</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest">Tahun Akademik</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary mb-2">100%</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest">Transparansi Data</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary mb-2">2.4jt</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest">Kuota Tersedia</div>
              </div>
              <div>
                <div className="text-4xl font-extrabold text-primary mb-2">24/7</div>
                <div className="text-xs font-bold text-secondary uppercase tracking-widest">Dukungan SAKABOT</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-4 block">
                  Agenda Mendatang
                </span>
                <h2 className="text-4xl font-bold text-primary tracking-tight">
                  Jadwal Penting KIP-Kuliah 2026
                </h2>
              </div>
              <div className="flex gap-2">
                <button className="w-12 h-12 rounded-full flex items-center justify-center border border-slate-300 bg-white text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all" title="button">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 rounded-full flex items-center justify-center border border-slate-300 bg-white text-secondary hover:bg-primary hover:text-white hover:border-primary transition-all" title="button">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-white p-8 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden border border-slate-200">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8"></div>
                <div className="mb-8">
                  <span className="px-4 py-1.5 rounded-md bg-primary/10 text-primary text-xs font-bold">REGISTRASI</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-primary">03</span>
                  <span className="text-lg font-bold text-secondary">Februari</span>
                </div>
                <div className="text-sm font-medium text-secondary mb-6 flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> s/d 31 Oktober 2026
                </div>
                <h3 className="text-xl font-bold text-primary mb-4">Pendaftaran Akun Siswa</h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  Tahap awal bagi seluruh calon pendaftar untuk memvalidasi data NIK, NISN, dan NPSN di sistem pusat.
                </p>
                <Link href="#" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all">
                  Lihat Persyaratan <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="group bg-white p-8 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden border-t-4 border-[#743B00] shadow-sm">
                <div className="mb-8">
                  <span className="px-4 py-1.5 rounded-md bg-tertiary/10 text-tertiary text-xs font-bold">SELEKSI</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-tertiary">21</span>
                  <span className="text-lg font-bold text-secondary">Maret</span>
                </div>
                <div className="text-sm font-medium text-secondary mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Jadwal Gelombang 1
                </div>
                <h3 className="text-xl font-bold text-primary mb-4">Pendaftaran UTBK-SNBT</h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  Sinkronisasi sistem SAKTI dengan portal seleksi nasional masuk perguruan tinggi negeri secara otomatis.
                </p>
                <Link href="#" className="inline-flex items-center gap-2 text-tertiary font-bold text-sm hover:gap-3 transition-all">
                  Panduan Sinkronisasi <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="group bg-white p-8 rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden border border-slate-200">
                <div className="mb-8">
                  <span className="px-4 py-1.5 rounded-md bg-secondary/10 text-secondary text-xs font-bold">MONITORING</span>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black text-secondary">01</span>
                  <span className="text-lg font-bold text-secondary">Juli</span>
                </div>
                <div className="text-sm font-medium text-secondary mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Deadline Pelaporan
                </div>
                <h3 className="text-xl font-bold text-primary mb-4">Monev & Evaluasi Penerima</h3>
                <p className="text-secondary text-sm leading-relaxed mb-6">
                  Batas akhir pemutakhiran data IPK dan status akademik bagi penerima bantuan aktif (On-Going).
                </p>
                <Link href="#" className="inline-flex items-center gap-2 text-secondary font-bold text-sm hover:gap-3 transition-all">
                  E-Reporting <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 px-8 mb-24">
          <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative bg-primary shadow-xl shadow-primary/20">
            <div 
              className="absolute inset-0 opacity-10 bg-cover bg-center" 
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }}
            ></div>
            
            <div className="relative z-10 px-12 py-16 lg:py-24 text-center">
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-8 tracking-tight">
                Siap Menggapai Pendidikan Impian?
              </h2>
              <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto">
                Mulai langkah Anda hari ini. Pastikan data profil Anda lengkap dan sesuai untuk mempermudah proses verifikasi beasiswa.
              </p>
              <Link href="/dashboard/student">
                {/* Tombol Inverted: Putih dengan text Primary */}
                <button className="bg-white text-primary px-10 py-4 rounded-md font-bold text-lg hover:bg-slate-100 transition-all">
                  Akses Portal SAKTI
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ChatWidget />
      <Footer />
    </div>
  );
}