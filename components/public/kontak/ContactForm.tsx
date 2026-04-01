"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconSend } from "@tabler/icons-react";

type FormData = { name: string; email: string; subject: string; message: string };
type Status = "idle" | "success" | "error";

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<Status>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) { setSubmitStatus("success"); setFormData({ name: "", email: "", subject: "", message: "" }); }
      else setSubmitStatus("error");
    } catch { setSubmitStatus("error"); }
    finally { setIsSubmitting(false); setTimeout(() => setSubmitStatus("idle"), 3000); }
  };

  const inputClass = "w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all outline-none text-on-surface";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
      className="lg:col-span-7"
    >
      <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-lg">
        <h2 className="font-headline text-3xl font-bold mb-8">Kirim Pesan</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Nama Lengkap</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Masukkan nama Anda" />
            </div>
            <div className="space-y-2">
              <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Alamat Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="nama@email.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Subjek Pertanyaan</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className={inputClass} placeholder="Tuliskan inti masalah/pertanyaan" />
          </div>
          <div className="space-y-2">
            <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Pesan Lengkap</label>
            <textarea name="message" value={formData.message} onChange={handleChange} required rows={5} className={`${inputClass} resize-none`} placeholder="Jelaskan kebutuhan Anda secara detail..." />
          </div>
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Mengirim...</span></>
              ) : (
                <><span>Kirim Permintaan</span><IconSend className="w-4 h-4" /></>
              )}
            </button>
            {submitStatus === "success" && <p className="mt-4 text-sm text-green-600 font-medium">✓ Pesan berhasil dikirim! Kami akan segera menghubungi Anda.</p>}
            {submitStatus === "error"   && <p className="mt-4 text-sm text-destructive font-medium">✗ Terjadi kesalahan. Silakan coba lagi.</p>}
          </div>
        </form>
      </div>
    </motion.div>
  );
}
