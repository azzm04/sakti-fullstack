"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, CheckCircle2, AlertCircle, UploadCloud, X, Download, FileText, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const PEKERJAAN_OPTIONS = [
  "Tidak Bekerja",
  "Ibu Rumah Tangga",
  "Petani",
  "Nelayan",
  "Buruh",
  "PNS / TNI / Polri",
  "Karyawan Swasta",
  "Wiraswasta",
  "Pensiunan",
  "Lainnya",
];

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);


// Shared form controls.
const AnimatedExpand = ({ show, children }: { show: boolean, children: React.ReactNode }) => (
  <AnimatePresence initial={false}>
    {show && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div className="pt-6">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
);

const RupiahInput = ({ value, onChange, placeholder = "0", id, required = false }: any) => {
  const [displayValue, setDisplayValue] = useState(() => {
    return value ? new Intl.NumberFormat("id-ID").format(value) : "";
  });

  useEffect(() => {
    if (value === 0 && displayValue !== "") {
      setDisplayValue("");
    }
  }, [value, displayValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, "");
    if (!rawValue) {
      setDisplayValue("");
      onChange(0);
      return;
    }
    const numberValue = parseInt(rawValue, 10);
    const formatted = new Intl.NumberFormat("id-ID").format(numberValue);
    setDisplayValue(formatted);
    onChange(numberValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-[20px] top-[14px] text-[#64748B] font-medium font-roboto text-[14px]">Rp</span>
      <input
        id={id}
        type="text"
        required={required}
        className="w-full pl-[50px] pr-4 py-[14px] bg-white border border-[#E2E8F0] rounded-lg font-roboto text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:ring-2 focus:ring-[#000352] focus:border-[#000352] outline-none transition-colors"
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
      />
    </div>
  );
};

const FileUploadBox = ({ title, subTitle, buttonText = "Unggah bukti pendapatan lain", file, onFileChange, onRemove, id, required = false, inputRef, accept = ".pdf, image/*" }: any) => {
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <div>
      <label className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
        {title} {required && <span className="text-red-500">*</span>}
      </label>
      {subTitle && <div className="font-roboto text-[11px] md:text-[12px] text-[#64748B] mb-3 md:mb-4 leading-relaxed">{subTitle}</div>}

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, y: 4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between p-3 bg-white border border-[#E2E8F0] rounded-[8px] hover:border-[#CBD5E1] transition-colors"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText className="text-[#64748B] shrink-0" size={18} strokeWidth={1.5} />
              <div className="min-w-0 flex flex-col gap-0.5">
                <p className="font-roboto text-[13px] font-medium text-[#1E293B] truncate">{file.name}</p>
                <p className="font-roboto text-[11px] text-[#94A3B8]">{formatBytes(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center justify-center w-7 h-7 text-[#94A3B8] hover:text-[#EF4444] hover:bg-red-50 rounded-md transition-colors shrink-0 ml-2"
              title="Hapus File" aria-label={`Hapus ${file.name}`}
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </motion.div>
        ) : (
          <motion.label
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            htmlFor={id}
            className="flex flex-col items-center justify-center w-full py-8 px-4 bg-white border border-dashed border-[#CBD5E1] rounded-lg cursor-pointer hover:border-[#000352] hover:bg-[#F8FAFC] focus-within:ring-2 focus-within:ring-[#000352] focus-within:ring-offset-2 transition-colors group"
          >
            <div className="mb-3 text-[#94A3B8] group-hover:text-[#000352] transition-colors">
              <UploadCloud className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <p className="mb-1 font-roboto text-[14px] font-medium text-[#1E293B]">
              {buttonText}
            </p>
            <p className="font-roboto text-[12px] text-[#64748B]">JPG, PNG atau PDF • Maks. 1 MB</p>
            <input ref={inputRef} id={id} type="file" className="sr-only" aria-label={typeof title === "string" ? title : "Unggah dokumen"} accept={accept} onChange={onFileChange} />
          </motion.label>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FormEvaluasiMonev() {
  const params = useParams();
  const router = useRouter();
  const periodeId = params.id as string;

  const [pekerjaanAyah, setPekerjaanAyah] = useState("");
  const [pendapatanAyah, setPendapatanAyah] = useState(0);
  const [pekerjaanIbu, setPekerjaanIbu] = useState("");
  const [pendapatanIbu, setPendapatanIbu] = useState(0);
  const [pendapatanLain, setPendapatanLain] = useState(0);
  const [tanggungan, setTanggungan] = useState(1);

  const [filePekerjaanAyah, setFilePekerjaanAyah] = useState<File | null>(null);
  const [filePenghasilanAyah, setFilePenghasilanAyah] = useState<File | null>(null);
  const [filePekerjaanIbu, setFilePekerjaanIbu] = useState<File | null>(null);
  const [filePenghasilanIbu, setFilePenghasilanIbu] = useState<File | null>(null);
  const [filePenghasilanLain, setFilePenghasilanLain] = useState<File | null>(null);
  const [fileScanKk, setFileScanKk] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPernyataanChecked, setIsPernyataanChecked] = useState(false);

  // Refs for file inputs (untuk reset)
  const fileRefs = {
    pekerjaanAyah: useRef<HTMLInputElement>(null),
    penghasilanAyah: useRef<HTMLInputElement>(null),
    pekerjaanIbu: useRef<HTMLInputElement>(null),
    penghasilanIbu: useRef<HTMLInputElement>(null),
    penghasilanLain: useRef<HTMLInputElement>(null),
    scanKk: useRef<HTMLInputElement>(null),
  };

  const totalPendapatan = pendapatanAyah + pendapatanIbu + pendapatanLain;
  const rupiahPerTanggungan = tanggungan > 0 ? totalPendapatan / tanggungan : 0;

  // ═══════════════════════════════════════════════════
  // CEK APAKAH SUDAH PERNAH SUBMIT
  // ═══════════════════════════════════════════════════
  useEffect(() => {
    async function checkSubmission() {
      try {
        const res = await fetch(`/api/monev/check-submission?periode_id=${periodeId}`);
        const json = await res.json();
        if (json.submitted) {
          setAlreadySubmitted(true);
          setSubmittedData(json.data);
        }
      } catch {
        // Gagal cek — tampilkan form saja
      } finally {
        setIsCheckingSubmission(false);
      }
    }
    checkSubmission();
  }, [periodeId]);

  // ═══════════════════════════════════════════════════
  // HANDLER: Validasi file saat dipilih
  // ═══════════════════════════════════════════════════
  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File | null) => void
  ) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE) {
      setError(`File "${file.name}" terlalu besar. Maksimal 1 MB.`);
      e.target.value = "";
      setter(null);
      return;
    }
    setError(null);
    setter(file);
  }

  // ═══════════════════════════════════════════════════
  // HANDLER: Submit form
  // ═══════════════════════════════════════════════════
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // ── Validasi client-side ──
    if (!pekerjaanAyah) {
      setError("Pilih pekerjaan ayah terlebih dahulu.");
      return;
    }
    if (!pekerjaanIbu) {
      setError("Pilih pekerjaan ibu terlebih dahulu.");
      return;
    }
    if (!fileScanKk) {
      setError("Scan Kartu Keluarga (KK) wajib diupload.");
      return;
    }
    if (!isPernyataanChecked) {
      setError("Anda harus mencentang pernyataan kebenaran data.");
      return;
    }
    // File bukti pekerjaan wajib jika bukan "Tidak Bekerja" / "Ibu Rumah Tangga"
    const ayahBekerjaTanpaBukti =
      pekerjaanAyah !== "Tidak Bekerja" && !filePekerjaanAyah;
    const ibuBekerjaTanpaBukti =
      pekerjaanIbu !== "Tidak Bekerja" &&
      pekerjaanIbu !== "Ibu Rumah Tangga" &&
      !filePekerjaanIbu;

    if (ayahBekerjaTanpaBukti) {
      setError("Upload bukti pekerjaan ayah karena pekerjaan bukan 'Tidak Bekerja'.");
      return;
    }
    if (ibuBekerjaTanpaBukti) {
      setError("Upload bukti pekerjaan ibu karena pekerjaan bukan 'Tidak Bekerja' / 'Ibu Rumah Tangga'.");
      return;
    }
    // Slip gaji wajib jika penghasilan > 0
    if (pendapatanAyah > 0 && !filePenghasilanAyah) {
      setError("Upload slip gaji ayah karena penghasilan ayah > 0.");
      return;
    }
    if (pendapatanIbu > 0 && !filePenghasilanIbu) {
      setError("Upload slip gaji ibu karena penghasilan ibu > 0.");
      return;
    }
    if (pendapatanLain > 0 && !filePenghasilanLain) {
      setError("Upload bukti penghasilan lain karena nilai > 0.");
      return;
    }

    // ── Kirim ke API ──
    setIsSubmitting(true);

    try {
      const fd = new FormData();
      fd.append("periode_id", periodeId);
      fd.append("pekerjaan_ayah", pekerjaanAyah);
      fd.append("penghasilan_ayah", String(pendapatanAyah));
      fd.append("pekerjaan_ibu", pekerjaanIbu);
      fd.append("penghasilan_ibu", String(pendapatanIbu));
      fd.append("penghasilan_lain", String(pendapatanLain));
      fd.append("jumlah_tanggungan", String(tanggungan));

      // Append file hanya jika ada
      if (filePekerjaanAyah) fd.append("file_pekerjaan_ayah", filePekerjaanAyah);
      if (filePenghasilanAyah) fd.append("file_penghasilan_ayah", filePenghasilanAyah);
      if (filePekerjaanIbu) fd.append("file_pekerjaan_ibu", filePekerjaanIbu);
      if (filePenghasilanIbu) fd.append("file_penghasilan_ibu", filePenghasilanIbu);
      if (filePenghasilanLain) fd.append("file_penghasilan_lain", filePenghasilanLain);
      if (fileScanKk) fd.append("file_scan_kk", fileScanKk);

      const res = await fetch("/api/monev/submit", {
        method: "POST",
        body: fd, // FormData, bukan JSON!
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Gagal mengirim evaluasi");
        return;
      }

      setSuccess(true);
      // Redirect ke daftar evaluasi setelah 2 detik
      setTimeout(() => router.push("/mahasiswa/monev"), 2000);
    } catch {
      setError("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Loading state
  // ═══════════════════════════════════════════════════
  if (isCheckingSubmission) {
    return (
      <div className={`min-h-screen bg-[#F7F9FC] py-12 px-4 flex items-center justify-center`} style={{ fontFamily: "Roboto, sans-serif" }}>
        <div className="flex items-center gap-3 text-slate-500 bg-white px-6 py-4 rounded-xl shadow-sm border border-slate-200">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm font-medium">Memuat data evaluasi...</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Sudah pernah submit → tampilkan ringkasan
  // ═══════════════════════════════════════════════════
  if (alreadySubmitted && submittedData) {
    const readAmount = (value: unknown): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const amount = Number(value);
      return Number.isFinite(amount) ? amount : null;
    };
    const fatherIncome = readAmount(submittedData.penghasilan_ayah);
    const motherIncome = readAmount(submittedData.penghasilan_ibu);
    const otherIncome = readAmount(submittedData.penghasilan_lain);
    const reportedTotal = fatherIncome !== null && motherIncome !== null && otherIncome !== null
      ? fatherIncome + motherIncome + otherIncome
      : null;
    const dependents = readAmount(submittedData.jumlah_tanggungan);
    const reportDate = typeof submittedData.waktu_lapor === "string"
      ? new Date(submittedData.waktu_lapor)
      : null;
    const validReportDate = reportDate && !Number.isNaN(reportDate.getTime()) ? reportDate : null;
    const formattedReportDate = validReportDate
      ? new Intl.DateTimeFormat("id-ID", {
          day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
        }).format(validReportDate)
      : null;
    const formattedReportTime = validReportDate
      ? new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta",
        }).format(validReportDate).replace(":", ".")
      : null;

    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8" style={{ fontFamily: "Roboto, sans-serif" }}>
        <Link
          href="/mahasiswa/monev"
          className="inline-flex min-h-11 items-center gap-2 rounded text-[13px] font-medium text-[#475569] transition-colors hover:text-[#000352] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Monev
        </Link>

        <header>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0B1536] sm:text-4xl">Laporan Monev</h1>
          <p className="mt-3 text-[14px] leading-6 text-[#64748B] sm:text-base">
            Ringkasan data ekonomi yang Anda kirim untuk evaluasi KIP Kuliah.
          </p>
        </header>

        <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
          <section aria-label="Status pengiriman laporan" className="flex flex-col gap-5 px-5 py-6 md:flex-row md:items-center md:justify-between md:px-9">
            <div>
              <p className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
                <CheckCircle2 size={18} className="shrink-0 text-[#15803D]" aria-hidden="true" />
                Laporan terkirim
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-[#64748B]">Anda tidak perlu mengisi ulang periode ini.</p>
            </div>
            <div className="md:text-right">
              <p className="text-[12px] leading-5 text-[#64748B]">Waktu pengiriman</p>
              {validReportDate ? (
                <time dateTime={validReportDate.toISOString()} className="mt-1 block text-[13px] leading-5 text-[#334155]">
                  {formattedReportDate}, {formattedReportTime} WIB
                </time>
              ) : (
                <p className="mt-1 text-[13px] text-[#64748B]">Tidak tersedia</p>
              )}
            </div>
          </section>

          <section aria-labelledby="income-summary-heading" className="border-t border-[#E2E8F0] px-5 py-6 md:px-9 md:py-8">
            <h2 id="income-summary-heading" className="text-[18px] font-semibold leading-7 text-[#000352]">Data penghasilan</h2>
            <p className="mt-1 text-[13px] leading-5 text-[#64748B]">Seluruh penghasilan di bawah adalah per bulan.</p>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 sm:gap-8">
              {[
                { label: "Ayah", job: submittedData.pekerjaan_ayah, income: fatherIncome },
                { label: "Ibu", job: submittedData.pekerjaan_ibu, income: motherIncome },
              ].map(({ label, job, income }) => (
                <section key={label} aria-label={`Data ${label.toLowerCase()}`} className="min-w-0">
                  <h3 className="mb-3 text-[14px] font-semibold text-[#0F172A]">{label}</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-[12px] leading-5 text-[#64748B]">Pekerjaan</dt>
                      <dd className="mt-0.5 break-words text-[14px] leading-6 text-[#334155]">{typeof job === "string" && job.trim() ? job : "Tidak tersedia"}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] leading-5 text-[#64748B]">Penghasilan per bulan</dt>
                      <dd className="mt-0.5 break-words text-[15px] font-medium leading-6 tabular-nums text-[#0F172A]">{income === null ? "Tidak tersedia" : formatRupiah(income)}</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>

            <dl className="mt-6 border-t border-[#EEF2F6] pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <dt className="text-[13px] leading-6 text-[#475569]">Penghasilan lain per bulan</dt>
                <dd className="text-[14px] font-medium leading-6 tabular-nums text-[#0F172A]">{otherIncome === null ? "Tidak tersedia" : formatRupiah(otherIncome)}</dd>
              </div>
            </dl>
          </section>

          <dl className="grid gap-6 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-6 sm:grid-cols-2 sm:gap-8 md:px-9">
            <div className="min-w-0">
              <dt className="text-[13px] leading-5 text-[#475569]">Total penghasilan per bulan</dt>
              <dd className="mt-2 break-words text-[22px] font-semibold leading-8 tabular-nums text-[#000352]">{reportedTotal === null ? "Tidak tersedia" : formatRupiah(reportedTotal)}</dd>
              <dd className="mt-1 text-[12px] leading-5 text-[#64748B]">Penghasilan ayah, ibu, dan lainnya.</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-[13px] leading-5 text-[#475569]">Jumlah tanggungan</dt>
              <dd className="mt-2 text-[22px] font-semibold leading-8 tabular-nums text-[#000352]">
                {dependents === null ? "Tidak tersedia" : <>{dependents}<span className="ml-1.5 text-[14px] font-normal text-[#475569]">orang</span></>}
              </dd>
              <dd className="mt-1 text-[12px] leading-5 text-[#64748B]">Termasuk diri Anda.</dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }
  // RENDER: Sukses submit
  // ═══════════════════════════════════════════════════
  if (success) {
    return (
      <div className={`min-h-screen bg-[#F7F9FC] py-12 px-4 flex items-center justify-center`} style={{ fontFamily: "Roboto, sans-serif" }}>
        <div className="bg-white px-10 py-12 rounded-xl shadow-sm border border-[#E5EAF0] text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-emerald-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-emerald-800">Evaluasi Berhasil Dikirim!</h2>
          <p className="text-sm text-slate-500">Mengalihkan ke halaman riwayat...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Form isian (belum submit)
  // ═══════════════════════════════════════════════════
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="space-y-6">
        <Link
          href="/mahasiswa/monev"
          className="inline-flex min-h-11 items-center gap-2 rounded text-[13px] font-medium text-[#475569] transition-colors hover:text-[#000352] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Kembali ke Monev
        </Link>

        <header className="flex items-start justify-between gap-4 sm:gap-8">
          <div className="min-w-0 max-w-2xl">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0B1536] sm:text-4xl">
              Pengisian Monev
            </h1>
            <p className="mt-3 text-[14px] leading-6 text-[#64748B] sm:text-base">
              Lengkapi data ekonomi dan dokumen pendukung untuk evaluasi KIP Kuliah.
            </p>
          </div>
        </header>

        <div className="rounded-lg border border-[#E2E8F0] bg-white p-5 md:p-9">

          {/* Error Banner */}
          {error && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
              <button type="button" aria-label="Tutup pesan kesalahan" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                <X size={16} />
              </button>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            {/* SECTION 1: Pekerjaan dan Pendapatan Orang Tua */}
            <section className="border-b border-[#E2E8F0] pb-8">
              <div className="mb-4 md:mb-5">
                <h2 className="font-roboto font-semibold text-[18px] leading-7 text-[#000352]">Data ayah</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                {/* Kiri: Pekerjaan Ayah */}
                <div className="flex flex-col">
                  <div>
                    <label htmlFor="pekerjaan-ayah" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Pekerjaan Ayah <span className="text-red-500">*</span>
                    </label>
                    <select id="pekerjaan-ayah"
                      value={pekerjaanAyah}
                      onChange={(e) => setPekerjaanAyah(e.target.value)}
                      className="w-full pl-[20px] pr-10 py-[14px] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_20px_center] bg-no-repeat bg-white border border-[#E2E8F0] rounded-lg font-roboto text-[14px] text-[#0F172A] focus:ring-2 focus:ring-[#000352] focus:border-[#000352] outline-none transition-colors"
                      required
                    >
                      <option value="">Pilih Pekerjaan...</option>
                      {PEKERJAAN_OPTIONS.filter((p) => p !== "Ibu Rumah Tangga").map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <AnimatedExpand show={pekerjaanAyah !== "" && pekerjaanAyah !== "Tidak Bekerja"}>
                    <FileUploadBox
                      id="file-kerja-ayah"
                      title="Lampiran Pekerjaan"
                      subTitle="Unggah bukti pekerjaan ayah."
                      buttonText="Unggah bukti pekerjaan"
                      file={filePekerjaanAyah}
                      onFileChange={(e: any) => handleFileChange(e, setFilePekerjaanAyah)}
                      onRemove={() => setFilePekerjaanAyah(null)}
                      inputRef={fileRefs.pekerjaanAyah}
                      required
                    />
                  </AnimatedExpand>
                </div>

                {/* Kanan: Pendapatan Ayah */}
                <div className="flex flex-col">
                  <div>
                    <label htmlFor="pendapatan-ayah" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Pendapatan Ayah (per bulan) <span className="text-red-500">*</span>
                    </label>
                    <RupiahInput
                      value={pendapatanAyah}
                      onChange={setPendapatanAyah}
                      id="pendapatan-ayah"
                    />
                  </div>
                  <AnimatedExpand show={pendapatanAyah > 0}>
                    <FileUploadBox
                      id="file-gaji-ayah"
                      title="Bukti Pendapatan"
                      subTitle="Unggah slip gaji / surat penghasilan ayah."
                      buttonText="Unggah bukti pendapatan"
                      file={filePenghasilanAyah}
                      onFileChange={(e: any) => handleFileChange(e, setFilePenghasilanAyah)}
                      onRemove={() => setFilePenghasilanAyah(null)}
                      inputRef={fileRefs.penghasilanAyah}
                      required
                    />
                  </AnimatedExpand>
                </div>
              </div>
            </section>

            {/* SECTION 2: Pekerjaan dan Pendapatan Ibu */}
            <section className="border-b border-[#E2E8F0] pb-8">
              <div className="mb-4 md:mb-5">
                <h2 className="font-roboto font-semibold text-[18px] leading-7 text-[#000352]">Data ibu</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
                {/* Kiri: Pekerjaan Ibu */}
                <div className="flex flex-col">
                  <div>
                    <label htmlFor="pekerjaan-ibu" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Pekerjaan Ibu <span className="text-red-500">*</span>
                    </label>
                    <select id="pekerjaan-ibu"
                      value={pekerjaanIbu}
                      onChange={(e) => setPekerjaanIbu(e.target.value)}
                      className="w-full pl-[20px] pr-10 py-[14px] appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23667085%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[position:right_20px_center] bg-no-repeat bg-white border border-[#E2E8F0] rounded-lg font-roboto text-[14px] text-[#0F172A] focus:ring-2 focus:ring-[#000352] focus:border-[#000352] outline-none transition-colors"
                      required
                    >
                      <option value="">Pilih Pekerjaan...</option>
                      {PEKERJAAN_OPTIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <AnimatedExpand show={pekerjaanIbu !== "" && pekerjaanIbu !== "Tidak Bekerja" && pekerjaanIbu !== "Ibu Rumah Tangga"}>
                    <FileUploadBox
                      id="file-kerja-ibu"
                      title="Lampiran Pekerjaan"
                      subTitle="Unggah bukti pekerjaan ibu."
                      buttonText="Unggah bukti pekerjaan"
                      file={filePekerjaanIbu}
                      onFileChange={(e: any) => handleFileChange(e, setFilePekerjaanIbu)}
                      onRemove={() => setFilePekerjaanIbu(null)}
                      inputRef={fileRefs.pekerjaanIbu}
                      required
                    />
                  </AnimatedExpand>
                </div>

                {/* Kanan: Pendapatan Ibu */}
                <div className="flex flex-col">
                  <div>
                    <label htmlFor="pendapatan-ibu" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Pendapatan Ibu (per bulan) <span className="text-red-500">*</span>
                    </label>
                    <RupiahInput
                      value={pendapatanIbu}
                      onChange={setPendapatanIbu}
                      id="pendapatan-ibu"
                    />
                  </div>
                  <AnimatedExpand show={pendapatanIbu > 0}>
                    <FileUploadBox
                      id="file-gaji-ibu"
                      title="Bukti Pendapatan"
                      subTitle="Upload slip gaji / surat penghasilan ibu."
                      buttonText="Unggah bukti pendapatan"
                      file={filePenghasilanIbu}
                      onFileChange={(e: any) => handleFileChange(e, setFilePenghasilanIbu)}
                      onRemove={() => setFilePenghasilanIbu(null)}
                      inputRef={fileRefs.penghasilanIbu}
                      required
                    />
                  </AnimatedExpand>
                </div>
              </div>
            </section>

            {/* SECTION 3: Pendapatan Lain & Tanggungan */}
            <section className="border-b border-[#E2E8F0] pb-8">
              <div className="mb-4 md:mb-5">
                <h2 className="font-roboto font-semibold text-[18px] leading-7 text-[#000352]">Penghasilan lain dan tanggungan</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Kiri: Pendapatan Lain */}
                <div className="flex flex-col h-full">
                  <div>
                    <label htmlFor="pendapatan-lain" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Pendapatan Lain-lain (per bulan)
                    </label>
                    <RupiahInput
                      value={pendapatanLain}
                      onChange={setPendapatanLain}
                      id="pendapatan-lain"
                      placeholder="Opsional (0 jika tidak ada)"
                    />
                    <p className="font-roboto text-[11px] md:text-[12px] text-[#64748B] mt-1 md:mt-1.5 leading-relaxed">
                      Jika tidak ada, isi 0 dan unggah surat pernyataan.
                    </p>
                  </div>
                  <AnimatedExpand show={pendapatanLain >= 0 && pendapatanLain.toString() !== ''}>
                    <FileUploadBox
                      id="file-gaji-lain"
                      title="Bukti Pendapatan Lain"
                      subTitle={
                        <div className="min-h-[60px] md:min-h-[64px] flex flex-col justify-start">
                          <span>Unggah bukti atau surat pernyataan.</span>
                          <a href="/format-surat-pernyataan-pendapatan.docx" download className="inline-flex items-center gap-1 font-roboto text-[12px] text-[#000352] font-medium hover:underline mt-1.5 w-fit">
                            <Download size={14} />
                            Unduh format surat pernyataan
                          </a>
                        </div>
                      }
                      file={filePenghasilanLain}
                      onFileChange={(e: any) => handleFileChange(e, setFilePenghasilanLain)}
                      onRemove={() => setFilePenghasilanLain(null)}
                      inputRef={fileRefs.penghasilanLain}
                      required
                    />
                  </AnimatedExpand>
                </div>

                {/* Kanan: Tanggungan */}
                <div className="flex flex-col h-full">
                  <div>
                    <label htmlFor="jumlah-tanggungan" className="block font-roboto font-medium text-[13px] md:text-[14px] text-[#0F172A] mb-1.5 md:mb-2">
                      Jumlah Tanggungan <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="jumlah-tanggungan"
                      type="number"
                      min="1"
                      className="w-full px-[20px] py-[14px] bg-white border border-[#E2E8F0] rounded-lg font-roboto text-[14px] text-[#0F172A] focus:ring-2 focus:ring-[#000352] focus:border-[#000352] outline-none transition-colors"
                      value={tanggungan}
                      onChange={(e) => setTanggungan(Number(e.target.value) || 1)}
                      required
                    />
                    <p className="font-roboto text-[11px] md:text-[12px] text-[#64748B] mt-1 md:mt-1.5 leading-relaxed">
                      Termasuk diri sendiri.
                    </p>
                  </div>
                  <div className="pt-6">
                    <FileUploadBox
                      id="file-kk"
                      title="Kartu Keluarga (KK)"
                      subTitle={
                        <div className="min-h-[60px] md:min-h-[64px] flex flex-col justify-start">
                          <span>Unggah scan Kartu Keluarga sebagai bukti data keluarga.</span>
                        </div>
                      }
                      buttonText="Unggah Kartu Keluarga"
                      file={fileScanKk}
                      onFileChange={(e: any) => handleFileChange(e, setFileScanKk)}
                      onRemove={() => setFileScanKk(null)}
                      inputRef={fileRefs.scanKk}
                      accept="image/png, image/jpeg, image/jpg"
                      required
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Ringkasan Ekonomi */}
            <section aria-labelledby="form-summary-heading" className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-5 sm:p-6">
              <h2 id="form-summary-heading" className="mb-5 text-[16px] font-semibold text-[#000352]">Ringkasan penghasilan</h2>
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <p className="font-roboto text-[13px] font-medium text-[#475569] mb-2">Total penghasilan</p>
                  <div className="flex flex-wrap items-baseline gap-x-1.5 mb-1.5">
                    <p className="font-roboto text-[22px] font-semibold text-[#000352] leading-8 break-words tabular-nums" title={totalPendapatan > 0 ? formatRupiah(totalPendapatan) : "Belum Dihitung"}>
                      {totalPendapatan > 0 ? formatRupiah(totalPendapatan) : "—"}
                    </p>
                    {totalPendapatan > 0 && <span className="font-roboto text-[14px] font-medium text-[#64748B]">/ bulan</span>}
                  </div>
                  <p className="font-roboto text-[12px] text-[#64748B]">
                    Pendapatan Ayah + Ibu + Pendapatan Lainnya
                  </p>
                </div>

                {/* Divider */}
                <div className="w-full h-px md:w-px md:h-16 bg-[#E2E8F0] shrink-0 self-center my-2 md:my-0"></div>

                <div className="flex-1 min-w-0">
                  <p className="font-roboto text-[13px] font-medium text-[#475569] mb-2">Penghasilan per tanggungan</p>
                  <div className="flex flex-wrap items-baseline gap-x-1.5 mb-1.5">
                    <p className="font-roboto text-[22px] font-semibold text-[#000352] leading-8 break-words tabular-nums" title={rupiahPerTanggungan > 0 ? formatRupiah(rupiahPerTanggungan) : "Belum Dihitung"}>
                      {rupiahPerTanggungan > 0 ? formatRupiah(rupiahPerTanggungan) : "—"}
                    </p>
                    {rupiahPerTanggungan > 0 && <span className="font-roboto text-[14px] font-medium text-[#64748B]">/ orang / bulan</span>}
                  </div>
                  <p className="font-roboto text-[12px] text-[#64748B]">
                    Total Pendapatan &divide; Jumlah Tanggungan
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 5: Pernyataan */}
            <div className="mt-8 flex items-start gap-3">
              <input
                type="checkbox"
                id="pernyataan"
                className="mt-1 w-4 h-4 shrink-0 rounded border-[#E2E8F0] text-[#000352] focus:ring-[#000352] cursor-pointer"
                checked={isPernyataanChecked}
                onChange={(e) => setIsPernyataanChecked(e.target.checked)}
              />
              <label htmlFor="pernyataan" className="font-roboto text-[13px] md:text-[14px] text-[#4B5563] leading-relaxed cursor-pointer select-none">
                Saya menyatakan bahwa seluruh data yang saya masukkan adalah benar dan sesuai dengan kondisi sebenarnya. Saya bertanggung jawab atas kebenaran data tersebut.
              </label>
            </div>

            {/* Action Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !isPernyataanChecked}
                className="w-full md:w-auto px-[32px] py-[14px] bg-[#000352] text-white font-roboto font-medium text-[14px] rounded-lg hover:bg-[#1a1e68] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Mengirim laporan...
                  </>
                ) : (
                  <>
                    Kirim laporan Monev
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
