"use client";

import { useState } from "react";
import { X, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface Props {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DIPROSES:            "Sedang Diproses",
  DITERIMA:            "Diterima",
  DITOLAK:             "Ditolak",
};

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-roboto font-medium text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">{label}</p>
      <div className="font-roboto text-[14px] text-[#1A1A1A]">{children}</div>
    </div>
  );
}

export default function ModalDetailPengunduran({ item, onClose, onSuccess }: Props) {
  const [status, setStatus]           = useState(item.status as string);
  const [catatan, setCatatan]         = useState(item.catatan_admin ?? "");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const nama  = item.user?.penerimaKipk?.nama  ?? "—";
  const nim   = item.user?.penerimaKipk?.nim   ?? "";
  const prodi = item.user?.penerimaKipk?.prodi?.nama_prodi ?? "";

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pengunduran-diri/${item.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatan_admin: catatan || null }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal menyimpan.");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadSurat = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(`/api/admin/pengunduran-diri/${item.id}/surat`);
      const json = await res.json();
      if (json.url) window.open(json.url, "_blank");
    } catch {
      /* silent */
    } finally {
      setDownloading(false);
    }
  };

  const handleNonaktifkan = async () => {
    if (!confirm(`Nonaktifkan akun ${nama}? Tindakan ini akan mencabut akses login mahasiswa.`)) return;
    try {
      const res = await fetch(`/api/admin/mahasiswa-kipk/${item.user_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menonaktifkan akun.");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectCls =
    "w-full pl-3 pr-8 py-[9px] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:14px_14px] bg-[position:right_10px_center] bg-no-repeat bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-[#E5EAF0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-pd-title"
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        <div className="flex items-start justify-between px-8 py-5 border-b border-[#E5EAF0]">
          <div>
            <h2 id="modal-pd-title" className="font-roboto font-semibold text-[16px] text-[#1A1A1A]">
              Detail Pengajuan
            </h2>
            <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
              {nama}{nim && <span className="text-[#94A3B8]"> · {nim}</span>}
            </p>
          </div>
          <button onClick={onClose} aria-label="Tutup" className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[4px] hover:bg-slate-100 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto flex-1 space-y-5">
          <div className="pb-5 border-b border-[#E5EAF0]">
            <p className="font-roboto font-medium text-[11px] text-[#6B7280] uppercase tracking-wider mb-2">Mahasiswa</p>
            <p className="font-roboto font-semibold text-[15px] text-[#1A1A1A]">{nama}</p>
            {(nim || prodi) && (
              <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
                {[nim, prodi].filter(Boolean).join(" · ")}
              </p>
            )}
            {item.user?.penerimaKipk?.angkatan && (
              <p className="font-roboto text-[12px] text-[#94A3B8] mt-0.5">
                Angkatan {item.user.penerimaKipk.angkatan}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Field label="Semester">{item.semester}</Field>
            <Field label="Diajukan">{formatTgl(item.created_at)}</Field>
            <div className="col-span-2">
              <Field label="Alasan">
                <p className="leading-relaxed whitespace-pre-line">{item.alasan}</p>
              </Field>
            </div>
            <div className="col-span-2">
              <Field label="Surat Pernyataan">
                <button
                  onClick={handleDownloadSurat}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 font-roboto text-[13px] font-medium text-[#00529B] hover:underline underline-offset-2 disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} strokeWidth={2} />}
                  Lihat / Unduh Surat
                </button>
              </Field>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5EAF0] space-y-4">
            <div>
              <label className="block font-roboto font-medium text-[13px] text-[#1A1A1A] mb-1.5">
                Status Pengajuan
              </label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
                <option value="MENUNGGU_VERIFIKASI">Menunggu Verifikasi</option>
                <option value="DIPROSES">Sedang Diproses</option>
                <option value="DITERIMA">Diterima</option>
                <option value="DITOLAK">Ditolak</option>
              </select>
            </div>
            <div>
              <label className="block font-roboto font-medium text-[13px] text-[#1A1A1A] mb-1.5">
                Catatan Admin <span className="text-[#94A3B8] font-normal">(opsional)</span>
              </label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan untuk mahasiswa..."
                className="w-full px-3 py-2.5 bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[13px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all resize-none"
              />
            </div>
          </div>

          {status === "DITERIMA" && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-[6px]">
              <p className="font-roboto text-[12px] text-amber-800 flex-1">
                Setelah menyimpan status Diterima, Anda dapat menonaktifkan akun mahasiswa ini secara terpisah.
              </p>
              <button
                onClick={handleNonaktifkan}
                className="shrink-0 px-3 py-1.5 font-roboto text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-[4px] transition-colors"
              >
                Nonaktifkan Akun
              </button>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#E5EAF0] rounded-b-[8px] bg-[#FAFBFD]">
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-[6px] flex items-start gap-2.5 mb-4">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="font-roboto text-[12px] font-medium text-red-800 flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0"><X size={14} /></button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="font-roboto text-[12px] text-[#94A3B8]">Diajukan {formatTgl(item.created_at)}</p>
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="px-4 py-[9px] font-roboto text-[14px] font-medium text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-50 rounded-[6px] transition-all">
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-[9px] font-roboto text-[14px] font-semibold text-white bg-[#00529B] hover:bg-[#003C71] rounded-[6px] transition-all disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Simpan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
