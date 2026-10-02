"use client";

import ModalShell from "../shared/ModalShell";
import ModalFooter from "../shared/ModalFooter";
import RoleSection from "../shared/RoleSection";
import type { Prodi } from "@/types/wawancara";

interface MahasiswaForm {
  nama: string;
  nim: string;
  angkatan: string;
  prodi_id: string;
}

interface MahasiswaFormModalProps {
  open: boolean;
  email: string;
  form: MahasiswaForm;
  formError: string;
  saving: boolean;
  isNewProfile: boolean;
  prodiOptions: Prodi[];
  onChange: (form: MahasiswaForm) => void;
  onClose: () => void;
  onSave: () => void;
  roles: string[];
  onDelete: () => void;
  onJadikanPewawancara: () => void;
}

export default function MahasiswaFormModal({
  open,
  email,
  form,
  formError,
  saving,
  isNewProfile,
  prodiOptions,
  onChange,
  onClose,
  onSave,
  roles,
  onDelete,
  onJadikanPewawancara,
}: MahasiswaFormModalProps) {
  const isPewawancara = roles.includes("PEWAWANCARA");

  return (
    <ModalShell
      open={open}
      title="Edit Profil Mahasiswa"
      subtitle={email}
      onClose={onClose}
      maxWidth="md"
      footer={
        <ModalFooter
          saving={saving}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          deleteLabel={isPewawancara ? "Cabut role" : "Hapus akun"}
        />
      }
    >
      {isNewProfile && (
        <p className="text-[11px] text-admin-text-5 bg-admin-surface-soft rounded-xl px-3 py-2 border border-admin-border-soft">
          Akun ini belum punya profil KIP-K (mis. dibuat lewat penambahan role, bukan alur
          verifikasi SK). Isi semua field untuk membuat profil baru.
        </p>
      )}
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Nama {isNewProfile && <span className="text-admin-danger-bar">*</span>}
        </label>
        <input
          type="text"
          value={form.nama}
          onChange={(e) => onChange({ ...form, nama: e.target.value })}
          placeholder="Nama Mahasiswa"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          NIM {isNewProfile && <span className="text-admin-danger-bar">*</span>}
        </label>
        <input
          type="text"
          value={form.nim}
          onChange={(e) => onChange({ ...form, nim: e.target.value })}
          placeholder="24010120140001"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Angkatan {isNewProfile && <span className="text-admin-danger-bar">*</span>}
        </label>
        <input
          type="number"
          value={form.angkatan}
          onChange={(e) => onChange({ ...form, angkatan: e.target.value })}
          placeholder="2024"
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none transition-[border-color,box-shadow] duration-200"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-admin-text-4 mb-1.5">
          Program Studi {isNewProfile && <span className="text-admin-danger-bar">*</span>}
        </label>
        <select
          value={form.prodi_id}
          onChange={(e) => onChange({ ...form, prodi_id: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-xl focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20 bg-admin-surface-soft transition-[border-color,box-shadow] duration-200"
        >
          <option value="">— Pilih Program Studi —</option>
          {prodiOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama_prodi} {p.fakultas ? `— ${p.fakultas}` : ""}
            </option>
          ))}
        </select>
      </div>
      <RoleSection
        roles={roles}
        current="MAHASISWA_KIPK"
        addAction={
          isPewawancara ? undefined : { label: "Jadikan Pewawancara", onClick: onJadikanPewawancara }
        }
      />
      <p className="text-[11px] text-admin-text-5 bg-admin-surface-soft rounded-xl px-3 py-2 border border-admin-border-soft">
        Email tidak bisa diubah di sini — akun ini terverifikasi lewat SSO Undip.
      </p>
      {formError && (
        <p role="alert" className="text-xs text-admin-danger-text bg-admin-danger-bg rounded-xl px-3 py-2">{formError}</p>
      )}
    </ModalShell>
  );
}
