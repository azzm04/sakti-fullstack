"use client";

import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { IconMail, IconPhone, IconMapPin, IconSend } from "@tabler/icons-react";
import { Link } from "lucide-react";

export default function KontakPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Integrate with FastAPI backend
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-surface font-body text-on-surface">
      <Navbar />

      <main className="pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-widest block mb-2">
            HUBUNGI KAMI
          </span>
          <h1 className="font-headline text-5xl font-extrabold text-primary tracking-tight mb-4">
            Layanan Bantuan Terpadu
          </h1>
          <p className="max-w-2xl text-lg text-on-surface-variant font-body">
            Kami siap membantu Anda dalam proses administrasi beasiswa dan
            layanan akademik SAKTI di lingkungan Universitas Diponegoro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-lg flex gap-6 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
                <IconMapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-xl mb-2">
                  Direktorat Kemahasiswaan Undip
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Jl. Prof. Sudarto, SH, Tembalang, Semarang, Jawa Tengah 50275
                </p>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-high cursor-default"
              >
                <IconMail className="w-6 h-6 text-primary mb-3" />
                <div className="text-sm font-label uppercase tracking-tighter text-on-surface-variant mb-1">
                  Email Resmi
                </div>
                <div className="font-bold">dirmawa@live.undip.ac.id</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-surface-container-low p-6 rounded-xl transition-all hover:bg-surface-container-high cursor-default"
              >
                <IconPhone className="w-6 h-6 text-primary mb-3" />
                <div className="text-sm font-label uppercase tracking-tighter text-on-surface-variant mb-1">
                  Telepon
                </div>
                <div className="font-bold">(024) 7460024</div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative group h-64 rounded-[2rem] overflow-hidden shadow-inner bg-surface-container-high"
            >
              <img
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                src="/undip-map.jpg"
                alt="Undip Location"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-primary">
                  KAMPUS UNDIP
                </span>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-lg">
              <h2 className="font-headline text-3xl font-bold mb-8">
                Kirim Pesan
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label text-sm font-semibold text-on-surface-variant px-1">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-on-surface"
                      placeholder="Masukkan nama Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-label text-sm font-semibold text-on-surface-variant px-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-on-surface"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant px-1">
                    Subjek Pertanyaan
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-on-surface"
                    placeholder="Tuliskan inti masalah/pertanyaan"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-label text-sm font-semibold text-on-surface-variant px-1">
                    Pesan Lengkap
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-on-surface resize-none"
                    placeholder="Jelaskan kebutuhan Anda secara detail..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Permintaan</span>
                        <IconSend className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {submitStatus === "success" && (
                    <p className="mt-4 text-sm text-green-600 font-medium">
                      ✓ Pesan berhasil dikirim! Kami akan segera menghubungi
                      Anda.
                    </p>
                  )}

                  {submitStatus === "error" && (
                    <p className="mt-4 text-sm text-error font-medium">
                      ✗ Terjadi kesalahan. Silakan coba lagi.
                    </p>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* FAQ Shortcut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-24 p-12 bg-primary text-on-primary rounded-[2rem] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="relative z-10 max-w-xl">
            <h3 className="font-headline text-3xl font-bold mb-4">
              Butuh jawaban cepat?
            </h3>
            <p className="opacity-80 text-lg">
              Cek pusat bantuan kami untuk pertanyaan yang sering diajukan
              mengenai pendaftaran, pencairan dana, dan verifikasi data SAKTI.
            </p>
          </div>
          <div className="relative z-10">
            <Link
              href="/panduan"
              className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:bg-surface-container-lowest transition-colors whitespace-nowrap inline-block"
            >
              Kunjungi Pusat Bantuan
            </Link>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-20 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-tertiary-container opacity-10 blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
