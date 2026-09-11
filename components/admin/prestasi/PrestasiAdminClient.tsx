"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, Download, CheckCircle2, ExternalLink } from "lucide-react";
import ModalDetailPrestasi from "./ModalVerifikasi";

interface Stats {
  totalPrestasi: number;
  totalTerverifikasi: number;
  totalMahasiswaAktif: number;
}

interface PrestasiItem {
  id: string;
  prestasi_dicapai: string;
  nama_kegiatan: string;
  jenis_prestasi: string;
  tingkat: string;
  penyelenggara: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  url_bukti: string;
  status_verifikasi: string;
  diverifikasi_at: string | null;
  created_at: string;
  users?: {
    penerimaKipk?: {
      nama?: string;
      nim?: string;
      prodi?: { nama_prodi?: string };
    };
  };
}

const TINGKAT_LABEL: Record<string, string> = {
  INTERNASIONAL: "Internasional",
  NASIONAL:      "Nasional",
  PROVINSI:      "Provinsi",
  KAB_KOTA:      "Kab/Kota",
  UNIVERSITAS:   "Universitas",
  FAKULTAS:      "Fakultas",
  PROGRAM_STUDI: "Program Studi",
};

const JENIS_LABEL: Record<string, string> = {
  AKADEMIK:              "Akademik",
  NON_AKADEMIK:          "Non-Akademik",
  ORGANISASI:            "Organisasi",
  KEPANITIAAN:           "Kepanitiaan",
  PENGABDIAN_MASYARAKAT: "Pengabdian Masyarakat",
};

function StatusBadge({ status }: { status: string }) {
  if (status === "TERVERIFIKASI") {
    return (
      <span className="inline-block px-2.5 py-0.5 font-roboto text-[11px] font-semibold rounded-[4px] bg-emerald-50 text-emerald-700 border border-emerald-200">
        Terverifikasi
      </span>
    );
  }
  return (
    <span className="inline-block px-2.5 py-0.5 font-roboto text-[11px] font-medium rounded-[4px] bg-slate-100 text-slate-500 border border-slate-200">
      Tercatat
    </span>
  );
}

