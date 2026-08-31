"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, UploadCloud, X } from "lucide-react";



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
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="animate-spin" size={20} />
          <span className="text-sm">Memuat data evaluasi...</span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Sudah pernah submit → tampilkan ringkasan
  // ═══════════════════════════════════════════════════
  if (alreadySubmitted && submittedData) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Link href="/mahasiswa/monev" className="inline-flex items-center gap-1 text-primary font-medium text-sm">
          <span>←</span> Kembali ke Daftar Evaluasi
        </Link>

        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-full">
              <CheckCircle2 className="text-emerald-600" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-800">Evaluasi Sudah Terkirim</h1>
              <p className="text-sm text-emerald-600 mt-0.5">
                Anda sudah mengirim evaluasi untuk periode ini pada{" "}
                {submittedData.waktu_lapor
                  ? new Date(submittedData.waktu_lapor as string).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Pekerjaan Ayah</p>
              <p className="font-bold text-slate-800">{(submittedData.pekerjaan_ayah as string) || "-"}</p>
              <p className="text-sm text-slate-600 mt-1">
                Penghasilan: {formatRupiah(Number(submittedData.penghasilan_ayah ?? 0))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Pekerjaan Ibu</p>
              <p className="font-bold text-slate-800">{(submittedData.pekerjaan_ibu as string) || "-"}</p>
              <p className="text-sm text-slate-600 mt-1">
                Penghasilan: {formatRupiah(Number(submittedData.penghasilan_ibu ?? 0))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Penghasilan Lain</p>
              <p className="font-bold text-slate-800">
                {formatRupiah(Number(submittedData.penghasilan_lain ?? 0))}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Jumlah Tanggungan</p>
              <p className="font-bold text-slate-800">{String(submittedData.jumlah_tanggungan ?? "-")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  // RENDER: Sukses submit
  // ═══════════════════════════════════════════════════
  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <Link href="/mahasiswa/monev" className="inline-flex items-center gap-1 text-primary font-medium text-sm">
        <span> ← </span> Kembali ke Daftar Evaluasi
      </Link>

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
        <h1 className="text-xl font-bold text-primary">
          Form Evaluasi Ekonomi Beasiswa - SAKTI
        </h1>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X size={16} />
          </button>
        </div>
      )}

      <form className="space-y-8" onSubmit={handleSubmit}>
        {/* SECTION 1: Pekerjaan dan Pendapatan Orang Tua */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2 border-b border-slate-200 pb-2">
            Pekerjaan dan Pendapatan Orang Tua
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── Kartu Ayah ── */}
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-8 shadow-sm">
              {/* Pekerjaan Ayah */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pekerjaan Ayah <span className="text-red-500">*</span>
                </label>
                <select
                  value={pekerjaanAyah}
                  onChange={(e) => setPekerjaanAyah(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  title="Input Pekerjaan Ayah"
                  required
                >
                  <option value="">Pilih Pekerjaan...</option>
                  {PEKERJAAN_OPTIONS.filter((p) => p !== "Ibu Rumah Tangga").map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* File upload: wajib jika ayah bekerja */}
                {pekerjaanAyah && pekerjaanAyah !== "Tidak Bekerja" && (
                  <div className="mt-3">
                    <input
                      ref={fileRefs.pekerjaanAyah}
                      type="file"
                      accept=".pdf, image/*"
                      onChange={(e) => handleFileChange(e, setFilePekerjaanAyah)}
                      className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                      title="Upload Bukti Pekerjaan"
                    />
                    <div className="mt-1.5 text-xs space-y-0.5">
                      <span className="block text-secondary">
                        * Upload bukti pekerjaan (pdf/gambar)
                      </span>
                      <span className="block text-red-500/90 font-medium">
                        * Ukuran file maksimal 1 MB
                      </span>
                    </div>
                    {filePekerjaanAyah && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {filePekerjaanAyah.name}</p>
                    )}
                  </div>
                )}
              </div>

              <hr className="border-slate-200" />

              {/* Pendapatan Ayah */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pendapatan Ayah (per bulan)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="0"
                    value={pendapatanAyah || ""}
                    onChange={(e) => setPendapatanAyah(Number(e.target.value) || 0)}
                  />
                </div>

                {/* Slip gaji: wajib jika penghasilan > 0 */}
                {pendapatanAyah > 0 && (
                  <div className="mt-3">
                    <input
                      ref={fileRefs.penghasilanAyah}
                      type="file"
                      accept=".pdf, image/*"
                      onChange={(e) => handleFileChange(e, setFilePenghasilanAyah)}
                      className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                      title="Upload Slip Gaji"
                    />
                    <div className="mt-1.5 text-xs space-y-0.5">
                      <span className="block text-secondary">* Upload slip gaji / surat penghasilan</span>
                      <span className="block text-red-500/90 font-medium">* Ukuran file maksimal 1 MB</span>
                    </div>
                    {filePenghasilanAyah && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {filePenghasilanAyah.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Kartu Ibu ── */}
            <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-8 shadow-sm">
              {/* Pekerjaan Ibu */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pekerjaan Ibu <span className="text-red-500">*</span>
                </label>
                <select
                  value={pekerjaanIbu}
                  onChange={(e) => setPekerjaanIbu(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  title="Input Pekerjaan Ibu"
                  required
                >
                  <option value="">Pilih Pekerjaan...</option>
                  {PEKERJAAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {pekerjaanIbu &&
                  pekerjaanIbu !== "Tidak Bekerja" &&
                  pekerjaanIbu !== "Ibu Rumah Tangga" && (
                    <div className="mt-3">
                      <input
                        ref={fileRefs.pekerjaanIbu}
                        type="file"
                        accept=".pdf, image/*"
                        onChange={(e) => handleFileChange(e, setFilePekerjaanIbu)}
                        className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                        title="Upload Bukti Pekerjaan"
                      />
                      <div className="mt-1.5 text-xs space-y-0.5">
                        <span className="block text-secondary">* Upload bukti pekerjaan (pdf/gambar)</span>
                        <span className="block text-red-500/90 font-medium">* Ukuran file maksimal 1 MB</span>
                      </div>
                      {filePekerjaanIbu && (
                        <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {filePekerjaanIbu.name}</p>
                      )}
                    </div>
                  )}
              </div>

              <hr className="border-slate-200" />

              {/* Pendapatan Ibu */}
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  Pendapatan Ibu (per bulan)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">Rp</span>
                  <input
                    type="number"
                    min="0"
                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                    placeholder="0"
                    value={pendapatanIbu || ""}
                    onChange={(e) => setPendapatanIbu(Number(e.target.value) || 0)}
                  />
                </div>

                {pendapatanIbu > 0 && (
                  <div className="mt-3">
                    <input
                      ref={fileRefs.penghasilanIbu}
                      type="file"
                      accept=".pdf, image/*"
                      onChange={(e) => handleFileChange(e, setFilePenghasilanIbu)}
                      className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                      title="Upload Slip Gaji"
                    />
                    <div className="mt-1.5 text-xs space-y-0.5">
                      <span className="block text-secondary">* Upload slip gaji / surat penghasilan</span>
                      <span className="block text-red-500/90 font-medium">* Ukuran file maksimal 1 MB</span>
                    </div>
                    {filePenghasilanIbu && (
                      <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {filePenghasilanIbu.name}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2 & 3: Pendapatan Lain & Tanggungan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <section className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-xl font-bold text-primary border-b border-slate-200 pb-2">
              Pendapatan Lain-lain
            </h2>
            <div className="bg-primary/5 border-l-4 border-primary p-3.5 rounded-r-lg text-sm text-secondary leading-relaxed">
              Pendapatan lain selain dari orang tua yang dapat berasal dari usaha sendiri, wali, dsb. Jika tidak ada, silakan isi dengan 0.
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Pendapatan Lain-lain (per bulan)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-secondary font-medium text-sm">Rp</span>
                <input
                  type="number"
                  min="0"
                  className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                  placeholder="0"
                  value={pendapatanLain || ""}
                  onChange={(e) => setPendapatanLain(Number(e.target.value) || 0)}
                />
              </div>

              {pendapatanLain > 0 && (
                <div className="mt-3">
                  <input
                    ref={fileRefs.penghasilanLain}
                    type="file"
                    accept=".pdf, image/*"
                    onChange={(e) => handleFileChange(e, setFilePenghasilanLain)}
                    className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                    title="Input Bukti Pendapatan Lain"
                  />
                  <div className="mt-1.5 text-xs space-y-0.5">
                    <span className="block text-secondary">* Upload bukti pendapatan lainnya</span>
                    <span className="block text-red-500/90 font-medium">* Ukuran file maksimal 1 MB</span>
                  </div>
                  {filePenghasilanLain && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {filePenghasilanLain.name}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 space-y-5 shadow-sm">
            <h2 className="text-xl font-bold text-primary border-b border-slate-200 pb-2">
              Tanggungan
            </h2>
            <div className="bg-primary/5 border-l-4 border-primary p-3.5 rounded-r-lg text-sm text-secondary leading-relaxed">
              Jumlah tanggungan (termasuk diri sendiri), dibuktikan dengan scan Kartu Keluarga.
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Jumlah Tanggungan <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white text-secondary focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                value={tanggungan}
                title="Input Tanggungan"
                onChange={(e) => setTanggungan(Number(e.target.value) || 1)}
                required
              />
              <div className="mt-3">
                <input
                  ref={fileRefs.scanKk}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => handleFileChange(e, setFileScanKk)}
                  className="block w-full text-sm text-secondary bg-white border border-slate-300 rounded-lg cursor-pointer file:cursor-pointer file:border-0 file:py-2.5 file:px-4 file:mr-4 file:bg-primary/5 file:text-primary file:font-semibold hover:file:bg-primary/10 transition-all"
                  title="Input KK"
                  required
                />
                <div className="mt-1.5 text-xs space-y-0.5">
                  <span className="block text-red-500/90 font-medium">
                    * Wajib upload scan Kartu Keluarga
                  </span>
                  <span className="block text-red-500/90 font-medium">
                    * Format file HANYA BOLEH Gambar (jpg/png)
                  </span>
                  <span className="block text-red-500/90 font-medium">
                    * Ukuran file maksimal 1 MB
                  </span>
                </div>
                {fileScanKk && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">✓ {fileScanKk.name}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 4: Perhitungan Sistem (Otomatis) */}
        <section className="bg-slate-100 p-5 rounded-xl border border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-600">
              Total Pendapatan (Ayah + Ibu + Lainnya):
            </span>
            <span className="font-bold text-slate-800">
              {formatRupiah(totalPendapatan)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-600">
              Rupiah per Tanggungan (Total / Tanggungan):
            </span>
            <span className="font-bold text-slate-800">
              {formatRupiah(rupiahPerTanggungan)}
            </span>
          </div>
        </section>

        {/* Action Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-secondary transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                Kirim Evaluasi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
