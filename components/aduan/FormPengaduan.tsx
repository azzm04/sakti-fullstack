"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Copy,
  EyeOff,
  FileImage,
  FileText,
  Lock,
  Send,
  Target,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { BUKTI_CONFIG } from "@/lib/aduan/bukti-config";

const MB = 1024 * 1024;
const formatMB = (byte: number) => (byte / MB).toFixed(2);

const LANGKAH = [
  { judul: "Pelapor", deskripsi: "Identitas & kontak" },
  { judul: "Terlapor", deskripsi: "Data mahasiswa" },
  { judul: "Laporan", deskripsi: "Kronologi & bukti" },
  { judul: "Pernyataan", deskripsi: "Tinjau & kirim" },
];
const TERAKHIR = LANGKAH.length - 1;

const KATEGORI = [
  {
    value: "KETIDAKTEPATAN",
    judul: "Ketidaktepatan Sasaran",
    deskripsi: "Penerima dinilai mampu secara ekonomi.",
    Ikon: Target,
  },
  {
    value: "PENYALAHGUNAAN",
    judul: "Penyalahgunaan Dana",
    deskripsi: "Dana tidak digunakan untuk pendidikan.",
    Ikon: Wallet,
  },
] as const;

const inputCls =
  "mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-[#001349] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#001349]/10";

