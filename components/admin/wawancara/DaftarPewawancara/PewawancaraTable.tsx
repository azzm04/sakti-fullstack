"use client";

import { Pencil, Trash2, CheckCircle2, UserCheck } from "lucide-react";
import type { Pewawancara } from "@/types/wawancara";
import LoadingState from "../shared/LoadingState";

interface PewawancaraTableProps {
  data: Pewawancara[];
  loading: boolean;
  onEdit: (p: Pewawancara) => void;
  onDelete: (p: Pewawancara) => void;
  onToggleActive: (p: Pewawancara) => void;
}

export default function PewawancaraTable({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
}: PewawancaraTableProps) {
  if (loading) return <LoadingState />;

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <UserCheck size={32} className="text-admin-border mx-auto mb-3" />
        <p className="text-sm text-admin-text-5">Belum ada pewawancara terdaftar</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-admin-surface-soft border-b border-admin-border-soft">
          {["Nama", "Email", "Status", "Aksi"].map((h) => (
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
        {data.map((p) => (
          <tr key={p.id} className="hover:bg-admin-surface-soft/60 transition-colors">
            <td className="px-4 py-3">
              <p className="font-semibold text-admin-text">{p.nama ?? "—"}</p>
              {(p.users?.user_roles ?? []).some((r) => r.role === "MAHASISWA_KIPK") && (
                <span className="inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-admin-accent/10 text-admin-accent-ink border border-admin-accent/25">
                  Juga: Mahasiswa KIP-K
                </span>
              )}
            </td>
            <td className="px-4 py-3">
              <p className="text-[11px] font-semibold text-admin-text">
                {p.users?.email_sso ?? "—"}
              </p>
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onToggleActive(p)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  p.users?.status_akun === "AKTIF"
                    ? "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25 hover:bg-admin-accent/20"
                    : "bg-admin-surface-soft text-admin-text-5 border-admin-border hover:bg-admin-border-soft"
                }`}
              >
                {p.users?.status_akun === "AKTIF" ? (
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
                  onClick={() => onEdit(p)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-admin-text-5 hover:bg-admin-border-soft hover:text-admin-accent transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(p)}
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
