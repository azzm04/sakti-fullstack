"use client";

import { useState } from "react";
import {UploadCloud } from "lucide-react";
import Link from "next/link";

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function FormEvaluasiMonev() {
  // State untuk input form
  const [pendapatanAyah, setPendapatanAyah] = useState<number>(0);
  const [pendapatanIbu, setPendapatanIbu] = useState<number>(0);
  const [pendapatanLain, setPendapatanLain] = useState<number>(0);
  const [tanggungan, setTanggungan] = useState<number>(1);

  // Kalkulasi Otomatis
  const totalPendapatan = pendapatanAyah + pendapatanIbu + pendapatanLain;
  const rupiahPerTanggungan = tanggungan > 0 ? totalPendapatan / tanggungan : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Link href="/mahasiswa/monev" className="inline-flex items-center gap-1 text-primary font-medium text-sm">
        <span> ← </span> Kembali ke Daftar Evaluasi
      </Link>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
      
        <h1 className="text-xl font-bold text-primary">
          Form Evaluasi Ekonomi Beasiswa - SAKTI
        </h1>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        {/* SECTION 1: Pekerjaan dan Pendapatan Orang Tua */}
        <section className="space-y-6">
          {/* Menggunakan text-primary untuk Heading agar branding SAKTI terasa */}
          <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-slate-200 pb-2">
            Pekerjaan dan Pendapatan Orang Tua
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Ayah */}
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-8 shadow-sm">
              {/* Pekerjaan Ayah */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pekerjaan Ayah
                </label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  title="Input Pekerjaan Ayah"
                >
                  <option>Pilih Pekerjaan...</option>
                  <option>Petani</option>
                  <option>PNS / TNI / Polri</option>
                  <option>Wiraswasta</option>
                </select>

                <div className="mt-3">
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                    title="Upload Bukti Pekerjaan"
                  />
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <span className="block text-secondary">
                      * Upload bukti pekerjaan (pdf/gambar)
                    </span>
                    <span className="block text-red-500/90 font-medium">
                      * Ukuran file maksimal 1 MB
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Pendapatan Ayah */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pendapatan Ayah (per bulan)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="0"
                    onChange={(e) => setPendapatanAyah(Number(e.target.value))}
                  />
                </div>

                <div className="mt-3">
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                    title="Upload Slip Gaji"
                  />
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <span className="block text-secondary">
                      * Upload slip gaji / surat penghasilan
                    </span>
                    <span className="block text-red-500/90 font-medium">
                      * Ukuran file maksimal 1 MB
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu Ibu (Struktur identik dengan Ayah) */}
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-8 shadow-sm">
              {/* Pekerjaan Ibu */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pekerjaan Ibu
                </label>
                <select
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  title="Input Pekerjaan Ibu"
                >
                  <option>Pilih Pekerjaan...</option>
                  <option>Ibu Rumah Tangga</option>
                  <option>Petani</option>
                  <option>Wiraswasta</option>
                </select>

                <div className="mt-3">
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                    title="Upload Bukti Pekerjaan"
                  />
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <span className="block text-secondary">
                      * Upload bukti pekerjaan (pdf/gambar)
                    </span>
                    <span className="block text-red-500/90 font-medium">
                      * Ukuran file maksimal 1 MB
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Pendapatan Ibu */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pendapatan Ibu (per bulan)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="0"
                    onChange={(e) => setPendapatanIbu(Number(e.target.value))}
                  />
                </div>

                <div className="mt-3">
                  <input
                    type="file"
                    accept=".pdf, image/*"
                    className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                    title="Upload Slip Gaji"
                  />
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <span className="block text-secondary">
                      * Upload slip gaji / surat penghasilan
                    </span>
                    <span className="block text-red-500/90 font-medium">
                      * Ukuran file maksimal 1 MB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 & 3: Pendapatan Lain & Tanggungan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <section className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-xl font-bold text-primary border-b border-slate-200 pb-2">
              Pendapatan Lain-lain
            </h2>
            {/* Alert Box dengan UX SAKTI */}
            <div className="bg-primary/5 border-l-4 border-primary p-3.5 rounded-r-lg text-sm text-secondary leading-relaxed">
              Pendapatan lain selain dari orang tua yang dapat berasal dari
              usaha sendiri, wali, dsb. Jika tidak ada, silakan isi dengan 0.
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Pendapatan Lain-lain (per bulan)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="0"
                  onChange={(e) => setPendapatanLain(Number(e.target.value))}
                />
              </div>
              <div className="mt-3">
                <input
                  type="file"
                  accept=".pdf, image/*"
                  className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                  title="Input Bukti Pendapatan Lain"
                />
                <div className="mt-1.5 text-xs space-y-0.5">
                  <span className="block text-secondary">
                    * Upload bukti pendapatan lainnya
                  </span>
                  <span className="block text-red-500/90 font-medium">
                    * Ukuran file maksimal 1 MB
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-xl font-bold text-primary border-b border-slate-200 pb-2">
              Tanggungan
            </h2>
            {/* Alert Box dengan UX SAKTI */}
            <div className="bg-primary/5 border-l-4 border-primary p-3.5 rounded-r-lg text-sm text-secondary leading-relaxed">
              Jumlah tanggungan (termasuk diri sendiri), dibuktikan dengan scan
              Kartu Keluarga.
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Jumlah Tanggungan
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                defaultValue={1}
                title="Input Tanggungan"
                onChange={(e) => setTanggungan(Number(e.target.value) || 1)}
              />
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                  title="Input KK"
                />
                <div className="mt-1.5 text-xs space-y-0.5">
                  <span className="block text-red-500/90 font-medium">
                    * Format file HANYA BOLEH Gambar (jpg/png)
                  </span>
                  <span className="block text-red-500/90 font-medium">
                    * Ukuran file maksimal 1 MB
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 4: Perhitungan Sistem (Otomatis) */}
        <section className="bg-slate-100 p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-600">
              Total Pendapatan (Ayah + Ibu + Lainnya):
            </span>
            <span className="font-bold text-slate-800">
              {formatRupiah(totalPendapatan)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-600">
              Rupiah per Tanggungan (Total / Tanggungan):
            </span>
            <span className="font-bold text-slate-800">
              {formatRupiah(rupiahPerTanggungan)}
            </span>
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-colors shadow-md"
          >
            Kirim Evaluasi
          </button>
        </div>
      </form>
    </div>
  );
}
