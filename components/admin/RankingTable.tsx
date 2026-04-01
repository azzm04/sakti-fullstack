"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Filter, Download, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import {
  RAW_DATA, STATUS_STYLE, AVATAR_COLORS, STATUS_FILTERS, PAGE_SIZE,
  getInitials, type SortKey, type SortDir, type StatusFilter,
} from "./data";

export default function RankingTable() {
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Semua");
  const [sortKey, setSortKey]         = useState<SortKey>("rank");
  const [sortDir, setSortDir]         = useState<SortDir>("asc");
  const [page, setPage]               = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...RAW_DATA];
    if (search) data = data.filter((d) =>
      d.nama.toLowerCase().includes(search.toLowerCase()) || d.nim.includes(search)
    );
    if (statusFilter !== "Semua") data = data.filter((d) => d.status === statusFilter);
    data.sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return (a[sortKey] > b[sortKey] ? 1 : -1) * mul;
    });
    return data;
  }, [search, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortBtn = ({ col }: { col: SortKey }) => (
    <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleSort(col)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
      <ArrowUpDown size={12} />
    </motion.button>
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-5 md:px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-headline font-bold text-foreground text-base">Hasil Perangkingan SMART-TOPSIS</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Diurutkan berdasarkan nilai preferensi tertinggi</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama / NIM..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-8 pr-3 py-2 bg-muted border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-48"
            />
          </div>
          <div className="relative">
            <Filter size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              className="pl-7 pr-3 py-2 bg-muted border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer text-foreground"
            >
              {STATUS_FILTERS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <Download size={13} /> Ekspor Excel
          </motion.button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-muted/40 text-muted-foreground text-[11px] font-bold uppercase tracking-wider border-b border-border">
              <th className="px-5 py-3 text-left w-16"><span className="flex items-center">Rank <SortBtn col="rank" /></span></th>
              <th className="px-5 py-3 text-left">Nama Mahasiswa</th>
              <th className="px-5 py-3 text-left hidden md:table-cell">Program Studi</th>
              <th className="px-5 py-3 text-left"><span className="flex items-center">IPK <SortBtn col="ipk" /></span></th>
              <th className="px-5 py-3 text-left hidden lg:table-cell"><span className="flex items-center">Penghasilan OT <SortBtn col="penghasilan_raw" /></span></th>
              <th className="px-5 py-3 text-center hidden lg:table-cell">Tanggungan</th>
              <th className="px-5 py-3 text-left"><span className="flex items-center">Skor TOPSIS <SortBtn col="skor" /></span></th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {paginated.length === 0 ? (
                <motion.tr key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </motion.tr>
              ) : paginated.map((row, i) => {
                const avatarColor = AVATAR_COLORS[row.rank % AVATAR_COLORS.length];
                const st = STATUS_STYLE[row.status];
                return (
                  <motion.tr
                    key={row.nim}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0, transition: { duration: 0.25, delay: i * 0.04 } }}
                    exit={{ opacity: 0 }}
                    layout
                    whileHover={{ backgroundColor: "hsl(210 40% 96.1% / 0.4)" }}
                    className="transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className={`text-sm font-bold ${row.rank <= 2 ? "text-primary" : "text-muted-foreground"}`}>#{row.rank}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${avatarColor}`}>
                          {getInitials(row.nama)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{row.nama}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{row.nim}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden md:table-cell">{row.prodi}</td>
                    <td className="px-5 py-3.5 font-semibold text-sm">{row.ipk}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{row.penghasilan}</td>
                    <td className="px-5 py-3.5 text-center text-sm hidden lg:table-cell">{row.tanggungan}</td>
                    <td className="px-5 py-3.5"><span className="font-mono font-bold text-primary text-sm">{row.skor.toFixed(4)}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        {row.status}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 md:px-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Menampilkan{" "}
          <span className="font-semibold text-foreground">
            {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)}
          </span>{" "}
          dari <span className="font-semibold text-foreground">{filtered.length}</span> hasil
        </p>
        <div className="flex items-center gap-1">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft size={15} />
          </motion.button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p); return acc;
            }, [])
            .map((p, i) => p === "..." ? (
              <span key={`e-${i}`} className="px-1 text-muted-foreground text-xs">…</span>
            ) : (
              <motion.button key={p} whileTap={{ scale: 0.9 }} onClick={() => setPage(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${page === p ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}>
                {p}
              </motion.button>
            ))}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight size={15} />
          </motion.button>
        </div>
      </div>
    </motion.section>
  );
}