export function PrestasiAdminClient() {
  const [prestasiList, setPrestasiList] = useState<PrestasiItem[]>([]);
  const [stats, setStats] = useState<Stats>({ totalPrestasi: 0, totalTerverifikasi: 0, totalMahasiswaAktif: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTingkat, setFilterTingkat] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<PrestasiItem | null>(null);

  const fetchPrestasi = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (filterTingkat) params.append("tingkat", filterTingkat);
      if (filterJenis) params.append("jenis", filterJenis);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/prestasi?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPrestasiList(json.data ?? []);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error("Gagal mengambil data prestasi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchPrestasi, 400);
    return () => clearTimeout(t);
  }, [filterStatus, filterTingkat, filterJenis, search]);

  const handleVerifySuccess = () => {
    setSelectedItem(null);
    fetchPrestasi();
  };

  const hasActiveFilter = filterStatus || filterTingkat || filterJenis || search;

  const selectCls =
    "h-[36px] px-3 pr-8 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] " +
    "focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all cursor-pointer " +
    "appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] " +
    "bg-[length:14px_14px] bg-[position:right_10px_center] bg-no-repeat";

  return (
    <div style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="bg-white rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#E5EAF0] overflow-hidden">

        <div className="flex flex-wrap items-center gap-0 border-b border-[#E5EAF0]">
          <div className="flex-1 min-w-[140px] px-8 py-4 border-r border-[#E5EAF0]">
            <p className="font-roboto text-[22px] font-bold text-[#1A1A1A] leading-none">{stats.totalPrestasi}</p>
            <p className="font-roboto text-[12px] text-[#6B7280] mt-1">Total Prestasi Tercatat</p>
          </div>
          <div className="flex-1 min-w-[140px] px-8 py-4 border-r border-[#E5EAF0]">
            <p className="font-roboto text-[22px] font-bold text-[#1A1A1A] leading-none">{stats.totalMahasiswaAktif}</p>
            <p className="font-roboto text-[12px] text-[#6B7280] mt-1">Mahasiswa dengan Prestasi</p>
          </div>
          <div className="flex-1 min-w-[140px] px-8 py-4">
            <p className="font-roboto text-[22px] font-bold text-[#1A1A1A] leading-none">{stats.totalTerverifikasi}</p>
            <p className="font-roboto text-[12px] text-[#6B7280] mt-1">Terverifikasi</p>
          </div>
        </div>

        <div className="px-8 py-4 border-b border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              placeholder="Cari kegiatan, penyelenggara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[36px] pl-9 pr-4 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Semua Status</option>
              <option value="TERCATAT">Tercatat</option>
              <option value="TERVERIFIKASI">Terverifikasi</option>
            </select>
            <select value={filterTingkat} onChange={(e) => setFilterTingkat(e.target.value)} className={selectCls}>
              <option value="">Semua Tingkat</option>
              <option value="INTERNASIONAL">Internasional</option>
              <option value="NASIONAL">Nasional</option>
              <option value="PROVINSI">Provinsi</option>
              <option value="KAB_KOTA">Kab/Kota</option>
              <option value="UNIVERSITAS">Universitas</option>
              <option value="FAKULTAS">Fakultas</option>
              <option value="PROGRAM_STUDI">Program Studi</option>
            </select>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className={selectCls}>
              <option value="">Semua Kategori</option>
              <option value="AKADEMIK">Akademik</option>
              <option value="NON_AKADEMIK">Non-Akademik</option>
              <option value="ORGANISASI">Organisasi</option>
              <option value="KEPANITIAAN">Kepanitiaan</option>
              <option value="PENGABDIAN_MASYARAKAT">Pengabdian Masyarakat</option>
            </select>
            {hasActiveFilter && (
              <button
                onClick={() => { setFilterStatus(""); setFilterTingkat(""); setFilterJenis(""); setSearch(""); }}
                className="h-[36px] px-4 font-roboto text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] border border-[#E0E0E0] rounded-[6px] hover:border-[#c0c0c0] transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => alert("Fitur ekspor akan segera tersedia.")}
              className="h-[36px] inline-flex items-center gap-2 px-4 font-roboto text-[13px] font-semibold text-white bg-[#00529B] hover:bg-[#003C71] rounded-[6px] transition-all"
            >
              <Download size={14} strokeWidth={2} />
              Export Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <Loader2 size={18} className="animate-spin text-[#00529B]" />
            <span className="font-roboto text-[14px] text-[#6B7280]">Memuat data…</span>
          </div>
        ) : prestasiList.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-roboto font-medium text-[15px] text-[#1A1A1A] mb-1">Belum ada data prestasi</p>
            <p className="font-roboto text-[13px] text-[#6B7280] max-w-sm mx-auto">
              {hasActiveFilter
                ? "Tidak ada prestasi yang sesuai dengan pencarian atau filter yang dipilih."
                : "Belum ada mahasiswa yang mencatat prestasi."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5EAF0] bg-[#F8FAFC]">
                    <th className="px-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider">Mahasiswa</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider">Pencapaian</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tingkat</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 pr-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {prestasiList.map((item) => {
                    const nama  = item.users?.penerimaKipk?.nama ?? "—";
                    const nim   = item.users?.penerimaKipk?.nim ?? "";
                    const prodi = item.users?.penerimaKipk?.prodi?.nama_prodi ?? "";
                    return (
                      <tr key={item.id} className="border-b border-[#F0F4F8] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-8 py-4 max-w-[200px]">
                          <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A] truncate">{nama}</p>
                          <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5 truncate">
                            {[nim, prodi].filter(Boolean).join(" · ")}
                          </p>
                        </td>
                        <td className="px-5 py-4 max-w-[260px]">
                          <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A] truncate">{item.prestasi_dicapai}</p>
                          <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5 truncate">{item.nama_kegiatan}</p>
                          <span className="mt-1 inline-block font-roboto text-[12px] text-[#94A3B8]">
                            {JENIS_LABEL[item.jenis_prestasi] ?? item.jenis_prestasi}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-roboto text-[13px] text-[#374151]">
                            {TINGKAT_LABEL[item.tingkat] ?? item.tingkat.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status_verifikasi} />
                        </td>
                        <td className="px-5 pr-8 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="inline-flex items-center gap-1.5 font-roboto text-[13px] font-medium text-[#00529B] hover:underline underline-offset-2 transition-colors"
                          >
                            Detail
                            <ExternalLink size={12} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-3 border-t border-[#F0F4F8] bg-[#FAFBFD]">
              <p className="font-roboto text-[12px] text-[#94A3B8]">
                Menampilkan {prestasiList.length} data{hasActiveFilter && " (difilter)"}
              </p>
            </div>
          </>
        )}
      </div>

      {selectedItem && (
        <ModalDetailPrestasi
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={handleVerifySuccess}
        />
      )}
    </div>
  );
}
