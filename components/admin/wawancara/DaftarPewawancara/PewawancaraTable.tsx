"use client";

import { Pencil, CheckCircle2, UserCheck } from "lucide-react";
import type { Pewawancara } from "@/types/wawancara";
import LoadingState from "../shared/LoadingState";

interface PewawancaraTableProps {
  data: Pewawancara[];
  loading: boolean;
  onEdit: (p: Pewawancara) => void;
  onToggleActive: (p: Pewawancara) => void;
}

export default function PewawancaraTable({
  data,
  loading,
  onEdit,
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
              <button
                onClick={() => onEdit(p)}
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
