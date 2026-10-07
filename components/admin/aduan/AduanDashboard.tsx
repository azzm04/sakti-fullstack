"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Loader2, Search } from "lucide-react";


type StatusAduan = "MENUNGGU" | "DIPROSES" | "SELESAI" | "DITOLAK";

interface Aduan {
  id: string;
  kode_laporan: string;
  jenis_aduan: string;
  nama_terlapor: string;
  nim_terlapor: string | null;
  fakultas_prodi: string | null;
  angkatan: string | null;
  status: StatusAduan;
  created_at: string;
}

const STATUS_LABEL: Record<StatusAduan, string> = {
  MENUNGGU: "Menunggu",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITOLAK: "Ditolak",
};

const KATEGORI_LABEL: Record<string, string> = {
  KETIDAKTEPATAN: "Ketidaktepatan Sasaran",
  PENYALAHGUNAAN: "Penyalahgunaan Dana",
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    MENUNGGU: "bg-amber-50 text-amber-700 border-amber-200",
    DIPROSES: "bg-blue-50 text-blue-700 border-blue-200",
    SELESAI: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DITOLAK: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 font-roboto text-[11px] font-semibold rounded-[4px] border ${cls[status] ?? "bg-slate-100 text-slate-500 border-slate-200"
        }`}
    >
      {STATUS_LABEL[status as StatusAduan] ?? status}
    </span>
  );
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AduanDashboard() {
  const [laporan, setLaporan] = useState<Aduan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLaporan = async () => {
      try {
        const res = await fetch("/api/admin/aduan");
        const result = await res.json();
        if (res.ok) {
          setLaporan(result.data ?? []);
        } else {
          setError(
            res.status === 401
              ? "Sesi admin berakhir. Silakan login kembali."
              : "Gagal memuat data laporan."
          );
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err);
        setError("Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    };
    fetchLaporan();
  }, []);

  // Angka ringkasan dihitung dari seluruh laporan (tidak terpengaruh filter)
  const stats = useMemo(
    () => ({
      total: laporan.length,
      menunggu: laporan.filter((a) => a.status === "MENUNGGU").length,
      diproses: laporan.filter((a) => a.status === "DIPROSES").length,
      selesai: laporan.filter((a) => a.status === "SELESAI").length,
      ditolak: laporan.filter((a) => a.status === "DITOLAK").length,
    }),
    [laporan]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return laporan.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterJenis && a.jenis_aduan !== filterJenis) return false;
      if (!q) return true;
      return [a.kode_laporan, a.nama_terlapor, a.nim_terlapor ?? ""].some((v) =>
        v.toLowerCase().includes(q)
      );
    });
  }, [laporan, filterStatus, filterJenis, search]);

  const exportHref = useMemo(() => {
    const p = new URLSearchParams();
    if (filterStatus) p.set("status", filterStatus);
    if (filterJenis) p.set("jenis", filterJenis);
    if (search.trim()) p.set("q", search.trim());
    const s = p.toString();
    return `/api/admin/aduan/export${s ? `?${s}` : ""}`;
  }, [filterStatus, filterJenis, search]);

  const hasFilter = filterStatus || filterJenis || search;

  const selectCls =
    "h-[36px] px-3 pr-8 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_10px_center] bg-no-repeat";

  return (
    <div style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="bg-white rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#E5EAF0] overflow-hidden">
        {/* RINGKASAN */}
        <div className="flex flex-wrap items-center gap-0 border-b border-[#E5EAF0]">
          {[
            { label: "Total Laporan", value: stats.total },
            { label: "Menunggu", value: stats.menunggu },
            { label: "Diproses", value: stats.diproses },
            { label: "Selesai", value: stats.selesai },
            { label: "Ditolak", value: stats.ditolak },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              className={`flex-1 min-w-[130px] px-8 py-4 ${i < arr.length - 1 ? "border-r border-[#E5EAF0]" : ""
                }`}
            >
              <p className="font-roboto text-[22px] font-bold text-[#1A1A1A] leading-none">{value}</p>
              <p className="font-roboto text-[12px] text-[#6B7280] mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* CARI & FILTER */}
        <div className="px-8 py-4 border-b border-[#E5EAF0] flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Cari kode resi, nama terlapor, atau NIM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[36px] pl-9 pr-4 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={selectCls}>
              <option value="">Semua Status</option>
              <option value="MENUNGGU">Menunggu</option>
              <option value="DIPROSES">Diproses</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
            <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className={selectCls}>
              <option value="">Semua Kategori</option>
              <option value="KETIDAKTEPATAN">Ketidaktepatan Sasaran</option>
              <option value="PENYALAHGUNAAN">Penyalahgunaan Dana</option>
            </select>
            {hasFilter && (
              <button
                onClick={() => {
                  setFilterStatus("");
                  setFilterJenis("");
                  setSearch("");
                }
                }

                className="h-[36px] px-4 font-roboto text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] border border-[#E0E0E0] rounded-[6px] hover:border-[#c0c0c0] transition-all"
              >
                Reset
              </button>
            )}
            { }
            <a
              href={exportHref}
              className="h-[36px] inline-flex items-center gap-2 px-4 rounded-[6px] bg-[#003C71] text-white font-roboto text-[13px] font-medium hover:bg-[#00529B] transition-colors"
            >
              <Download size={14} />
              Unduh Excel
            </a>
          </div>
        </div>

        {/* ISI */}
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <Loader2 size={18} className="animate-spin text-[#00529B]" />
            <span className="font-roboto text-[14px] text-[#6B7280]">Memuat data…</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="font-roboto font-medium text-[15px] text-red-700">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-roboto font-medium text-[15px] text-[#1A1A1A] mb-1">Belum ada laporan</p>
            <p className="font-roboto text-[13px] text-[#6B7280] max-w-sm mx-auto">
              {hasFilter ? "Tidak ada laporan yang sesuai filter." : "Belum ada laporan pengaduan yang masuk."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5EAF0] bg-[#F8FAFC]">
                    <th className="px-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Resi & Tanggal</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider">Terlapor</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Kategori</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 pr-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#F0F4F8] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="px-8 py-4 whitespace-nowrap">
                        <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A]">{item.kode_laporan}</p>
                        <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5">{formatTgl(item.created_at)}</p>
                      </td>
                      <td className="px-5 py-4 max-w-[260px]">
                        <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A] truncate">{item.nama_terlapor}</p>
                        <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5 truncate">
                          {[item.nim_terlapor, item.fakultas_prodi, item.angkatan && `Angkatan ${item.angkatan}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-roboto text-[13px] text-[#374151]">
                          {KATEGORI_LABEL[item.jenis_aduan] ?? item.jenis_aduan}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-5 pr-8 py-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/aduan/${item.id}`}
                          className="inline-flex items-center gap-1.5 font-roboto text-[13px] font-medium text-[#00529B] hover:underline underline-offset-2 transition-colors"
                        >
                          Detail
                          <ExternalLink size={12} strokeWidth={2} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-8 py-3 border-t border-[#F0F4F8] bg-[#FAFBFD]">
              <p className="font-roboto text-[12px] text-[#94A3B8]">
                Menampilkan {filtered.length} dari {laporan.length} laporan{hasFilter && " (difilter)"}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}