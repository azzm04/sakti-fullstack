"use client";

import { Pencil, Trash2, CheckCircle2, GraduationCap } from "lucide-react";
import type { MahasiswaKipk } from "@/types/wawancara";
import LoadingState from "../shared/LoadingState";

interface MahasiswaTableProps {
  data: MahasiswaKipk[];
  loading: boolean;
  onEdit: (m: MahasiswaKipk) => void;
  onDelete: (m: MahasiswaKipk) => void;
  onToggleActive: (m: MahasiswaKipk) => void;
}

export default function MahasiswaTable({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: MahasiswaTableProps) {
  if (loading) return <LoadingState />;

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <GraduationCap size={32} className="text-admin-border mx-auto mb-3" />
        <p className="text-sm text-admin-text-5">Belum ada mahasiswa KIP-K terdaftar</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-admin-surface-soft border-b border-admin-border-soft">
          {["Nama", "Email", "NIM", "Prodi", "Status", "Aksi"].map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-admin-text-5"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-admin-surface-soft">
        {data.map((m) => (
          <tr key={m.id} className="hover:bg-admin-surface-soft/60 transition-colors">
            <td className="px-4 py-3">
              <p className="font-semibold text-admin-text">{m.penerima_kipk?.nama ?? "—"}</p>
            </td>
            <td className="px-4 py-3">
              <p className="text-[11px] font-semibold text-admin-text">{m.email_sso}</p>
            </td>
            <td className="px-4 py-3">
              <p className="text-[11px] text-admin-text-3">{m.penerima_kipk?.nim ?? "—"}</p>
            </td>
            <td className="px-4 py-3">
              <p className="text-[11px] text-admin-text-3">{m.penerima_kipk?.prodi?.nama_prodi ?? "—"}</p>
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onToggleActive(m)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  m.status_akun === "AKTIF"
                    ? "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25 hover:bg-admin-accent/20"
                    : "bg-admin-surface-soft text-admin-text-5 border-admin-border hover:bg-admin-border-soft"
                }`}
              >
                {m.status_akun === "AKTIF" ? (
                  <>
                    <CheckCircle2 size={10} /> Aktif
                  </>
                ) : (
                  "Non-aktif"
                )}
              </button>
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(m)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-5 hover:bg-admin-border-soft hover:text-admin-accent transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(m)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-5 hover:bg-admin-danger-bg hover:text-admin-danger-bar transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
