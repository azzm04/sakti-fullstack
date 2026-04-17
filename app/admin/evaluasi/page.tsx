"use client";

/**
 * Halaman daftar evaluasi wawancara mahasiswa.
 *
 * TODO (realtime): Ganti DUMMY_DATA dengan fetch ke /api/admin/evaluasi
 * yang mengambil data dari tabel kandidat di database (hasil import Excel).
 * Kolom wawancara (prestasi, rekomendasi, alasan, pewawancara) diisi oleh pewawancara.
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

export type EvaluasiStatus = "selesai" | "belum";

export interface MahasiswaEvaluasi {
  id: string;
  no_pendaftaran_kipk: string;
  nama: string;
  prodi: string;
  nik: string;
  no_hp: string;
  email: string;
  // Kolom wawancara — diisi pewawancara, kosong = belum
  prestasi: string;
  rekomendasi: string;
  alasan: string;
  pewawancara: string;
}

// ── Dummy data (ganti dengan fetch realtime) ──────────────
export const DUMMY_DATA: MahasiswaEvaluasi[] = [
  { id: "1",  no_pendaftaran_kipk: "1225.285.27975.5786.234", nama: "Adrian Setia Cahyo Salyawan",   prodi: "D4 MANAJEMEN DAN ADMINISTRASI LOGISTIK", nik: "3309080108040001", no_hp: "082134567890", email: "adrian@students.undip.ac.id",   prestasi: "Juara 2 olimpiade sains",  rekomendasi: "Layak",            alasan: "Kondisi ekonomi kurang mampu", pewawancara: "Dr. Budi Santoso" },
  { id: "2",  no_pendaftaran_kipk: "1225.285.27975.5786.235", nama: "Adelia Nur Ugar Rizha",         prodi: "S1 KESEHATAN MASYARAKAT",               nik: "3309080108040002", no_hp: "082134567891", email: "adelia@students.undip.ac.id",   prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
  { id: "3",  no_pendaftaran_kipk: "1225.285.27975.5786.236", nama: "Aditum Anasa Qurrota'ayun",     prodi: "S1 KESEHATAN MASYARAKAT",               nik: "3309080108040003", no_hp: "082134567892", email: "aditum@students.undip.ac.id",   prestasi: "Aktif organisasi BEM",    rekomendasi: "Dipertimbangkan",  alasan: "Perlu verifikasi lanjut",     pewawancara: "Dr. Siti Rahayu" },
  { id: "4",  no_pendaftaran_kipk: "1225.285.27975.5786.237", nama: "Adisena Gealova Putri Ghiara", prodi: "S1 AGROBISNIS/TEKNOLOGI",               nik: "3309080108040004", no_hp: "082134567893", email: "adisena@students.undip.ac.id",  prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
  { id: "5",  no_pendaftaran_kipk: "1225.285.27975.5786.238", nama: "Adinda Fathonaah",              prodi: "S1 PETERNAKAN",                         nik: "3309080108040005", no_hp: "082134567894", email: "adinda@students.undip.ac.id",   prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
  { id: "6",  no_pendaftaran_kipk: "1225.285.27975.5786.239", nama: "Adinda Qonatul Aini Tira Wisanta", prodi: "S3 ILMU PERPUSTAKAAN",              nik: "3309080108040006", no_hp: "082134567895", email: "adindaq@students.undip.ac.id",  prestasi: "Beasiswa Bidikmisi SMA",  rekomendasi: "Layak",            alasan: "Sangat membutuhkan",          pewawancara: "Dr. Budi Santoso" },
  { id: "7",  no_pendaftaran_kipk: "1225.285.27975.5786.240", nama: "Afrihya Farrel Fahriegas",      prodi: "S1 BIOLOGI",                            nik: "3309080108040007", no_hp: "082134567896", email: "afrihya@students.undip.ac.id",  prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
  { id: "8",  no_pendaftaran_kipk: "1225.285.27975.5786.241", nama: "Agista Putri Setiawan",         prodi: "S1 SASTRA INDONESIA",                   nik: "3309080108040008", no_hp: "082134567897", email: "agista@students.undip.ac.id",   prestasi: "Penulis cerpen terpilih", rekomendasi: "Layak",            alasan: "Prestasi akademik baik",      pewawancara: "Dr. Siti Rahayu" },
  { id: "9",  no_pendaftaran_kipk: "1225.285.27975.5786.242", nama: "Agita Dwi Lestari",             prodi: "S1 ADMINISTRASI PUBLIK KAMPUS REMBANG", nik: "3309080108040009", no_hp: "082134567898", email: "agita@students.undip.ac.id",    prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
  { id: "10", no_pendaftaran_kipk: "1225.285.27975.5786.243", nama: "Agripina Agatha Riosa",         prodi: "S1 EKONOMI",                            nik: "3309080108040010", no_hp: "082134567899", email: "agripina@students.undip.ac.id", prestasi: "",                        rekomendasi: "",                 alasan: "",                            pewawancara: "" },
];

type FilterStatus = "semua" | "selesai" | "belum";

function getStatus(m: MahasiswaEvaluasi): EvaluasiStatus {
  return m.rekomendasi && m.pewawancara ? "selesai" : "belum";
}

export default function EvaluasiPage() {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<FilterStatus>("semua");

  // TODO: ganti DUMMY_DATA dengan data dari API
  const data = DUMMY_DATA;

  const filtered = useMemo(() => {
    return data.filter((m) => {
      const matchSearch =
        m.nama.toLowerCase().includes(search.toLowerCase()) ||
        m.no_pendaftaran_kipk.includes(search) ||
        m.prodi.toLowerCase().includes(search.toLowerCase());
      const status = getStatus(m);
      const matchFilter = filter === "semua" || status === filter;
      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const selesaiCount = data.filter((m) => getStatus(m) === "selesai").length;
  const belumCount   = data.length - selesaiCount;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary">Evaluasi Wawancara</span>
        </nav>
        <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
          Evaluasi Wawancara
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Pantau dan validasi hasil wawancara yang diisi oleh pewawancara.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Mahasiswa", value: data.length,   color: "text-primary",      bg: "bg-primary/8"   },
          { label: "Sudah Dievaluasi", value: selesaiCount, color: "text-emerald-600",  bg: "bg-emerald-50"  },
          { label: "Belum Dievaluasi", value: belumCount,   color: "text-amber-600",    bg: "bg-amber-50"    },
        ].map(({ label, value, color, bg }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${bg} rounded-2xl border border-border p-4 shadow-sm`}
          >
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-extrabold font-headline ${color}`}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, no. pendaftaran, atau prodi..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-border rounded-xl">
          <Filter size={13} className="text-muted-foreground ml-2" />
          {(["semua", "selesai", "belum"] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === f ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "semua" ? "Semua" : f === "selesai" ? "Sudah" : "Belum"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-8">No</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nama</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Prodi</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pewawancara</th>
                <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rekomendasi</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m, idx) => {
                const status = getStatus(m);
                return (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface text-sm">{m.nama}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{m.no_pendaftaran_kipk}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{m.prodi}</td>
                    <td className="px-4 py-3 text-xs text-on-surface">
                      {m.pewawancara || <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {m.rekomendasi ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          m.rekomendasi === "Layak"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : m.rekomendasi === "Dipertimbangkan"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {m.rekomendasi}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Belum diisi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {status === "selesai" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} /> Selesai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Clock size={11} /> Menunggu
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/evaluasi/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Lihat Evaluasi <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Tidak ada data yang cocok.
          </div>
        )}
      </motion.div>
    </div>
  );
}
