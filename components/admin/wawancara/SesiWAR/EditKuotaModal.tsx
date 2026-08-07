"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";

export interface EditKuotaFormState {
  kuota_pewawancara: string;
  kuota_mahasiswa: string;
}

interface EditKuotaModalProps {
  open: boolean;
  tanggal: string;
  form: EditKuotaFormState;
  minKuotaPewawancara: number;
  saving: boolean;
  onChange: (form: EditKuotaFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function EditKuotaModal({
  open,
  tanggal,
  form,
  minKuotaPewawancara,
  saving,
  onChange,
  onClose,
  onSubmit,
}: EditKuotaModalProps) {
  const disabled = saving || parseInt(form.kuota_pewawancara) < minKuotaPewawancara;

  return (
    <ModalShell
      open={open}
      title="Edit Kuota Sesi"
      subtitle={new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
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
            onClick={onSubmit}
            disabled={disabled}
            className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Simpan
          </button>
        </>
      }
    >
      {minKuotaPewawancara > 0 && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
            <AlertTriangle size={12} />
            {minKuotaPewawancara} pewawancara sudah klaim kuota. Kuota pewawancara tidak boleh
            kurang dari {minKuotaPewawancara}.
          </p>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Kuota Pewawancara
        </label>
        <input
          type="number"
          min={Math.max(1, minKuotaPewawancara)}
          max={50}
          value={form.kuota_pewawancara}
          title="kuota pewawancara"
          onChange={(e) => onChange({ ...form, kuota_pewawancara: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Kuota Mahasiswa
        </label>
        <input
          type="number"
          min={1}
          value={form.kuota_mahasiswa}
          title="kuota mahasiswa"
          onChange={(e) => onChange({ ...form, kuota_mahasiswa: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
        />
        <p className="text-[11px] text-slate-400 mt-1">
          Tiap pewawancara akan mewawancarai ±
          {Math.ceil(
            parseInt(form.kuota_mahasiswa || "1") / parseInt(form.kuota_pewawancara || "1"),
          )}{" "}
          mahasiswa
        </p>
      </div>
    </ModalShell>
  );
}
