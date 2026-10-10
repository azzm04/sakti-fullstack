"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const LANGKAH = [
  {
    judul: "Isi formulir",
    isi: "Lengkapi data terlapor dan uraian kejadian, lalu lampirkan bukti berupa gambar atau PDF.",
  },
  {
    judul: "Verifikasi oleh Dirmawa",
    isi: "Laporan ditinjau oleh admin Dirmawa. Nomor WhatsApp Anda akan dihubungi  apabila diperlukan konfirmasi lebih lanjut.",
  },
  {
    judul: "Pantau dengan kode resi",
    isi: "Anda menerima kode resi untuk melihat status laporan kapan saja, tanpa perlu login.",
  },
];

export default function PengaduanSection() {
  return (
    <section
      id="pengaduan"
      className="bg-[#F8FAFC] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto max-w-6xl"
      >
        <div className="grid items-center gap-10 rounded-3xl bg-[#001349] p-8 text-white md:grid-cols-2 md:gap-14 md:p-14">
          {/* Kiri: pesan dan tombol */}
          <div>
            <p className="text-sm font-semibold text-blue-200">
              Integritas pendidikan
            </p>
            <h2 className="font-headline mt-3 text-3xl leading-tight sm:text-4xl">
              Layanan Pengaduan Ketidaktepatan / Penyalahgunaan KIPK Universitas Diponegoro
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-blue-100">
              Form ini digunakan untuk menerima laporan dan bukti terkait dugaan penyalahgunaan Program KIP-Kuliah di Universitas Diponegoro.
              Seluruh informasi yang disampaikan akan digunakan sebagai bahan verifikasi dan akan dijaga kerahasiaannya sesuai kebutuhan proses penanganan laporan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/layanan-aduan"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#001349] transition-colors hover:bg-blue-50"
              >
                Buat laporan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/cek-aduan"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Lacak dengan kode resi
              </Link>
            </div>
          </div>

          {/* Kanan: alur pelaporan */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Alur pelaporan
            </p>

            <ol className="mt-5 space-y-6">
              {LANGKAH.map((l, i) => (
                <li key={l.judul} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{l.judul}</p>
                    <p className="mt-1 text-sm leading-relaxed text-blue-100">
                      {l.isi}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="mt-6 border-t border-white/10 pt-5 text-sm text-blue-100">
              Nama Anda dapat dirahasiakan dari terlapor.
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}