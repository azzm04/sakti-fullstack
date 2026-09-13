"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, X, UploadCloud, AlertCircle, ExternalLink } from "lucide-react";

interface Pengajuan {
  id: string;
  semester: number;
  alasan: string;
  status: string;
  catatan_admin: string | null;
  created_at: string;
  diputuskan_at: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  DIPROSES:            "Sedang Diproses",
  DITERIMA:            "Diterima",
  DITOLAK:             "Ditolak",
};

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    MENUNGGU_VERIFIKASI: "bg-amber-50 text-amber-700 border-amber-200",
    DIPROSES:            "bg-blue-50 text-blue-700 border-blue-200",
    DITERIMA:            "bg-emerald-50 text-emerald-700 border-emerald-200",
    DITOLAK:             "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 font-roboto text-[11px] font-semibold rounded-[4px] border ${cls[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${["Bytes","KB","MB"][i]}`;
}

const labelCls  = "block font-roboto font-medium text-[13px] md:text-[14px] text-[#1A1A1A] mb-1.5 md:mb-2";
const inputCls  = "w-full px-4 py-[10px] bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[14px] text-[#1A1A1A] placeholder-[#6B7280] focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all";
const selectCls =
  "w-full pl-4 pr-9 py-[10px] appearance-none " +
  "bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] " +
  "bg-[length:16px_16px] bg-[position:right_12px_center] bg-no-repeat " +
  "bg-white border border-[#E0E0E0] rounded-[6px] font-roboto text-[14px] text-[#1A1A1A] " +
  "focus:ring-1 focus:ring-[#003C71] focus:border-[#003C71] outline-none transition-all cursor-pointer";

