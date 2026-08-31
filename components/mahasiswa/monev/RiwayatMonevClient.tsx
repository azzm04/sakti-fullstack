"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle, CheckCircle2, FileText, Bell, Send,
  CalendarClock, Clock, CheckCircle, Loader2
} from "lucide-react";
import ActivationButton from "@/components/aktivasi-bot/ActivationButton";

interface MonevSchedule {
  id: string;
  tipe_monev: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

const getDaysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const TIMELINE = [
  {
    phase: "Fase Persiapan",
    title: "H-30 sampai H-3",
    desc: "Pengingat rutin setiap 3 hari agar Anda memiliki cukup waktu menyiapkan dokumen Monev.",
    delay: 0.1,
  },
  {
    phase: "Pengingat Akhir",
    title: "H-2 dan H-1",
    desc: "Pengingat mendesak dua kali sehari (pagi & sore) agar tidak melewatkan batas waktu pengisian.",
    delay: 0.3,
  },
];

interface RiwayatMonevClientProps {
  initialSchedules: MonevSchedule[];
  initialSubmittedIds: string[];
}

export default function RiwayatMonevClient({ initialSchedules, initialSubmittedIds }: RiwayatMonevClientProps) {
  const schedules = initialSchedules;

  // State status koneksi Telegram
  const [telegramStatus, setTelegramStatus] = useState<{
    connected: boolean;
    loading: boolean;
  }>({ connected: false, loading: true });

  const [submittedIds] = useState<Set<string>>(new Set(initialSubmittedIds));

  useEffect(() => {
    fetch("/api/auth/telegram/status")
      .then((r) => r.json())
      .then((data) =>
        setTelegramStatus({ connected: data.connected === true, loading: false })
      )
      .catch(() => setTelegramStatus({ connected: false, loading: false }));
  }, []);

  const activeSchedules = schedules.filter((s) => s.is_active && !isDeadlinePassed(s.deadline));
  const historySchedules = schedules.filter((s) => !s.is_active || isDeadlinePassed(s.deadline));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* SECTION 1: EVALUASI AKTIF */}
      {activeSchedules.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-emerald-700 uppercase tracking-wider text-xs">
              Evaluasi Sedang Berlangsung
            </h2>
          </div>
          <div className="space-y-3">
            {activeSchedules.map((s) => {
              const daysLeft = getDaysLeft(s.deadline);
              const alreadySubmitted = submittedIds.has(s.id);
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    alreadySubmitted ? "bg-emerald-50/50 border-emerald-200" : "bg-emerald-50 border-emerald-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      alreadySubmitted ? "bg-emerald-100 text-emerald-600" : "bg-emerald-100 text-emerald-600"
                    }`}>
                      <CalendarClock size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900 text-sm">{s.label}</p>
                      <p className="text-xs text-emerald-700 mt-0.5">{s.tipe_monev}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {s.waktu_mulai && (
                          <span className="text-xs text-slate-500">Mulai: {formatDate(s.waktu_mulai)}</span>
                        )}
                        <span className="text-xs font-semibold text-slate-700">Deadline: {formatDate(s.deadline)}</span>
                        {alreadySubmitted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            <CheckCircle size={11} /> Sudah Mengisi
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            daysLeft <= 3 ? "bg-red-100 text-red-700" : daysLeft <= 7 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            <Clock size={11} />
                            {daysLeft > 0 ? `${daysLeft} hari lagi` : "Hari ini!"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/mahasiswa/monev/${s.id}`}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow active:scale-95 whitespace-nowrap shrink-0 ${
                      alreadySubmitted
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {alreadySubmitted ? (
                      <><CheckCircle2 size={16} /> Lihat Evaluasi</>
                    ) : (
                      <><AlertCircle size={16} /> Isi Evaluasi</>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: TABEL RIWAYAT MONEV */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-primary">Riwayat Evaluasi Beasiswa</h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {schedules.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Belum ada jadwal evaluasi yang tersedia.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-primary/5 border-b border-slate-200 text-secondary">
                <tr>
                  <th className="p-4 font-bold w-16 text-center">No.</th>
                  <th className="p-4 font-bold">Jenis</th>
                  <th className="p-4 font-bold">Tanggal Evaluasi</th>
                  <th className="p-4 font-bold">Notifikasi / Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((item, index) => {
                  const passed = isDeadlinePassed(item.deadline);
                  const isActive = item.is_active && !passed;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-secondary text-center font-medium">{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-semibold text-primary">
                          <FileText size={16} className="text-secondary shrink-0" />
                          <div>
                            <p>{item.tipe_monev}</p>
                            <p className="text-xs text-slate-400 font-normal mt-0.5">{item.label}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-secondary">
                        <div className="space-y-0.5">
                          {item.waktu_mulai && (
                            <p className="text-xs text-slate-400">Mulai: {formatDate(item.waktu_mulai)}</p>
                          )}
                          <p className="text-sm font-medium text-slate-700">Deadline: {formatDate(item.deadline)}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-3 items-start max-w-lg">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            submittedIds.has(item.id)
                              ? "bg-emerald-100 text-emerald-700"
                              : passed
                                ? "bg-slate-100 text-slate-500"
                                : isActive
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-100 text-slate-500"
                          }`}>
                            {submittedIds.has(item.id) ? "Sudah Mengisi" : passed ? "Berakhir" : isActive ? "Belum Mengisi" : "Nonaktif"}
                          </span>
                          
                          {passed ? (
                            <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed">
                              <CheckCircle2 size={16} /> Periode Berakhir
                            </button>
                          ) : isActive && submittedIds.has(item.id) ? (
                            <Link href={`/mahasiswa/monev/${item.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg text-sm hover:bg-emerald-700 transition-all shadow-sm hover:shadow active:scale-95">
                              <CheckCircle2 size={16} /> Lihat Evaluasi
                            </Link>
                          ) : isActive ? (
                            <Link href={`/mahasiswa/monev/${item.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95">
                              <AlertCircle size={16} /> Isi Evaluasi
                            </Link>
                          ) : (
                            <button disabled className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed">
                              <Clock size={16} /> Belum Dibuka
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* SECTION 3: INTEGRASI BOT TELEGRAM SAKTI */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-secondary mb-2">
            <Bell size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Layanan Pengingat Otomatis</span>
          </div>
          <h2 className="text-2xl font-bold text-primary">Smart Bot SAKTI</h2>
          <p className="text-secondary mt-1 max-w-2xl text-sm">
            Hubungkan akun Telegram Anda untuk menerima pengingat otomatis jadwal pengisian Monev tanpa perlu membuka aplikasi terus-menerus.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Flow & Jadwal */}
          <div className="lg:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
              <CalendarClock size={18} /> Jadwal Notifikasi & Flow
            </h3>

            <div className="relative pl-6 space-y-8">
              <div className="absolute left-[1px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/30 to-transparent" />
              {TIMELINE.map((step) => (
                <motion.div
                  key={step.phase}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: step.delay }}
                  className="relative"
                >
                  <div className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/10" />
                  <span className="text-[11px] font-bold text-primary/70 tracking-widest uppercase">{step.phase}</span>
                  <h4 className="text-base font-bold text-primary mt-0.5">{step.title}</h4>
                  <p className="text-secondary mt-1 text-sm leading-relaxed max-w-md">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Card Aktivasi / Status */}
          <div className="bg-primary rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
              {/* Loading state */}
              {telegramStatus.loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : telegramStatus.connected ? (
                /* Sudah terhubung */
                <div className="text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle size={24} className="text-emerald-300" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Bot Sudah Terhubung</h3>
                  <p className="text-white/80 text-sm leading-relaxed">
                    Akun Telegram Anda sudah terhubung. Anda akan menerima pengingat otomatis Monev.
                  </p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-emerald-300 text-xs font-bold">
                    <CheckCircle size={12} /> ✅ Terhubung ke Telegram
                  </span>
                </div>
              ) : (
                /* Belum terhubung — tampilkan tombol aktivasi */
                <ActivationButton />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
