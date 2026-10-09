"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Loader2, FileText, X, UploadCloud, AlertCircle, ExternalLink, CheckCircle2, MapPin, Phone, Clock3, Check, RotateCw, type LucideIcon } from "lucide-react";

interface Pengajuan {
  id: string;
  semester: number;
  alasan: string;
  status: string;
  catatan_admin: string | null;
  created_at: string;
  diputuskan_at: string | null;
}

const ENDPOINT = "/api/mahasiswa/pengunduran-diri";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2";
const PRIMARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#000352] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1e68] disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
const SECONDARY = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:opacity-60 ${FOCUS}`;
const INPUT = `min-h-11 w-full min-w-0 rounded-lg border border-[#CBD5E1] bg-white px-3 py-2.5 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] ${FOCUS}`;
const LABEL = "mb-2 block text-[13px] font-medium text-[#334155]";
const STATUS: Record<string, { label: string; color: string; description: string; icon: LucideIcon }> = {
  MENUNGGU_VERIFIKASI: { label: "Menunggu verifikasi", icon: Clock3, color: "text-[#64748B]", description: "Pengajuan sudah diterima sistem dan menunggu pemeriksaan kemahasiswaan." },
  DIPROSES: { label: "Sedang diproses", icon: RotateCw, color: "text-[#1E40AF]", description: "Kemahasiswaan sedang memproses pengajuan Anda." },
  DITERIMA: { label: "Diterima", icon: Check, color: "text-[#166534]", description: "Pengajuan pengunduran diri Anda telah disetujui." },
  DITOLAK: { label: "Ditolak", icon: X, color: "text-[#B91C1C]", description: "Periksa catatan kemahasiswaan sebelum mengajukan kembali." },
};

function formatTanggal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak tersedia" : new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  }).format(date);
}
async function fetchPengajuan(url: string): Promise<Pengajuan | null> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Data pengajuan belum dapat dimuat.");
  const result = await response.json();
  return result.data ?? null;
}

