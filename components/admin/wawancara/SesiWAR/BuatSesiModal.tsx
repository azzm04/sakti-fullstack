"use client";

import { Users, Loader2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";

export interface FormSesiState {
  kuota_pewawancara: string;
  kuota_mahasiswa: string;
  jalur_masuk: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
}

interface BuatSesiModalProps {
  open: boolean;
  form: FormSesiState;
  kandidatCount: number | null;
  loadingCount: boolean;
  saving: boolean;
  onChange: (form: FormSesiState) => void;
  onJalurChange: (jalur: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function BuatSesiModal({
  open,
  form,
  kandidatCount,
  loadingCount,
  saving,
  onChange,
  onJalurChange,
  onClose,
  onSubmit,
}: BuatSesiModalProps) {
  const start = form.tanggal_mulai ? new Date(form.tanggal_mulai) : null;
  const end = form.tanggal_selesai ? new Date(form.tanggal_selesai) : null;
  const rentangValid = !!start && !!end && end >= start;
  const jumlahHari = rentangValid
    ? Math.floor(((end as Date).getTime() - (start as Date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  const showPreview = rentangValid && kandidatCount !== null && kandidatCount > 0;
  const perHari = showPreview ? Math.floor((kandidatCount as number) / jumlahHari) : 0;
  const sisa = showPreview ? (kandidatCount as number) % jumlahHari : 0;

  const perHariKuota = showPreview ? Math.ceil((kandidatCount as number) / jumlahHari) : 0;
  const perPewawancara =
    showPreview && parseInt(form.kuota_pewawancara || "1") > 0
      ? Math.ceil(perHariKuota / parseInt(form.kuota_pewawancara || "1"))
      : null;

  return (
    <ModalShell
      open={open}
      title="Buat Sesi Wawancara"
      subtitle="Pilih jalur masuk dan rentang tanggal"
      maxWidth="md"
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
            disabled={saving || !form.tanggal_mulai || !form.tanggal_selesai || !kandidatCount}
            className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Buat Sesi
          </button>
        </>
      }
    >
      {/* Jalur Masuk */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Jalur Masuk <span className="text-red-500">*</span>
        </label>
        <select
          value={form.jalur_masuk}
          title="Jalur masuk"
          onChange={(e) => {
            onChange({ ...form, jalur_masuk: e.target.value });
            onJalurChange(e.target.value);
          }}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
        >
          <option value="SNBT ELIGIBLE">SNBT (Eligible)</option>
          <option value="SNBT NON ELIGIBLE">SNBT (Non-Eligible)</option>
          <option value="SNBP ELIGIBLE">SNBP (Eligible)</option>
          <option value="SNBP NON ELIGIBLE">SNBP (Non-Eligible)</option>
          <option value="UM">UM (Ujian Mandiri)</option>
        </select>
        {kandidatCount !== null && (
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Users size={11} />
            {loadingCount ? (
              "Menghitung..."
            ) : (
              <>
                Total kandidat <b className="text-primary">{form.jalur_masuk}</b>:{" "}
                <b className="text-slate-800">{kandidatCount}</b> mahasiswa
              </>
            )}
          </p>
        )}
      </div>

      {/* Rentang Tanggal */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Tanggal Mulai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.tanggal_mulai}
            title="Tanggal mulai"
            onChange={(e) => onChange({ ...form, tanggal_mulai: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
            Tanggal Selesai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            title="tanggal"
            value={form.tanggal_selesai}
            min={form.tanggal_mulai || undefined}
            onChange={(e) => onChange({ ...form, tanggal_selesai: e.target.value })}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
          />
        </div>
      </div>

      {/* Preview distribusi */}
      {showPreview && (
        <div className="px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-[11px] font-semibold text-primary mb-1.5">
            Distribusi Otomatis ({jumlahHari} hari)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: jumlahHari }, (_, i) => {
              const kuota = perHari + (i < sisa ? 1 : 0);
              const d = new Date(start as Date);
              d.setDate(d.getDate() + i);
              return (
                <span
                  key={i}
                  className="text-[10px] font-bold px-2 py-1 bg-white border border-primary/20 rounded-lg text-slate-700"
                >
                  {d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}:{" "}
                  <span className="text-primary">{kuota}</span>
                </span>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Total: {kandidatCount} mahasiswa (maks tidak melebihi jumlah kandidat)
          </p>
        </div>
      )}

      {/* Kuota Pewawancara */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">
          Kuota Pewawancara / hari
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={form.kuota_pewawancara}
          title="Kuota pewawancara"
          onChange={(e) => onChange({ ...form, kuota_pewawancara: e.target.value })}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
        />
        {perPewawancara !== null && (
          <p className="text-[11px] text-slate-400 mt-1">
            Tiap pewawancara ≈ <b className="text-slate-700">{perPewawancara}</b> mahasiswa/hari
          </p>
        )}
      </div>
    </ModalShell>
  );
}
