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
        <UserCheck size={32} className="text-slate-200 mx-auto mb-3" />
        <p className="text-sm text-slate-400">Belum ada pewawancara terdaftar</p>
      </div>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-100">
          {["Nama", "Email", "Status", "Aksi"].map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {data.map((p) => (
          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
            <td className="px-4 py-3">
              <p className="font-semibold text-slate-800">{p.nama ?? "—"}</p>
            </td>
            <td className="px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-800">
                {p.users?.email_sso ?? "—"}
              </p>
            </td>
            <td className="px-4 py-3">
              <button
                onClick={() => onToggleActive(p)}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  p.users?.status_akun === "AKTIF"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
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
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => onDelete(p)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