function FormPengajuan({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [file, setFile]         = useState<File | null>(null);
  const [semester, setSemester] = useState("");
  const [alasan, setAlasan]     = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5 MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError("Surat pernyataan wajib dilampirkan."); return; }
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("semester", semester);
      fd.append("alasan", alasan);
      fd.append("surat", file);
      const res = await fetch("/api/mahasiswa/pengunduran-diri", { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal mengajukan.");
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-[6px] flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <p className="font-roboto text-sm font-medium text-red-800 flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      <div>
        <label className={labelCls}>Semester Aktif Saat Ini <span className="text-red-500">*</span></label>
        <select required value={semester} onChange={(e) => setSemester(e.target.value)} className={selectCls}>
          <option value="">Pilih semester...</option>
          {Array.from({ length: 14 }, (_, i) => i + 1).map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Alasan Pengunduran Diri <span className="text-red-500">*</span></label>
        <textarea
          required
          rows={4}
          placeholder="Jelaskan alasan Anda mengundurkan diri dari program KIP-Kuliah..."
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <label className={labelCls}>Surat Pernyataan Undur Diri <span className="text-red-500">*</span></label>
        <p className="font-roboto text-[12px] text-[#6B7280] mb-3">
          Format surat dapat mengacu pada template yang tersedia di bagian kemahasiswaan. Unggah dalam format PDF, JPG, atau PNG. Maks. 5 MB.
        </p>
        {file ? (
          <div className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[8px] hover:border-[#CBD5E1] transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="text-[#64748B] shrink-0" size={18} strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="font-roboto text-[13px] font-medium text-[#1E293B] truncate">{file.name}</p>
                <p className="font-roboto text-[11px] text-[#94A3B8]">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-red-500 hover:bg-red-50 rounded-[4px] transition-colors shrink-0 ml-2"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <label
            htmlFor="file-surat-undurdiri"
            className="flex flex-col items-center justify-center w-full py-8 px-4 bg-white border border-dashed border-[#CBD5E1] rounded-[6px] cursor-pointer hover:border-[#003C71] hover:bg-[#F8FAFC] transition-colors group"
          >
            <div className="mb-3 text-[#94A3B8] group-hover:text-[#003C71] transition-colors">
              <UploadCloud className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="mb-1 font-roboto text-[14px] font-medium text-[#1E293B]">Unggah surat pernyataan</p>
            <p className="font-roboto text-[12px] text-[#64748B]">PDF, JPG, atau PNG • Maks. 5 MB</p>
            <input id="file-surat-undurdiri" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
          </label>
        )}
      </div>

      <div className="pt-2 border-t border-[#E5EAF0] flex items-center justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-[10px] font-roboto text-[14px] font-semibold text-white bg-[#00529B] hover:bg-[#003C71] rounded-[6px] transition-all disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Kirim Pengajuan
        </button>
      </div>
    </form>
  );
}

function DetailPengajuan({ pengajuan }: { pengajuan: Pengajuan }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch("/api/mahasiswa/pengunduran-diri/surat");
      const json = await res.json();
      if (json.url) window.open(json.url, "_blank");
    } catch {
      /* silent */
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <StatusBadge status={pengajuan.status} />
        <span className="font-roboto text-[12px] text-[#94A3B8]">Diajukan {formatTgl(pengajuan.created_at)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
        <div>
          <p className="font-roboto text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Semester</p>
          <p className="font-roboto text-[14px] text-[#1A1A1A]">Semester {pengajuan.semester}</p>
        </div>

        {pengajuan.diputuskan_at && (
          <div>
            <p className="font-roboto text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Tanggal Keputusan</p>
            <p className="font-roboto text-[14px] text-[#1A1A1A]">{formatTgl(pengajuan.diputuskan_at)}</p>
          </div>
        )}

        <div className="md:col-span-2">
          <p className="font-roboto text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Alasan</p>
          <p className="font-roboto text-[14px] text-[#1A1A1A] leading-relaxed whitespace-pre-line">{pengajuan.alasan}</p>
        </div>

        {pengajuan.catatan_admin && (
          <div className="md:col-span-2">
            <p className="font-roboto text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Catatan dari Kemahasiswaan</p>
            <p className="font-roboto text-[14px] text-[#1A1A1A] leading-relaxed">{pengajuan.catatan_admin}</p>
          </div>
        )}

        <div className="md:col-span-2">
          <p className="font-roboto text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Surat yang Diunggah</p>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 font-roboto text-[13px] font-medium text-[#00529B] hover:underline underline-offset-2 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <ExternalLink size={13} strokeWidth={2} />}
            Lihat surat yang diunggah
          </button>
        </div>
      </div>

      {pengajuan.status === "DITOLAK" && (
        <div className="pt-4 border-t border-[#E5EAF0]">
          <p className="font-roboto text-[13px] text-[#6B7280]">
            Pengajuan Anda ditolak. Anda dapat mengajukan kembali di bawah ini, atau menghubungi Ibu Sudarni di bagian kemahasiswaan untuk informasi lebih lanjut.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PengunduranDiriClient() {
  const [pengajuan, setPengajuan] = useState<Pengajuan | null>(null);
  const [loading, setLoading]     = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const fetchPengajuan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mahasiswa/pengunduran-diri");
      if (res.ok) {
        const json = await res.json();
        setPengajuan(json.data ?? null);
      }
    } catch (err) {
      console.error("Gagal mengambil data pengajuan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPengajuan(); }, []);

  const handleSuccess = () => {
    setSubmitted(true);
    fetchPengajuan();
  };

  const isActive   = pengajuan && pengajuan.status !== "DITOLAK";
  const isRejected = pengajuan?.status === "DITOLAK";

  return (
    <div className="min-h-screen bg-[#F7F9FC]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="max-w-3xl mx-auto pt-10 md:pt-12 pb-16 px-4 sm:px-6 space-y-6">

        <div className="pb-6 border-b border-[#E5EAF0]">
          <h1 className="font-roboto font-bold text-[28px] md:text-[30px] text-[#0F172A] leading-tight tracking-tight">
            Pengunduran Diri KIP-K
          </h1>
          <p className="font-roboto text-[14px] md:text-[15px] text-[#64748B] mt-2 leading-relaxed">
            Formulir pengunduran diri dari program Beasiswa KIP-Kuliah Universitas Diponegoro.
          </p>
        </div>

        <div className="bg-white rounded-[8px] shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-[#E5EAF0] overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E5EAF0] bg-[#FAFBFD]">
            <p className="font-roboto text-[13px] text-[#4A5768] leading-relaxed">
              Formulir ini diperuntukkan bagi mahasiswa penerima KIP-K yang berniat mengundurkan diri dari program beasiswa.
              Pastikan semua informasi akurat untuk mempercepat proses administrasi.
            </p>
            <div className="mt-3 pt-3 border-t border-[#E5EAF0] grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] text-[#6B7280] font-roboto">
              <p>Hardcopy diantarkan ke Bagian Kemahasiswaan — Gedung SA MWA Kampus UNDIP Tembalang, Senin–Jumat pukul 07.30–16.00 WIB.</p>
              <p>Pertanyaan: <span className="font-medium text-[#1A1A1A]">Ibu Sudarni</span> — +62 852-9004-7519</p>
            </div>
          </div>

          <div className="px-8 py-8">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12">
                <Loader2 size={18} className="animate-spin text-[#00529B]" />
                <span className="font-roboto text-[14px] text-[#6B7280]">Memuat data…</span>
              </div>
            ) : (
              <>
                {submitted && (
                  <div className="mb-6 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-[6px]">
                    <p className="font-roboto text-[13px] font-semibold text-emerald-800">
                      Pengajuan berhasil dikirim. Kami akan memproses permohonan Anda.
                    </p>
                  </div>
                )}

                {isActive && pengajuan && (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="font-roboto font-semibold text-[15px] md:text-[16px] text-[#1A1A1A]">Status Pengajuan</h2>
                    </div>
                    <DetailPengajuan pengajuan={pengajuan} />
                  </>
                )}

                {isRejected && pengajuan && (
                  <>
                    <div className="mb-7">
                      <h2 className="font-roboto font-semibold text-[15px] text-[#1A1A1A] mb-4">Pengajuan Sebelumnya</h2>
                      <DetailPengajuan pengajuan={pengajuan} />
                    </div>
                    <div className="border-t border-[#E5EAF0] pt-7">
                      <h2 className="font-roboto font-semibold text-[15px] text-[#1A1A1A] mb-5">Ajukan Kembali</h2>
                      <FormPengajuan onSuccess={handleSuccess} />
                    </div>
                  </>
                )}

                {!pengajuan && <FormPengajuan onSuccess={handleSuccess} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
