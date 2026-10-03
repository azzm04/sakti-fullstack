"use client";

import ModalShell from "../shared/ModalShell";
import ModalFooter from "../shared/ModalFooter";
import RoleSection from "../shared/RoleSection";

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
  /** Role akun yang sedang diedit — ditampilkan di bagian "Role akun". */
  roles?: string[];
  onDelete?: () => void;
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
  roles = [],
  onDelete,
}: PewawancaraFormModalProps) {
  const multiRole = roles.includes("MAHASISWA_KIPK");

  return (
    <ModalShell
      open={open}
      title={editing ? "Edit Akun Pengguna" : "Tambah Akun Pengguna"}
      onClose={onClose}
      maxWidth="md"
      footer={
        <ModalFooter
          saving={saving}
          saveLabel={editing ? "Simpan" : "Simpan & Kirim Email"}
          savingLabel={editing ? undefined : "Menyimpan & mengirim email..."}
          onClose={onClose}
          onSave={onSave}
          onDelete={editing ? onDelete : undefined}
          deleteLabel={multiRole ? "Cabut role" : "Hapus akun"}
        />
      }
    >
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Email <span className="text-admin-danger-bar">*</span>
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
          placeholder="email-mahasiswa@students.undip.ac.id"
          disabled={editing}
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft disabled:opacity-60 transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Nama <span className="text-admin-danger-bar">*</span>
        </label>
        <input
          type="text"
          value={form.nama}
          onChange={(e) => onChange({ ...form, nama: e.target.value })}
          placeholder="Nama Mahasiswa"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      {editing && <RoleSection roles={roles} current="PEWAWANCARA" />}
      {!editing && (
        <p className="text-[11px] text-admin-text-5 bg-admin-surface-soft rounded-xl px-3 py-2 border border-admin-border-soft">
          Email pemberitahuan penunjukan pewawancara akan dikirim ke alamat ini, dan pengguna
          bisa langsung login via OTP. Kalau email ini sudah
          terdaftar (mis. sebagai Mahasiswa KIP-K), role Pewawancara akan ditambahkan ke akun
          itu — bukan membuat akun baru.
        </p>
      )}
      {formError && (
        <p role="alert" className="text-xs text-admin-danger-text bg-admin-danger-bg rounded-xl px-3 py-2">{formError}</p>
      )}
    </ModalShell>
  );
}