function FormPengajuan({ onSuccess, ulang = false, onCancel }: { onSuccess: (data: Pengajuan) => void; ulang?: boolean; onCancel?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [semester, setSemester] = useState("");
  const [alasan, setAlasan] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!/\.(pdf|jpe?g|png)$/i.test(selected.name) || selected.size > 5 * 1024 * 1024) {
      setError("Gunakan file PDF, JPG, atau PNG dengan ukuran maksimal 5 MB.");
      event.target.value = "";
      return;
    }
    setFile(selected);
    setError(null);
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!alasan.trim()) { setError("Tuliskan alasan pengunduran diri Anda."); return; }
    if (!file) { setError("Lampirkan surat pernyataan pengunduran diri terlebih dahulu."); fileRef.current?.focus(); return; }
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("semester", semester);
      body.append("alasan", alasan.trim());
      body.append("surat", file);
      const response = await fetch(ENDPOINT, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pengajuan belum berhasil dikirim. Silakan coba lagi.");
      onSuccess(result.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Pengajuan belum berhasil dikirim. Silakan coba lagi.");
    } finally { setLoading(false); }
  }

  return (
    <section id="form-pengajuan" aria-labelledby="form-pengajuan-heading" className="border-t border-[#E2E8F0]">
      <div className="px-5 pt-6 md:px-9 md:pt-8">
        <h2 id="form-pengajuan-heading" className="text-[20px] font-semibold leading-7 text-[#000352]">{ulang ? "Ajukan kembali" : "Form pengajuan"}</h2>
        <p className="mt-1 text-[13px] leading-5 text-[#64748B]">{ulang ? "Lengkapi data dan surat sesuai catatan pengajuan sebelumnya." : "Lengkapi data dan lampirkan surat pernyataan Anda."}</p>
      </div>
      <form onSubmit={handleSubmit} aria-busy={loading}>
        <fieldset disabled={loading} className="min-w-0 space-y-6 px-5 py-6 md:px-9 disabled:opacity-70">
          <legend className="sr-only">Data pengajuan pengunduran diri</legend>
          {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] leading-5 text-red-800"><AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p>}
          <p className="text-[12px] text-[#64748B]">Semua kolom wajib diisi.</p>
          <div className="sm:max-w-xs">
            <label htmlFor="undur-semester" className={LABEL}>Semester saat ini</label>
            <select id="undur-semester" autoFocus={ulang} required value={semester} onChange={(event) => setSemester(event.target.value)} className={INPUT}>
              <option value="">Pilih semester</option>
              {Array.from({ length: 14 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Semester {value}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="undur-alasan" className={LABEL}>Alasan pengunduran diri</label>
            <textarea id="undur-alasan" required rows={5} placeholder="Jelaskan alasan Anda mengundurkan diri dari program KIP Kuliah." value={alasan} onChange={(event) => setAlasan(event.target.value)} className={`${INPUT} resize-y leading-6`} />
          </div>
          <div className="border-t border-[#E2E8F0] pt-5">
            <label htmlFor="file-surat-undurdiri" className={LABEL}>Surat pernyataan pengunduran diri</label>
            <p id="undur-file-help" className="text-[12px] leading-5 text-[#64748B]">Unggah surat dalam format PDF, JPG, atau PNG. Maksimal 5 MB.</p>
            <input ref={fileRef} id="file-surat-undurdiri" type="file" accept=".pdf,.jpg,.jpeg,.png" aria-describedby="undur-file-help" className="peer sr-only" onChange={handleFileChange} />
            {file ? (
              <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 peer-focus-visible:ring-2 peer-focus-visible:ring-[#000352] peer-focus-visible:ring-offset-2">
                <FileText size={20} className="shrink-0 text-[#475569]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13px] font-medium text-[#334155]">{file.name}</p>
                  <p className="mt-0.5 text-[12px] text-[#64748B]">{file.size < 1024 * 1024 ? `${Math.ceil(file.size / 1024)} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</p>
                </div>
                <button type="button" aria-label="Hapus surat yang dipilih" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; fileRef.current?.focus(); }} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:bg-white hover:text-red-700 ${FOCUS}`}><X size={17} /></button>
              </div>
            ) : (
              <label htmlFor="file-surat-undurdiri" className="mt-3 flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-6 text-[13px] font-medium text-[#000352] transition-colors hover:border-[#000352] hover:bg-[#EEF2FF] peer-focus-visible:ring-2 peer-focus-visible:ring-[#000352] peer-focus-visible:ring-offset-2">
                <UploadCloud size={22} strokeWidth={1.7} aria-hidden="true" />Pilih surat pernyataan
              </label>
            )}
          </div>
        </fieldset>
        <div className="flex flex-col-reverse justify-end gap-3 px-5 pb-6 sm:flex-row md:px-9 md:pb-8">
          {onCancel && <button type="button" onClick={onCancel} disabled={loading} className={SECONDARY}>Batal</button>}
          <button type="submit" disabled={loading} className={`${PRIMARY} w-full sm:w-auto`}>{loading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Mengirim pengajuan...</> : "Kirim pengajuan"}</button>
        </div>
      </form>
    </section>
  );
}

function DetailPengajuan({ pengajuan }: { pengajuan: Pengajuan }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const status = STATUS[pengajuan.status];
  const StatusIcon = status?.icon ?? FileText;

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    setDownloadError(null);
    // Open during the click event so asynchronous signed-URL fetching is not blocked.
    const preview = window.open("about:blank", "_blank");
    if (preview) preview.opener = null;
    try {
      const response = await fetch(`${ENDPOINT}/surat`);
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error("Surat belum dapat dibuka. Silakan coba lagi.");
      if (!preview) throw new Error("Izinkan tab baru di browser untuk membuka surat, lalu coba lagi.");
      const url = new URL(result.url);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Tautan surat tidak valid.");
      preview.location.replace(url.href);
    } catch (cause) {
      preview?.close();
      setDownloadError(cause instanceof Error ? cause.message : "Surat belum dapat dibuka. Silakan coba lagi.");
    } finally { setDownloading(false); }
  }

  return (
    <section aria-labelledby="status-pengajuan-heading">
      <div className="px-5 pt-6 md:px-9 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="status-pengajuan-heading" className="text-[20px] font-semibold leading-7 text-[#000352]">{pengajuan.status === "DITOLAK" ? "Pengajuan sebelumnya" : "Status pengajuan"}</h2>
          <span className={`inline-flex items-center gap-2 text-[12px] font-medium leading-5 ${status?.color ?? "text-slate-600"}`}><StatusIcon size={14} aria-hidden="true" />{status?.label ?? pengajuan.status}</span>
        </div>
        {status && <p className="mt-2 text-[13px] leading-6 text-[#64748B]">{status.description}</p>}
      </div>
      <div className="space-y-6 px-5 py-6 md:px-9 md:pb-8">
        <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <div><dt className="text-[12px] leading-5 text-[#64748B]">Tanggal pengajuan</dt><dd className="mt-1 text-[14px] leading-6 text-[#334155]">{formatTanggal(pengajuan.created_at)}</dd></div>
          <div><dt className="text-[12px] leading-5 text-[#64748B]">Semester saat mengajukan</dt><dd className="mt-1 text-[14px] leading-6 text-[#334155]">Semester {pengajuan.semester}</dd></div>
          {pengajuan.diputuskan_at && <div className="sm:col-span-2"><dt className="text-[12px] leading-5 text-[#64748B]">Tanggal keputusan</dt><dd className="mt-1 text-[14px] leading-6 text-[#334155]">{formatTanggal(pengajuan.diputuskan_at)}</dd></div>}
          <div className="border-t border-[#EEF2F6] pt-5 sm:col-span-2"><dt className="text-[12px] leading-5 text-[#64748B]">Alasan pengunduran diri</dt><dd className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-6 text-[#334155]">{pengajuan.alasan}</dd></div>
        </dl>
        {pengajuan.catatan_admin && <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4"><h3 className="text-[13px] font-semibold text-[#000352]">Catatan kemahasiswaan</h3><p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-6 text-[#475569]">{pengajuan.catatan_admin}</p></div>}
        <div className="border-t border-[#E2E8F0] pt-4">
          <button type="button" onClick={handleDownload} disabled={downloading} className={SECONDARY}>
            {downloading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />}
            {downloading ? "Membuka surat..." : "Lihat surat yang diunggah"}<ExternalLink size={13} aria-hidden="true" />
          </button>
          {downloadError && <p role="alert" className="mt-2 text-[12px] leading-5 text-red-700">{downloadError}</p>}
        </div>
      </div>
    </section>
  );
}

function InformasiPenyerahan() {
  return (
    <section aria-labelledby="penyerahan-heading" className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-6 md:px-9 md:py-8">
      <h2 id="penyerahan-heading" className="text-[18px] font-semibold leading-7 text-[#000352]">Penyerahan dokumen</h2>
      <p className="mt-1 text-[13px] leading-6 text-[#64748B]">Selain mengunggah surat, serahkan dokumen cetak ke bagian kemahasiswaan.</p>
      <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-10">
        <div>
          <h3 className="flex items-center gap-2 text-[13px] font-medium text-[#334155]"><MapPin size={16} className="shrink-0 text-[#64748B]" aria-hidden="true" />Lokasi & jam layanan</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#475569]">Bagian Kemahasiswaan, Gedung SA MWA<br />Kampus UNDIP Tembalang</p>
          <p className="mt-1 text-[12px] leading-5 text-[#64748B]">Senin–Jumat, 07.30–16.00 WIB</p>
        </div>
        <div>
          <h3 className="text-[13px] font-medium text-[#334155]">Format surat & bantuan</h3>
          <p className="mt-2 text-[13px] leading-6 text-[#475569]">Hubungi bagian kemahasiswaan untuk format surat dan informasi pengajuan.</p>
          <p className="mt-2 text-[12px] text-[#64748B]">Ibu Sudarni</p>
          <a href="tel:+6285290047519" className={`inline-flex min-h-11 items-center gap-2 rounded text-[13px] font-medium text-[#000352] hover:underline ${FOCUS}`}><Phone size={14} aria-hidden="true" />+62 852-9004-7519</a>
        </div>
      </div>
    </section>
  );
}

function PetunjukPengajuan() {
  return (
    <section aria-labelledby="petunjuk-heading" className="px-5 py-6 md:px-9 md:py-8">
      <h2 id="petunjuk-heading" className="text-[20px] font-semibold leading-7 text-[#000352]">Sebelum mengajukan</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-6">
        {[
          { title: "Isi data pengajuan", description: "Pilih semester dan tuliskan alasan Anda." },
          { title: "Unggah surat", description: "Gunakan format surat dari kemahasiswaan." },
          { title: "Serahkan dokumen cetak", description: "Lokasi dan jam layanan tersedia di bawah." },
        ].map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span aria-hidden="true" className="text-[13px] leading-6 text-[#64748B]">{index + 1}.</span>
            <div><h3 className="text-[13px] font-medium leading-6 text-[#334155]">{step.title}</h3><p className="mt-1 text-[12px] leading-5 text-[#64748B]">{step.description}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function PengunduranDiriClient() {
  const { data: pengajuan, error, isLoading, mutate } = useSWR<Pengajuan | null>(ENDPOINT, fetchPengajuan);
  const [submitted, setSubmitted] = useState(false);
  const [retryId, setRetryId] = useState<string | null>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const retryOpen = pengajuan?.status === "DITOLAK" && retryId === pengajuan.id;
  function handleSuccess(data: Pengajuan) {
    setSubmitted(true);
    setRetryId(null);
    void mutate(data, { revalidate: false });
  }

  return (
    <div className="relative mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" style={{ fontFamily: "Roboto, sans-serif" }}>
      <header className="relative flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="max-w-xl md:pt-6">
          <h1 className="text-3xl font-bold leading-[1.25] tracking-tight text-[#0B1536] sm:text-4xl lg:text-[40px]">Pengunduran Diri<br />KIP Kuliah</h1>
          <p className="mt-4 text-base leading-relaxed text-[#64748B] sm:text-lg">Lengkapi pengajuan pengunduran diri dan pantau prosesnya di halaman ini.</p>
        </div>
        <div className="relative flex w-full shrink-0 items-start justify-center self-center md:-mt-8 md:w-auto md:self-auto">
          <div className="relative h-56 w-72 max-w-full sm:h-64 sm:w-80 md:h-72 md:w-96 lg:h-[300px] lg:w-[400px]">
            <Image src="/illustrations/pengunduran-diri-hero-animated.svg" alt="Ilustrasi surat pengajuan pengunduran diri" fill sizes="(min-width: 1024px) 400px, (min-width: 768px) 384px, (min-width: 640px) 320px, 288px" className="pointer-events-none select-none object-contain object-top drop-shadow-md" priority />
          </div>
        </div>
      </header>
      {submitted && <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />Pengajuan berhasil dikirim. Anda dapat memantau statusnya di halaman ini.</p>}
      <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
        {isLoading ? (
          <div role="status" className="flex min-h-64 items-center justify-center gap-3 px-5 text-[13px] text-[#64748B]"><Loader2 size={18} className="animate-spin text-[#000352]" aria-hidden="true" />Memuat pengajuan...</div>
        ) : error ? (
          <div role="alert" className="px-5 py-12 text-center">
            <AlertCircle size={24} className="mx-auto text-[#64748B]" aria-hidden="true" />
            <p className="mt-3 text-[14px] font-medium text-[#334155]">Data pengajuan belum dapat dimuat</p>
            <p className="mt-1 text-[13px] text-[#64748B]">Coba kembali untuk memeriksa status pengajuan Anda.</p>
            <button type="button" onClick={() => void mutate()} className={`${SECONDARY} mt-4`}>Coba lagi</button>
          </div>
        ) : pengajuan ? (
          <>
            <DetailPengajuan key={pengajuan.id} pengajuan={pengajuan} />
            {pengajuan.status === "DITOLAK" && (
              <>
                <div className="px-5 pb-6 md:px-9 md:pb-8">
                  <button ref={retryButtonRef} type="button" aria-expanded={retryOpen} aria-controls="form-pengajuan-ulang" disabled={retryOpen} onClick={() => { setRetryId(pengajuan.id); setSubmitted(false); }} className={PRIMARY}>Ajukan kembali</button>
                </div>
                <div id="form-pengajuan-ulang" hidden={!retryOpen}>
                  {retryOpen && <FormPengajuan key={pengajuan.id} ulang onSuccess={handleSuccess} onCancel={() => { setRetryId(null); requestAnimationFrame(() => retryButtonRef.current?.focus()); }} />}
                </div>
              </>
            )}
          </>
        ) : (
          <><PetunjukPengajuan /><FormPengajuan onSuccess={handleSuccess} /></>
        )}
        <InformasiPenyerahan />
      </div>
    </div>
  );
}