"use client";

import { Loader2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";

interface PewawancaraForm {
  email: string;
  nama: string;
}

interface PewawancaraFormModalProps {
  open: boolean;
  editing: boolean;
  form: PewawancaraForm;
  formError: string;
  saving: boolean;
  onChange: (form: PewawancaraForm) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function PewawancaraFormModal({
  open,
  editing,
  form,
  formError,
  saving,
  onChange,
  onClose,
  onSave,
}: PewawancaraFormModalProps) {
  return (
    <ModalShell
      open={open}
      title={editing ? "Edit Akun Pengguna" : "Tambah Akun Pengguna"}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          placeholder="email-mahasiswa@students.undip.ac.id"
          disabled={editing}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 disabled:opacity-60 transition-all"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Nama <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.nama}
          onChange={(e) => onChange({ ...form, nama: e.target.value })}
          placeholder="Nama Mahasiswa"
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 transition-all"
        />
      </div>
      {!editing && (
        <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          Pengguna otomatis bisa login via OTP menggunakan email ini.
        </p>
      )}
      {formError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>
      )}
    </ModalShell>
  );
}
