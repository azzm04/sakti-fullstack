"use client";

import { Pencil, CheckCircle2, GraduationCap } from "lucide-react";
import type { MahasiswaKipk } from "@/types/wawancara";
import LoadingState from "../shared/LoadingState";

interface MahasiswaTableProps {
  data: MahasiswaKipk[];
  loading: boolean;
  onEdit: (m: MahasiswaKipk) => void;
  onToggleActive: (m: MahasiswaKipk) => void;
}

export default function MahasiswaTable({
  data,
  loading,
  onEdit,
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
              {m.penerima_kipk?.nama ? (
                <p className="font-semibold text-admin-text">{m.penerima_kipk.nama}</p>
              ) : (
                <p className="text-[12px] italic text-admin-text-5">Profil belum diisi</p>
              )}
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
              <button
                onClick={() => onEdit(m)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-admin-border px-2.5 py-1.5 text-[12px] font-semibold text-admin-text-2 transition-colors hover:border-admin-accent hover:text-admin-accent"
                title="Kelola akun"
              >
                <Pencil size={12} /> Kelola
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
