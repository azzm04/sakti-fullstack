"use client";

import Link from "next/link";
import { CheckCircle2, Clock, ChevronRight, Loader2, User, CalendarDays, Users } from "lucide-react";
import type { MahasiswaListItem } from "@/schemas";
import { getStatusWawancara, getStatusWawancaraColor } from "@/schemas";
import type { Mode } from "./ModeFilterTabs";

interface MahasiswaTableProps {
  data: MahasiswaListItem[];
  loading: boolean;
  locked: boolean;
  canEdit: boolean;
  mode: Mode;
  /** Pagination */
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

/**
 * Tabel daftar mahasiswa dengan pagination.
 */
export function MahasiswaTable({
  data,
  loading,
  locked,
  canEdit,
  mode,
  page,
  totalPages,
  total,
  onPageChange,
}: MahasiswaTableProps) {
  return (
    <div className="bg-tertiary rounded-2xl border border-border shadow-sm overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Memuat...
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {["No Urut", "Nama", "Prodi", "Pewawancara", "Status", "Aksi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((m) => {
              const status = getStatusWawancara(m.is_draft, m.pewawancara_id);
              const statusColor = getStatusWawancaraColor(status);
              const done = status === "Sudah Diwawancarai";

              return (
                <tr key={m.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold font-mono text-muted-foreground">#{m.no}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{m.nama}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{m.no_pendaftaran_kipk}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">
                    {m.prodi}
                  </td>
                  <td className="px-4 py-3">
                    {m.pewawancara ? (
                      <p className="text-xs text-secondary truncate max-w-[120px]">{m.pewawancara}</p>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {done ? (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                        <CheckCircle2 size={11} /> {status}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                        <Clock size={11} /> {status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!done && canEdit ? (
                      <Link
                        href={`/pewawancara/mahasiswa/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        Isi Evaluasi <ChevronRight size={13} />
                      </Link>
                    ) : done ? (
                      <Link
                        href={`/pewawancara/mahasiswa/${m.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary hover:underline"
                      >
                        Lihat <ChevronRight size={13} />
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">Belum bisa diisi</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Empty State */}
      {!loading && !locked && data.length === 0 && (
        <div className="py-12 text-center">
          {mode === "saya" ? (
            <>
              <User size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada mahasiswa yang ditugaskan ke kamu.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tunggu admin melakukan distribusi setelah WAR selesai.</p>
            </>
          ) : mode === "hari_ini" ? (
            <>
              <CalendarDays size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Tidak ada mahasiswa terjadwal hari ini.</p>
            </>
          ) : (
            <>
              <Users size={28} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada data kandidat.</p>
            </>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Halaman {page} dari {totalPages} · {total} total</p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
