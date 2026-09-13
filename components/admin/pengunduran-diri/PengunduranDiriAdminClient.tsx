"use client";

import { useState, useEffect } from "react";
import { Loader2, Search, ExternalLink } from "lucide-react";
import ModalDetailPengunduran from "./ModalDetailPengunduran";

interface Stats {
  total: number;
  menunggu: number;
  diproses: number;
  diterima: number;
}

interface Item {
  id: string;
  user_id: string;
  semester: number;
  alasan: string;
  status: string;
  catatan_admin: string | null;
  created_at: string;
  diputuskan_at: string | null;
  user?: {
    penerimaKipk?: {
      nama?: string;
      nim?: string;
      angkatan?: number;
      prodi?: { nama_prodi?: string };
    };
  };
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DIPROSES:            "Sedang Diproses",
  DITERIMA:            "Diterima",
  DITOLAK:             "Ditolak",
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    MENUNGGU_VERIFIKASI: "bg-amber-50 text-amber-700 border-amber-200",
    DIPROSES:            "bg-blue-50 text-blue-700 border-blue-200",
    DITERIMA:            "bg-emerald-50 text-emerald-700 border-emerald-200",
    DITOLAK:             "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 font-roboto text-[11px] font-semibold rounded-[4px] border ${cls[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function PengunduranDiriAdminClient() {
  const [list, setList]           = useState<Item[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, menunggu: 0, diproses: 0, diterima: 0 });
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilter] = useState("");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Item | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/pengunduran-diri?${params}`);
      if (res.ok) {
        const json = await res.json();
        setList(json.data ?? []);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchData, 400);
    return () => clearTimeout(t);
  }, [filterStatus, search]);

  const hasFilter = filterStatus || search;

  const selectCls =
    "h-[36px] px-3 pr-8 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_10px_center] bg-no-repeat";

  return (
    <div style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="bg-white rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#E5EAF0] overflow-hidden">

        <div className="flex flex-wrap items-center gap-0 border-b border-[#E5EAF0]">
          {[
            { label: "Total Pengajuan",      value: stats.total    },
            { label: "Menunggu Verifikasi",  value: stats.menunggu },
            { label: "Sedang Diproses",      value: stats.diproses },
            { label: "Diterima",             value: stats.diterima },
          ].map(({ label, value }, i, arr) => (
            <div key={label} className={`flex-1 min-w-[130px] px-8 py-4 ${i < arr.length - 1 ? "border-r border-[#E5EAF0]" : ""}`}>
              <p className="font-roboto text-[22px] font-bold text-[#1A1A1A] leading-none">{value}</p>
              <p className="font-roboto text-[12px] text-[#6B7280] mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-8 py-4 border-b border-[#E5EAF0] flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280] pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau NIM mahasiswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-[36px] pl-9 pr-4 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2.5">
            <select value={filterStatus} onChange={(e) => setFilter(e.target.value)} className={selectCls}>
              <option value="">Semua Status</option>
              <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
              <option value="DIPROSES">Sedang Diproses</option>
              <option value="DITERIMA">Diterima</option>
              <option value="DITOLAK">Ditolak</option>
            </select>
            {hasFilter && (
              <button
                onClick={() => { setFilter(""); setSearch(""); }}
                className="h-[36px] px-4 font-roboto text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A1A] border border-[#E0E0E0] rounded-[6px] hover:border-[#c0c0c0] transition-all"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20">
            <Loader2 size={18} className="animate-spin text-[#00529B]" />
            <span className="font-roboto text-[14px] text-[#6B7280]">Memuat data…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-roboto font-medium text-[15px] text-[#1A1A1A] mb-1">Belum ada pengajuan</p>
            <p className="font-roboto text-[13px] text-[#6B7280] max-w-sm mx-auto">
              {hasFilter ? "Tidak ada pengajuan yang sesuai filter." : "Belum ada mahasiswa yang mengajukan pengunduran diri."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#E5EAF0] bg-[#F8FAFC]">
                    <th className="px-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider">Mahasiswa</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Semester</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-5 pr-8 py-3 font-roboto font-semibold text-[11px] text-[#6B7280] uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((item) => {
                    const nama  = item.user?.penerimaKipk?.nama ?? "—";
                    const nim   = item.user?.penerimaKipk?.nim ?? "";
                    const prodi = item.user?.penerimaKipk?.prodi?.nama_prodi ?? "";
                    return (
                      <tr key={item.id} className="border-b border-[#F0F4F8] last:border-b-0 hover:bg-[#F8FAFC] transition-colors">
                        <td className="px-8 py-4 max-w-[220px]">
                          <p className="font-roboto font-semibold text-[14px] text-[#1A1A1A] truncate">{nama}</p>
                          <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5 truncate">
                            {[nim, prodi].filter(Boolean).join(" · ")}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-roboto text-[13px] text-[#374151]">Semester {item.semester}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-roboto text-[13px] text-[#374151]">{formatTgl(item.created_at)}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-5 pr-8 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelected(item)}
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
                Menampilkan {list.length} pengajuan{hasFilter && " (difilter)"}
              </p>
            </div>
          </>
        )}
      </div>

      {selected && (
        <ModalDetailPengunduran
          item={selected}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); fetchData(); }}
        />
      )}
    </div>
  );
}
