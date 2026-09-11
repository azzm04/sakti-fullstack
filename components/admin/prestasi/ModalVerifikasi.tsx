"use client";

import { useState } from "react";
import { X, ExternalLink, Loader2, CheckCircle2, AlertCircle, FileText } from "lucide-react";

interface Props {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const TINGKAT_LABEL: Record<string, string> = {
  INTERNASIONAL: "Internasional",
  NASIONAL:      "Nasional",
  PROVINSI:      "Provinsi",
  KAB_KOTA:      "Kab/Kota",
  UNIVERSITAS:   "Universitas",
  FAKULTAS:      "Fakultas",
  PROGRAM_STUDI: "Program Studi",
};

const JENIS_LABEL: Record<string, string> = {
  AKADEMIK:              "Akademik",
  NON_AKADEMIK:          "Non-Akademik",
  ORGANISASI:            "Organisasi",
  KEPANITIAAN:           "Kepanitiaan",
  PENGABDIAN_MASYARAKAT: "Pengabdian Masyarakat",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-roboto font-medium text-[11px] text-[#6B7280] uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="font-roboto text-[14px] text-[#1A1A1A]">{children}</div>
    </div>
  );
}

export default function ModalDetailPrestasi({ item, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = item.status_verifikasi === "TERVERIFIKASI";

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/prestasi/${item.id}/verify`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: null }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal memverifikasi");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nama  = item.users?.penerimaKipk?.nama ?? "—";
  const nim   = item.users?.penerimaKipk?.nim ?? "";
  const prodi = item.users?.penerimaKipk?.prodi?.nama_prodi ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-[#E5EAF0]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ fontFamily: "Roboto, sans-serif" }}
      >
        <div className="flex items-start justify-between px-8 py-5 border-b border-[#E5EAF0]">
          <div>
            <h2 id="modal-title" className="font-roboto font-semibold text-[16px] text-[#1A1A1A]">
              Detail Prestasi
            </h2>
            <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
              {nama}{nim && <span className="text-[#94A3B8]"> · {nim}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-[4px] hover:bg-slate-100 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-8 py-6 overflow-y-auto flex-1 space-y-6">
          <div className="pb-5 border-b border-[#E5EAF0]">
            <p className="font-roboto font-medium text-[11px] text-[#6B7280] uppercase tracking-wider mb-2">Mahasiswa</p>
            <p className="font-roboto font-semibold text-[15px] text-[#1A1A1A]">{nama}</p>
            {(nim || prodi) && (
              <p className="font-roboto text-[13px] text-[#6B7280] mt-0.5">
                {[nim, prodi].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Field label="Pencapaian">
                <span className="font-semibold">{item.prestasi_dicapai}</span>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Nama Kegiatan">{item.nama_kegiatan}</Field>
            </div>
            <Field label="Kategori">
              {JENIS_LABEL[item.jenis_prestasi] ?? item.jenis_prestasi}
            </Field>
            <Field label="Tingkat">
              {TINGKAT_LABEL[item.tingkat] ?? item.tingkat.replace(/_/g, " ")}
            </Field>
            <div className="md:col-span-2">
              <Field label="Penyelenggara">{item.penyelenggara}</Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Tanggal Pelaksanaan">
                {formatTgl(item.tanggal_mulai)}
                {item.tanggal_mulai !== item.tanggal_selesai && (
                  <span className="text-[#6B7280]"> — {formatTgl(item.tanggal_selesai)}</span>
                )}
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Dokumen Bukti">
                {item.url_bukti ? (
                  <a
                    href={item.url_bukti}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-roboto text-[14px] font-medium text-[#00529B] hover:underline underline-offset-2 transition-colors"
                  >
                    <FileText size={15} strokeWidth={1.5} className="text-[#64748B]" />
                    Buka dokumen
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                ) : (
                  <span className="text-[#94A3B8]">Tidak tersedia</span>
                )}
              </Field>
            </div>
          </div>

          {isVerified && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-[6px]">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-roboto font-semibold text-[13px] text-emerald-800">Sudah Terverifikasi</p>
                {item.diverifikasi_at && (
                  <p className="font-roboto text-[12px] text-emerald-600 mt-0.5">
                    Diverifikasi pada {formatTgl(item.diverifikasi_at)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-[#E5EAF0] rounded-b-[8px] bg-[#FAFBFD]">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-[6px] flex items-start gap-3 mb-4">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="font-roboto text-sm font-medium text-red-800 flex-1">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={16} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="font-roboto text-[12px] text-[#94A3B8]">Dicatat {formatTgl(item.created_at)}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-[9px] font-roboto text-[14px] font-medium text-[#6B7280] hover:text-[#1A1A1A] hover:bg-slate-50 rounded-[6px] transition-all"
              >
                Tutup
              </button>
              {!isVerified && (
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-[9px] font-roboto text-[14px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[6px] transition-all disabled:opacity-60"
                >
                  {loading && <Loader2 size={15} className="animate-spin" />}
                  Tandai Terverifikasi
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