function Label({
  htmlFor,
  wajib,
  children,
}: {
  htmlFor?: string;
  wajib?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">
      {children}
      {wajib && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

export default function FormPengaduan() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kodeBerhasil, setKodeBerhasil] = useState("");
  const [tersalin, setTersalin] = useState(false);
  const [pesanError, setPesanError] = useState("");
  const [isAnonim, setIsAnonim] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [errorFile, setErrorFile] = useState("");
  const [dragging, setDragging] = useState(false);
  const [setuju, setSetuju] = useState(false);

  const inputFileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    jenis_aduan: "",
    nama_pelapor: "",
    whatsapp_pelapor: "",
    email_pelapor: "",
    nama_terlapor: "",
    nim_terlapor: "",
    fakultas_prodi: "",
    angkatan: "",
    uraian_kronologi: "",
  });

  const totalBytes = files.reduce((n, f) => n + f.size, 0);
  const persenKuota = Math.min(100, (totalBytes / BUKTI_CONFIG.MAX_TOTAL_BYTES) * 100);

  // VALIDASI REAL-TIME
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;

    // Blokir angka dan simbol untuk NAMA
    if (name === "nama_pelapor" || name === "nama_terlapor" || name === "fakultas_prodi") {
      newValue = newValue.replace(/[^a-zA-Z\s\-]/g, "");
    }
    // Blokir huruf dan simbol untuk WA dan NIM
    else if (name === "whatsapp_pelapor" || name === "nim_terlapor") {
      newValue = newValue.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const tambahFile = (dipilih: File[]) => {
    if (dipilih.length === 0) return;

    const { MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, TIPE_DIIZINKAN } = BUKTI_CONFIG;
    const gabungan = [...files, ...dipilih];

    if (dipilih.some((f) => !(TIPE_DIIZINKAN as readonly string[]).includes(f.type))) {
      return setErrorFile("Format file harus JPG, PNG, WebP, atau PDF.");
    }
    if (gabungan.length > MAX_FILES) {
      return setErrorFile(`Maksimal ${MAX_FILES} file.`);
    }
    if (dipilih.some((f) => f.size > MAX_FILE_BYTES)) {
      return setErrorFile(`Ukuran tiap file maksimal ${MAX_FILE_BYTES / MB} MB.`);
    }
    if (gabungan.reduce((n, f) => n + f.size, 0) > MAX_TOTAL_BYTES) {
      return setErrorFile(`Total ukuran file maksimal ${MAX_TOTAL_BYTES / MB} MB.`);
    }

    setErrorFile("");
    setFiles(gabungan);
  };

  const handlePilihFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dipilih = Array.from(e.target.files ?? []);
    e.target.value = ""; // agar file yang sama bisa dipilih lagi
    tambahFile(dipilih);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    tambahFile(Array.from(e.dataTransfer.files));
  };

  const handleHapusFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setErrorFile("");
  };

  const kembali = () => {
    setPesanError("");
    setStep((s) => Math.max(0, s - 1));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetSemua = () => {
    setFormData({
      jenis_aduan: "", nama_pelapor: "", whatsapp_pelapor: "", email_pelapor: "", nama_terlapor: "",
      nim_terlapor: "", fakultas_prodi: "", angkatan: "", uraian_kronologi: "",
    });
    setFiles([]);
    setSetuju(false);
    setIsAnonim(true);
    setStep(0);
    setKodeBerhasil("");
    setPesanError("");
    setErrorFile("");
  };

  const salinKode = async () => {
    try {
      await navigator.clipboard.writeText(kodeBerhasil);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      /* abaikan jika peramban menolak akses clipboard */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // validasi bawaan peramban (required, minLength) sudah berjalan sebelum ini
    setPesanError("");

    // Langkah 1-3: validasi tambahan lalu maju ke langkah berikutnya
    if (step < TERAKHIR) {
      if (step === 2 && files.length === 0) {
        setErrorFile("Unggah minimal 1 file bukti.");
        return;
      }
      setStep(step + 1);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Langkah terakhir: kirim
    if (files.length === 0) {
      setStep(2);
      setErrorFile("Unggah minimal 1 file bukti.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(formData).forEach(([k, v]) => body.append(k, v));
      body.append("is_anonim", String(isAnonim));
      body.append("pernyataan_setuju", String(setuju));
      files.forEach((f) => body.append("bukti", f));

      // Jangan set Content-Type manual, peramban mengisinya beserta boundary
      const response = await fetch("/api/aduan", { method: "POST", body });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof result.error === "string" ? result.error : "Gagal mengirim laporan."
        );
      }

      const kode = result.data.kode_laporan as string;
      resetSemua();
      setKodeBerhasil(kode);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error: any) {
      setPesanError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------- Tampilan sukses ---------- */
  if (kodeBerhasil) {
    return (
      <div ref={topRef} className="-mt-20 relative z-20 mx-auto max-w-2xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl ring-1 ring-slate-100 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
            Laporan Berhasil Dikirim
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            Simpan kode resi di bawah ini. Anda memerlukannya untuk melacak perkembangan laporan.
          </p>

          <div className="mt-8 rounded-2xl border border-dashed border-[#001349]/30 bg-[#001349]/[0.03] px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Kode Resi</p>
            <p className="mt-1 text-2xl font-black tracking-wider text-[#001349] sm:text-3xl">
              {kodeBerhasil}
            </p>
            <button
              type="button"
              onClick={salinKode}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              {tersalin ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" /> Salin kode
                </>
              )}
            </button>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/cek-aduan"
              className="inline-flex items-center justify-center rounded-full bg-[#001349] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#001f70]"
            >
              Lacak Status Laporan
            </Link>
            <button
              type="button"
              onClick={resetSemua}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
            >
              Buat Laporan Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Tampilan form ---------- */
  return (
    <div ref={topRef} className="-mt-20 relative z-20 mx-auto max-w-4xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-100">
        {/* Penanda langkah */}
        <div className="border-b border-slate-100 px-6 py-5 sm:px-10">
          <ol className="flex items-center">
            {LANGKAH.map((l, i) => {
              const selesai = i < step;
              const aktif = i === step;
              return (
                <li key={l.judul} className="flex flex-1 items-center last:flex-none">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${selesai
                        ? "bg-emerald-500 text-white"
                        : aktif
                          ? "bg-[#001349] text-white ring-4 ring-[#001349]/15"
                          : "bg-slate-100 text-slate-400"
                        }`}
                    >
                      {selesai ? <CheckCircle className="h-5 w-5" /> : i + 1}
                    </span>
                    <div className="hidden sm:block">
                      <p className={`text-sm font-bold ${aktif ? "text-slate-900" : "text-slate-500"}`}>
                        {l.judul}
                      </p>
                      <p className="text-xs text-slate-400">{l.deskripsi}</p>
                    </div>
                  </div>
                  {i < TERAKHIR && (
                    <div
                      className={`mx-3 h-0.5 flex-1 rounded transition-colors ${i < step ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-4 text-xs font-semibold text-slate-500 sm:hidden">
            Langkah {step + 1} dari {LANGKAH.length} &middot; {LANGKAH[step].judul}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            key={step}
            className="animate-in fade-in slide-in-from-right-4 space-y-6 p-6 duration-300 sm:p-10"
          >
            {/* ===== Langkah 1: Pelapor ===== */}
            {step === 0 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Identitas Pelapor</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Siapa yang melaporkan dan bagaimana kami menghubungi Anda.
                  </p>
                </div>

                <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#001349]/10 text-[#001349]">
                    <EyeOff className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">Kirim sebagai rahasia</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      Nama Anda disembunyikan dari terlapor.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isAnonim}
                    aria-label="Kirim sebagai rahasia"
                    onClick={() => {
                      const baru = !isAnonim;
                      setIsAnonim(baru);
                      if (baru) setFormData((p) => ({ ...p, nama_pelapor: "" }));
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${isAnonim ? "bg-[#001349]" : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${isAnonim ? "translate-x-6" : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {!isAnonim && (
                    <div>
                      <Label htmlFor="nama_pelapor" wajib>Nama Lengkap</Label>
                      <input
                        id="nama_pelapor" type="text" name="nama_pelapor"
                        value={formData.nama_pelapor} onChange={handleChange}
                        required placeholder="Nama lengkap Anda" className={inputCls}
                      />
                    </div>
                  )}
                  <div className={isAnonim ? "sm:col-span-2" : ""}>
                    <Label htmlFor="whatsapp_pelapor" wajib>Nomor WhatsApp</Label>
                    <input
                      id="whatsapp_pelapor" type="text" inputMode="numeric" name="whatsapp_pelapor"
                      value={formData.whatsapp_pelapor} onChange={handleChange}
                      required minLength={10} placeholder="Contoh: 08123456789" className={inputCls}
                    />
                    <p className="mt-2 flex items-start gap-1.5 text-xs font-medium text-slate-500">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>
                        Wajib diisi untuk validasi oleh Dirmawa dan <b>dijamin kerahasiaannya</b>.
                      </span>
                    </p>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email_pelapor" wajib>Email Aktif</Label>
                  <input
                    id="email_pelapor" type="email" name="email_pelapor"
                    value={formData.email_pelapor} onChange={handleChange}
                    required placeholder="contoh@email.com" className={inputCls}
                  />
                </div>
              </>
            )}

            {/* ===== Langkah 2: Terlapor ===== */}
            {step === 1 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Informasi Terlapor</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Data mahasiswa yang diduga melakukan pelanggaran.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="nama_terlapor" wajib>Nama Mahasiswa Terlapor</Label>
                    <input
                      id="nama_terlapor" type="text" name="nama_terlapor"
                      value={formData.nama_terlapor} onChange={handleChange}
                      required placeholder="Contoh: Budi Santoso" className={inputCls}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nim_terlapor">NIM Terlapor <span className="font-normal text-slate-400">(jika diketahui)</span></Label>
                    <input
                      id="nim_terlapor" type="text" inputMode="numeric" name="nim_terlapor"
                      value={formData.nim_terlapor} onChange={handleChange}
                      placeholder="Contoh: 21120120140xxx" className={inputCls}
                    />
                  </div>
                  <div>
                    <Label htmlFor="angkatan" wajib>Tahun Angkatan</Label>
                    <select
                      id="angkatan" name="angkatan" value={formData.angkatan}
                      onChange={handleChange} required className={inputCls}
                    >
                      <option value="" disabled>Pilih angkatan...</option>
                      {["2022", "2023", "2024", "2025", "2026"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="fakultas_prodi" wajib>Fakultas / Program Studi</Label>
                    <input
                      id="fakultas_prodi" type="text" name="fakultas_prodi"
                      value={formData.fakultas_prodi} onChange={handleChange}
                      required placeholder="Contoh: Teknik Komputer - Fakultas Teknik" className={inputCls}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ===== Langkah 3: Laporan ===== */}
            {step === 2 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Detail Laporan</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Jelaskan pelanggaran dan lampirkan bukti pendukung.
                  </p>
                </div>

                <div>
                  <Label wajib>Kategori Pengaduan</Label>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {KATEGORI.map(({ value, judul, deskripsi, Ikon }) => {
                      const dipilih = formData.jenis_aduan === value;
                      return (
                        <label
                          key={value}
                          className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-all ${dipilih
                            ? "border-[#001349] bg-[#001349]/[0.04] ring-2 ring-[#001349]/15"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                            }`}
                        >
                          <input
                            type="radio" name="jenis_aduan" value={value}
                            checked={dipilih} onChange={handleChange}
                            className="sr-only" required
                          />
                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${dipilih ? "bg-[#001349] text-white" : "bg-slate-100 text-slate-500"
                              }`}
                          >
                            <Ikon className="h-5 w-5" />
                          </span>
                          <span className="flex-1">
                            <span className="block text-sm font-bold text-slate-900">{judul}</span>
                            <span className="mt-0.5 block text-xs text-slate-500">{deskripsi}</span>
                          </span>
                          {dipilih && <CheckCircle className="h-5 w-5 shrink-0 text-[#001349]" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="uraian_kronologi" wajib>Uraian Pelanggaran</Label>
                  <textarea
                    id="uraian_kronologi" name="uraian_kronologi" rows={5}
                    value={formData.uraian_kronologi} onChange={handleChange}
                    required minLength={50} placeholder="Uraikan dengan jelas jenis pelanggaran atau ketidaktepatan yang Anda ketahui..."
                    className={inputCls}
                  />
                  <p
                    className={`mt-1.5 text-right text-xs font-medium ${formData.uraian_kronologi.length >= 50 ? "text-emerald-600" : "text-slate-400"
                      }`}
                  >
                    {formData.uraian_kronologi.length} / minimal 50 karakter
                  </p>
                </div>

                <div>
                  <Label wajib>Bukti Pendukung</Label>
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, PNG, WebP, atau PDF. Maksimal {BUKTI_CONFIG.MAX_FILES} file, total{" "}
                    {BUKTI_CONFIG.MAX_TOTAL_BYTES / MB} MB, dan {BUKTI_CONFIG.MAX_FILE_BYTES / MB} MB per file.
                  </p>

                  <input
                    ref={inputFileRef} type="file" multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf"
                    onChange={handlePilihFile} className="hidden"
                  />

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputFileRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        inputFileRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    className={`mt-3 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${dragging
                      ? "border-[#001349] bg-[#001349]/5"
                      : "border-slate-300 bg-slate-50/60 hover:border-[#001349]/50 hover:bg-slate-50"
                      }`}
                  >
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#001349]/10 text-[#001349]">
                      <Upload className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-800">
                      Seret file ke sini, atau <span className="text-[#001349] underline">pilih dari perangkat</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {files.length}/{BUKTI_CONFIG.MAX_FILES} file terpilih
                    </p>
                  </div>

                  {files.length > 0 && (
                    <>
                      <ul className="mt-4 space-y-2">
                        {files.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${f.type.startsWith("image/")
                                ? "bg-sky-100 text-sky-600"
                                : "bg-rose-100 text-rose-600"
                                }`}
                            >
                              {f.type.startsWith("image/") ? (
                                <FileImage className="h-4 w-4" />
                              ) : (
                                <FileText className="h-4 w-4" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-slate-800">{f.name}</span>
                              <span className="block text-xs text-slate-500">{formatMB(f.size)} MB</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleHapusFile(i)}
                              aria-label={`Hapus ${f.name}`}
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${persenKuota > 85 ? "bg-rose-500" : "bg-[#001349]"
                              }`}
                            style={{ width: `${persenKuota}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-slate-500">
                          {formatMB(totalBytes)} MB dari {BUKTI_CONFIG.MAX_TOTAL_BYTES / MB} MB terpakai
                        </p>
                      </div>
                    </>
                  )}

                  {errorFile && (
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-600">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {errorFile}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ===== Langkah 4: Pernyataan ===== */}
            {step === 3 && (
              <>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight text-slate-900">Tinjau & Pernyataan</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Periksa ringkasan laporan Anda sebelum mengirim.
                  </p>
                </div>

                <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60">
                  {[
                    ["Pelapor", isAnonim ? "Dirahasiakan" : formData.nama_pelapor],
                    ["Terlapor", `${formData.nama_terlapor} (angkatan ${formData.angkatan})`],
                    ["Fakultas / Prodi", formData.fakultas_prodi],
                    ["Kategori", KATEGORI.find((k) => k.value === formData.jenis_aduan)?.judul ?? "-"],
                    ["Bukti", `${files.length} file (${formatMB(totalBytes)} MB)`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
                      <dt className="w-40 shrink-0 text-xs font-bold uppercase tracking-wide text-slate-500">{k}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{v}</dd>
                    </div>
                  ))}
                </dl>

                <label
                  htmlFor="persetujuan"
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${setuju ? "border-[#001349] bg-[#001349]/[0.04]" : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <input
                    id="persetujuan" type="checkbox" required checked={setuju}
                    onChange={(e) => setSetuju(e.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#001349] focus:ring-[#001349]"
                  />
                  <span className="text-sm leading-relaxed text-slate-700">
                    <b className="text-slate-900">Pernyataan keabsahan informasi.</b> Saya menyatakan bahwa
                    informasi yang saya sampaikan merupakan informasi yang saya ketahui dan dapat
                    dipertanggungjawabkan. Saya memahami bahwa laporan yang sengaja dibuat tidak benar dapat
                    ditindaklanjuti sesuai ketentuan yang berlaku. <span className="text-rose-500">*</span>
                  </span>
                </label>

                {pesanError && (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                    <span>{pesanError}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigasi */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:px-10">
            <button
              type="button"
              onClick={kembali}
              disabled={step === 0 || isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-white disabled:opacity-0 ${step === 0 ? "pointer-events-none" : ""
                }`}
            >
              <ChevronLeft className="h-4 w-4" /> Kembali
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-[#001349] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#001f70] disabled:opacity-50"
            >
              {step < TERAKHIR ? (
                <>
                  Lanjut <ChevronRight className="h-4 w-4" />
                </>
              ) : isSubmitting ? (
                "Mengirim..."
              ) : (
                <>
                  Kirim Laporan <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Seluruh informasi digunakan sebagai bahan verifikasi dan dijaga kerahasiaannya.
      </p>
    </div>
  );
}