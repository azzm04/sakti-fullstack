"use client";

import { motion } from "framer-motion";
import {
  ClipboardList,
  MapPin,
  MonitorSmartphone,
  CreditCard,
  ShieldCheck,
  FileText,
  UserSquare2,
} from "lucide-react";

// Merangkum 20 poin data yang harus disiapkan ke dalam 3 kategori utama
const ELIGIBILITY = [
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: "Data Diri & Keluarga",
    description:
      "Siapkan No. Pendaftaran KIP-K, NIK, KK, NISN, sekolah asal, jumlah tanggungan, serta pekerjaan & penghasilan orang tua.",
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: "Data Tempat Tinggal",
    description:
      "Meliputi alamat domisili, jumlah PBB terakhir, daya listrik, nomor kontak, serta titik koordinat GPS / Google Maps rumah.",
  },
  {
    icon: <MonitorSmartphone className="w-6 h-6" />,
    title: "Tahapan Registrasi & Wawancara",
    description:
      "Data dan berkas di-input melalui regonline.undip.ac.id, dilanjutkan dengan tahap wawancara secara daring.",
    highlighted: true,
  },
];

// Merangkum 4 poin dokumen fisik yang harus di-upload
const DOCUMENTS = [
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: "Kartu Pendaftaran",
    subtitle: "Kartu pendaftaran resmi KIP Kuliah",
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: "Bukti Bansos",
    subtitle: "Dokumen bukti bantuan sosial (KIP / KKS / SKTM)",
  },
  {
    icon: <UserSquare2 className="w-8 h-8" />,
    title: "Penghasilan Bapak",
    subtitle: "Slip gaji atau surat keterangan dari pemerintah setempat",
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Penghasilan Ibu",
    subtitle: "Slip gaji atau surat keterangan dari pemerintah setempat",
  },
];

export default function EligibilitySection() {
  return (
    <section className="py-24 px-8 bg-slate-50" id="syarat">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Data & Proses */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">
                Kebutuhan Data Pendaftaran
              </h2>
              <p className="text-slate-500 text-lg">
                Mahasiswa calon penerima KIP Kuliah diwajibkan menyiapkan
                kelengkapan data berikut:
              </p>
            </div>
            <div className="space-y-4">
              {ELIGIBILITY.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex gap-5 p-6 bg-white rounded-2xl border shadow-sm ${item.highlighted ? "border-l-4 border-l-primary border-y-slate-100 border-r-slate-100" : "border-slate-100"}`}
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

          {/* Dokumen */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary font-headline tracking-tight">
                Dokumen Wajib (Soft-file)
              </h2>
              <p className="text-slate-500 text-lg">
                Disiapkan dalam bentuk softfile dan dijadikan satu dengan bukti
                dukung UKT untuk di-upload:
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOCUMENTS.map((doc, index) => (
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
  );
}
