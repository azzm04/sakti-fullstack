"use client";

import { Loader2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";

interface JadikanPewawancaraModalProps {
  open: boolean;
  email: string;
  nama: string;
  formError: string;
  saving: boolean;
  onChangeNama: (nama: string) => void;
  onClose: () => void;
  onSave: () => void;
}

// Modal ringan: tambahkan role PEWAWANCARA ke akun Mahasiswa KIP-K yang
// sudah ada (skenario: pewawancara direkrut dari mahasiswa KIP-K senior).
// Email sudah pasti (dari baris tabel), jadi cuma perlu nama. Memanggil
// endpoint yang sama dengan "+ Tambah" di tab Pewawancara — supaya tidak
// ada 2 implementasi assign-role yang bisa divergen.
export default function JadikanPewawancaraModal({
  open,
  email,
  nama,
  formError,
  saving,
  onChangeNama,
  onClose,
  onSave,
}: JadikanPewawancaraModalProps) {
  return (
    <ModalShell
      open={open}
      title="Jadikan Pewawancara"
      subtitle={email}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border border-admin-border rounded-xl hover:bg-admin-surface-soft transition-all"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold bg-admin-accent text-white rounded-xl hover:bg-admin-accent/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Menyimpan..." : "Jadikan Pewawancara"}
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Nama Pewawancara <span className="text-admin-danger-bar">*</span>
        </label>
        <input
          type="text"
          value={nama}
          onChange={(e) => onChangeNama(e.target.value)}
          placeholder="Nama untuk ditampilkan sebagai pewawancara"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <p className="text-[11px] text-admin-text-5 bg-admin-surface-soft rounded-xl px-3 py-2 border border-admin-border-soft">
        Akun ini akan tetap sebagai Mahasiswa KIP-K — role Pewawancara ditambahkan,
        bukan menggantikan. Akan muncul juga di tab Pewawancara.
      </p>
      {formError && (
        <p role="alert" className="text-xs text-admin-danger-text bg-admin-danger-bg rounded-xl px-3 py-2">
          {formError}
        </p>
      )}
    </ModalShell>
  );
}
