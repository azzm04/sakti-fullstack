"use client";

import { Loader2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";

interface MahasiswaForm {
  nama: string;
  nim: string;
  angkatan: string;
}

interface MahasiswaFormModalProps {
  open: boolean;
  email: string;
  form: MahasiswaForm;
  formError: string;
  saving: boolean;
  onChange: (form: MahasiswaForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function MahasiswaFormModal({
  open,
  email,
  form,
  formError,
  saving,
  onChange,
  onClose,
  onSave,
}: MahasiswaFormModalProps) {
  return (
    <ModalShell
      open={open}
      title="Edit Profil Mahasiswa"
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
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">Nama</label>
        <input
          type="text"
          value={form.nama}
          onChange={(e) => onChange({ ...form, nama: e.target.value })}
          placeholder="Nama Mahasiswa"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">NIM</label>
        <input
          type="text"
          value={form.nim}
          onChange={(e) => onChange({ ...form, nim: e.target.value })}
          placeholder="24010120140001"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">Angkatan</label>
        <input
          type="number"
          value={form.angkatan}
          onChange={(e) => onChange({ ...form, angkatan: e.target.value })}
          placeholder="2024"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <p className="text-[11px] text-admin-text-5 bg-admin-surface-soft rounded-xl px-3 py-2 border border-admin-border-soft">
        Email tidak bisa diubah di sini — akun ini terverifikasi lewat SSO Undip. Program studi
        juga belum bisa diedit dari sini karena datanya berasal dari tabel program studi terpisah.
      </p>
      {formError && (
        <p role="alert" className="text-xs text-admin-danger-text bg-admin-danger-bg rounded-xl px-3 py-2">{formError}</p>
      )}
    </ModalShell>
  );
}
