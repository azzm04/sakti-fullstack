"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Bell,
  Send,
  CalendarClock,
} from "lucide-react";

// --- DATA DUMMY ---
const riwayatMonev = [
  {
    id: 1,
    jenis: "Evaluasi Ekonomi",
    tanggal: "22 April 2026",
    status: "Belum Lengkap",
    pesan: "Evaluasi membutuhkan input, silakan melengkapi dokumen segera.",
    sudahIsi: false,
    slugId: "21110631170001",
  },
  {
    id: 2,
    jenis: "Evaluasi Akademik",
    tanggal: "15 Oktober 2025",
    status: "Selesai",
    pesan: "Evaluasi periode sebelumnya telah disetujui.",
    sudahIsi: true,
    slugId: "21110631170001",
  },
];

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
    desc: "Pengingat mendesak dua kali sehari (pagi & sore) agar tidak melewati batas waktu pengisian.",
    delay: 0.3,
  },
];

export default function RiwayatMonevPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      {/* =========================================
          SECTION 1: TABEL RIWAYAT MONEV
          ========================================= */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-primary">
          Riwayat Evaluasi Beasiswa
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary/5 border-b border-slate-200 text-secondary">
              <tr>
                <th className="p-4 font-bold w-16 text-center">No.</th>
                <th className="p-4 font-bold">Jenis</th>
                <th className="p-4 font-bold">Tanggal Evaluasi</th>
                <th className="p-4 font-bold">Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {riwayatMonev.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 text-secondary text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-semibold text-primary">
                      <FileText size={16} className="text-secondary" />
                      {item.jenis}
                    </div>
                  </td>
                  <td className="p-4 text-secondary">{item.tanggal}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-3 items-start max-w-lg">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                          item.sudahIsi
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>
                      <p className="text-secondary leading-relaxed">
                        {item.pesan}
                      </p>
                      {item.sudahIsi ? (
                        <button
                          disabled
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 font-semibold rounded-lg text-sm cursor-not-allowed"
                        >
                          <CheckCircle2 size={16} />
                          Sudah mengisi
                        </button>
                      ) : (
                        <Link
                          href={`/mahasiswa/monev/${item.slugId}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary/90 transition-all shadow-sm hover:shadow active:scale-95"
                        >
                          <AlertCircle size={16} />
                          Isi Evaluasi
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="border-slate-200" />

      {/* =========================================
          SECTION 2: INTEGRASI BOT TELEGRAM SAKTI
          ========================================= */}
      <section className="space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-secondary mb-2">
            <Bell size={16} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Layanan Pengingat Otomatis
            </span>
          </div>
          <h2 className="text-2xl font-bold text-primary">Smart Bot SAKTI</h2>
          <p className="text-secondary mt-1 max-w-2xl text-sm">
            Hubungkan akun Telegram Anda untuk menerima pengingat otomatis
            jadwal pengisian Monev tanpa perlu membuka aplikasi terus-menerus.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Flow & Jadwal (Mengambil 2/3 ruang) */}
          <div className="lg:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-primary mb-6 flex items-center gap-2">
              <CalendarClock size={18} />
              Jadwal Notifikasi & Flow
            </h3>

            <div className="relative pl-6 space-y-8">
              {/* Garis vertikal timeline */}
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
                  {/* Dot timeline */}
                  <div className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-primary/10" />

                  <span className="text-[11px] font-bold text-primary/70 tracking-widest uppercase">
                    {step.phase}
                  </span>
                  <h4 className="text-base font-bold text-primary mt-0.5">
                    {step.title}
                  </h4>
                  <p className="text-secondary mt-1 text-sm leading-relaxed max-w-md">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Kolom Kanan: Card Aktivasi (Mengambil 1/3 ruang) */}
          <div className="bg-primary rounded-xl p-6 shadow-lg relative overflow-hidden flex flex-col justify-center">
            {/* Ornamen background abstrak */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                <Send size={24} className="text-white ml-1" />
              </div>
              <h3 className="text-lg font-bold text-white">Mulai Sekarang</h3>
              <p className="text-white/80 text-sm leading-relaxed pb-2">
                Aktivasi bot dalam hitungan detik untuk proteksi status beasiswa
                Anda.
              </p>


              <p className="text-white/50 text-[10px]">
                Dengan mengaktifkan, Anda menyetujui sistem akan mengirimkan
                pesan otomatis ke nomor Anda.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
