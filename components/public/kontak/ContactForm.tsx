"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconSend } from "@tabler/icons-react";
import { ContactFormSchema, type ContactFormData } from "@/schemas";

type Status = "idle" | "success" | "error";

const EMPTY: ContactFormData = { name: "", email: "", subject: "", message: "" };

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>(EMPTY);
  const [errors, setErrors]     = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<Status>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // clear field error on change
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod before sending
    const result = ContactFormSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ContactFormData;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (res.ok) { setSubmitStatus("success"); setFormData(EMPTY); setErrors({}); }
      else setSubmitStatus("error");
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus("idle"), 3000);
    }
  };

  const inputBase = "w-full px-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:bg-white transition-all outline-none text-on-surface";
  const inputClass = (field: keyof ContactFormData) =>
    `${inputBase} ${errors[field] ? "ring-2 ring-destructive/50" : "focus:ring-primary/20"}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
      className="lg:col-span-7"
    >
      <div className="bg-surface-container-lowest p-8 md:p-12 rounded-[2rem] shadow-lg">
        <h2 className="font-headline text-3xl font-bold mb-8">Kirim Pesan</h2>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Nama Lengkap</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                className={inputClass("name")} placeholder="Masukkan nama Anda" />
              {errors.name && <p className="text-xs text-destructive px-1">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Alamat Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className={inputClass("email")} placeholder="nama@email.com" />
              {errors.email && <p className="text-xs text-destructive px-1">{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Subjek Pertanyaan</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange}
              className={inputClass("subject")} placeholder="Tuliskan inti masalah/pertanyaan" />
            {errors.subject && <p className="text-xs text-destructive px-1">{errors.subject}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-label text-sm font-semibold text-on-surface-variant px-1">Pesan Lengkap</label>
            <textarea name="message" value={formData.message} onChange={handleChange} rows={5}
              className={`${inputClass("message")} resize-none`} placeholder="Jelaskan kebutuhan Anda secara detail..." />
            {errors.message && <p className="text-xs text-destructive px-1">{errors.message}</p>}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting}
              className="w-full md:w-auto px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting
                ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Mengirim...</span></>
                : <><span>Kirim Permintaan</span><IconSend className="w-4 h-4" /></>
              }
            </button>
            {submitStatus === "success" && <p className="mt-4 text-sm text-green-600 font-medium">✓ Pesan berhasil dikirim! Kami akan segera menghubungi Anda.</p>}
            {submitStatus === "error"   && <p className="mt-4 text-sm text-destructive font-medium">✗ Terjadi kesalahan. Silakan coba lagi.</p>}
          </div>
        </form>
      </div>
    </motion.div>
  );
}
