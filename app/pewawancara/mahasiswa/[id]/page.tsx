"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Loader2,
  Eye,
  ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import type { Kandidat, MahasiswaEvaluasi } from "@/schemas";
import { getStatusWawancara, getStatusWawancaraColor } from "@/schemas";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const OPT_ADA_TIDAK = [
  { label: "Ada", value: true },
  { label: "Tidak Ada", value: false },
];
const OPT_KEPEMILIKAN = [
  { label: "Milik Sendiri", value: 1 },
  { label: "Sewa", value: 2 },
  { label: "Tidak Memiliki", value: 3 },
  { label: "Menumpang", value: 4 },
];
const OPT_SUMBER_AIR = [
  { label: "Sumur", value: 1 },
  { label: "PDAM", value: 2 },
  { label: "Sungai/Mata Air", value: 3 },
];
const OPT_MCK = [
  { label: "Berbagi Pakai", value: 1 },
  { label: "Milik Sendiri", value: 2 },
];
const OPT_KONDISI = ["Layak Menerima Beasiswa", "Tidak Layak Beasiswa"];

// Hasil akhir dikonversi ke teks untuk disimpan ke DB kolom rekomendasi (varchar 50)
const OPT_HASIL_AKHIR = [
  {
    label: "Layak",
    value: 1,
    text_db: "Layak",
    color: "bg-emerald-500 text-white border-emerald-500",
  },
  {
    label: "Dipertimbangkan",
    value: 2,
    text_db: "Dipertimbangkan",
    color: "bg-amber-500 text-white border-amber-500",
  },
  {
    label: "Tidak Layak",
    value: 3,
    text_db: "Tidak Layak",
    color: "bg-red-500 text-white border-red-500",
  },
];

const OPT_JALUR_MASUK = ["SNBP", "SNBT", "UM"];

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function ReadField({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  const display =
    value !== undefined && value !== null && value !== "" ? String(value) : "—";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
        {label}
      </p>
      <p className="text-sm text-slate-800 font-semibold">{display}</p>
    </div>
  );
}

function RadioGroupBoolean({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {OPT_ADA_TIDAK.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt.value
                ? opt.value
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm"
                  : "bg-rose-50 text-rose-700 border-rose-200 shadow-sm"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioGroupNumeric({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: number | null;
  options: { label: string; value: number }[];
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt.value
                ? "bg-primary/10 text-primary border-secondary shadow-sm"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioGroupString({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              value === opt
                ? "bg-primary/10 text-primary border-secondary shadow-sm"
                : "bg-white text-slate-400 border-slate-200 hover:border-slate-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string | number | null;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-slate-50 transition-all placeholder:font-normal"
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-2">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="number"
        value={value === null ? "" : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-slate-50 transition-all"
        title="Input"
      />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pb-3 border-b border-slate-100 mb-6">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function formatRupiahAman(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return fmt.format(num);
}

export default function PewawancaraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [kandidat, setKandidat] = useState<MahasiswaEvaluasi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [form, setForm] = useState<Partial<MahasiswaEvaluasi>>({});

  useEffect(() => {
    fetch(`/api/admin/evaluasi/${id}`)
      .then((r) => r.json())
      .then((res) => {
        const d = res.data || res;
        setKandidat(d);

        let mappedHasil = null;
        const rekDb = d.rekomendasi?.toLowerCase() || "";
        if (rekDb.includes("tidak")) mappedHasil = 3;
        else if (rekDb.includes("pertimbang")) mappedHasil = 2;
        else if (rekDb.includes("layak")) mappedHasil = 1;

        setForm({
          ...d,
          hasil_akhir: mappedHasil,
        });
      })
      .catch(() => setKandidat(null))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof MahasiswaEvaluasi) => (v: any) =>
    setForm((f) => ({ ...f, [key]: v }));

  async function handleSave() {
    // Validasi field wajib sebelum simpan
    const missing: string[] = [];
    if (form.validasi_kks === null || form.validasi_kks === undefined) missing.push("Kepemilikan KKS");
    if (form.validasi_kip === null || form.validasi_kip === undefined) missing.push("Kepemilikan KIP");
    if (form.validasi_sktm === null || form.validasi_sktm === undefined) missing.push("Kepemilikan SKTM");
    if (!form.ket_pekerjaan_ayah) missing.push("Pekerjaan Ayah (Riil)");
    if (!form.ket_penghasilan_ayah && form.ket_penghasilan_ayah !== 0) missing.push("Penghasilan Ayah");
    if (!form.ket_pekerjaan_ibu) missing.push("Pekerjaan Ibu (Riil)");
    if (!form.ket_penghasilan_ibu && form.ket_penghasilan_ibu !== 0) missing.push("Penghasilan Ibu");
    if (!form.jml_tanggungan_sebenarnya && form.jml_tanggungan_sebenarnya !== 0) missing.push("Jml. Tanggungan");
    if (!form.validasi_orang_rumah && form.validasi_orang_rumah !== 0) missing.push("Jml. Orang Serumah");
    if (!form.kepemilikan_rumah) missing.push("Status Kepemilikan Rumah");
    if (!form.sumber_air) missing.push("Sumber Air");
    if (!form.mck) missing.push("MCK");
    if (!form.kondisi_rumah) missing.push("Kondisi Fisik Rumah");
    if (!form.hasil_akhir) missing.push("Rekomendasi Akhir");

    if (missing.length > 0) {
      toast.error("Data belum lengkap", {
        description: `Lengkapi: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? ` dan ${missing.length - 3} lainnya` : ""}`,
      });
      return;
    }

    setSaveStatus("saving");

    const textRekomendasi =
      OPT_HASIL_AKHIR.find((o) => o.value === form.hasil_akhir)?.text_db ||
      null;

    try {
      const payload = {
        validasi_kks: form.validasi_kks,
        validasi_kip: form.validasi_kip,
        validasi_sktm: form.validasi_sktm,
        sosial_media: form.sosial_media,
        ket_pekerjaan_ayah: form.ket_pekerjaan_ayah,
        ket_penghasilan_ayah: form.ket_penghasilan_ayah,
        ket_pekerjaan_ibu: form.ket_pekerjaan_ibu,
        ket_penghasilan_ibu: form.ket_penghasilan_ibu,
        penghasilan_lain: form.penghasilan_lain,
        jml_tanggungan_sebenarnya: form.jml_tanggungan_sebenarnya,
        validasi_orang_rumah: form.validasi_orang_rumah,
        kepemilikan_rumah: form.kepemilikan_rumah,
        tahun_perolehan: form.tahun_perolehan,
        luas_tanah: form.luas_tanah,
        luas_bangunan: form.luas_bangunan,
        sumber_air: form.sumber_air,
        mck: form.mck,
        aset: form.aset,
        kondisi_rumah: form.kondisi_rumah,
        jarak_pusat_kota: form.jarak_pusat_kota,
        rekomendasi: textRekomendasi,
        alasan: form.alasan,
        is_draft: false,
        pewawancara_id: kandidat?.pewawancara_id,
      };

      const res = await fetch(`/api/admin/evaluasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error("Gagal menyimpan", {
          description: errData.error || "Terjadi kesalahan saat menyimpan data.",
        });
        throw new Error();
      }

      setSaveStatus("saved");
      toast.success("Data Hasil Wawancara berhasil disimpan", {
        description: "Data observasi lapangan telah tersimpan.",
      });
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3 text-slate-400">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm font-medium">Memuat data form...</p>
      </div>
    );
  }

  if (!kandidat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <ClipboardList size={32} className="text-slate-400" />
        </div>
        <p className="text-xl font-bold text-slate-900 mb-2">
          Data Tidak Ditemukan
        </p>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          Mohon pastikan URL sudah benar atau kandidat belum ditarik oleh
          sistem.
        </p>
        <Link
          href="/pewawancara/mahasiswa"
          className="px-6 py-3 bg-primary text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-secondary transition-colors"
        >
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  const SaveBtn = ({ className = "" }: { className?: string }) => (
    <button
      onClick={handleSave}
      disabled={saveStatus === "saving"}
      className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50 ${
        saveStatus === "saved"
          ? "bg-emerald-500 text-white"
          : saveStatus === "error"
            ? "bg-rose-500 text-white"
            : "bg-primary text-white hover:bg-secondary"
      } ${className}`}
    >
      {saveStatus === "saving" ? (
        <Loader2 size={16} className="animate-spin" />
      ) : saveStatus === "saved" ? (
        <CheckCircle2 size={16} />
      ) : (
        <Save size={16} />
      )}
      {saveStatus === "saving"
        ? "Menyimpan..."
        : saveStatus === "saved"
          ? "Tersimpan"
          : "Simpan Laporan"}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* Header Navigation */}
        <div className="mb-8">
          <Link
            href="/pewawancara/mahasiswa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-secondary mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg mb-3">
                #{kandidat.no}
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kandidat.nama}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-medium text-slate-500">
                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {kandidat.no_pendaftaran_kipk}
                </span>
                <span>•</span>
                <span>{kandidat.prodi}</span>
                <span>•</span>
                <span>{kandidat.jalur_masuk || "—"}</span>
                <span>•</span>
                {(() => {
                  const statusW = getStatusWawancara(kandidat.is_draft, kandidat.pewawancara_id);
                  const colorW = getStatusWawancaraColor(statusW);
                  return (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorW.bg} ${colorW.text} ${colorW.border}`}>
                      {statusW === "Sudah Diwawancarai" ? <CheckCircle2 size={11} /> : null}
                      {statusW}
                    </span>
                  );
                })()}
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <SaveBtn className="w-full md:w-auto justify-center" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* ── BAGIAN 1: Data dari mahasiswa (READ-ONLY) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-6 bg-primary/10 text-primary w-fit px-4 py-2 rounded-xl">
              <Eye size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">
                Informasi Awal (Berdasarkan REGON)
              </p>
            </div>

            <div className="space-y-8">
              {/* Identitas */}
              <div>
                <SectionHeader title="Profil Pendaftar" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <ReadField
                    label="No Bantuan Sosial"
                    value={kandidat.no_bantuan_sosial}
                  />
                  <ReadField label="NIK" value={kandidat.nik} />
                  <ReadField label="NISN" value={kandidat.nisn} />
                  <ReadField
                    label="No. Kartu Keluarga"
                    value={kandidat.no_kartu_keluarga}
                  />
                  <ReadField
                    label="Asal Sekolah"
                    value={kandidat.asal_sekolah}
                  />
                  <ReadField
                    label="Kota/Kabupaten Asal"
                    value={kandidat.kab_kota}
                  />
                  <ReadField label="No. HP Aktif" value={kandidat.no_hp} />
                  <ReadField label="Alamat Email" value={kandidat.email} />
                  <ReadField label="Koordinat GPS" value={kandidat.koordinat} />
                  <div className="sm:col-span-2 md:col-span-3">
                    <ReadField label="Alamat Lengkap" value={kandidat.alamat} />
                  </div>
                </div>
              </div>

              {/* Status Ekonomi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <SectionHeader title="Status & Tanggungan" />
                  <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 h-full">
                    <ReadField
                      label="Status DTSEN"
                      value={kandidat.status_dtsen}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <ReadField
                        label="Tanggungan"
                        value={kandidat.jumlah_tanggungan}
                      />
                      <ReadField
                        label="Orang di Rumah"
                        value={kandidat.jumlah_orang_rumah}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <ReadField
                        label="PBB Tahunan"
                        value={kandidat.pbb ? fmt.format(kandidat.pbb) : "—"}
                      />
                      <ReadField
                        label="Daya Listrik"
                        value={kandidat.daya_listrik}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Pekerjaan & Penghasilan" />
                  <div className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 h-full">
                    <ReadField
                      label="Pekerjaan Ayah"
                      value={kandidat.pekerjaan_ayah}
                    />
                    <ReadField
                      label="Penghasilan Ayah"
                      value={formatRupiahAman(kandidat.penghasilan_ayah)}
                    />
                    <ReadField
                      label="Pekerjaan Ibu"
                      value={kandidat.pekerjaan_ibu}
                    />
                    <ReadField
                      label="Penghasilan Ibu"
                      value={formatRupiahAman(kandidat.penghasilan_ibu)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── BAGIAN 2: Form validasi pewawancara (EDITABLE) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/40 p-6 md:p-8"
          >
            <div className="flex items-center gap-2 mb-6 bg-primary text-white w-fit px-4 py-2 rounded-xl shadow-sm">
              <ClipboardList size={18} />
              <p className="text-xs font-bold uppercase tracking-wider">
                Laporan Hasil Observasi Lapangan
              </p>
            </div>

            <div className="space-y-10">
              {/* Validasi Dokumen */}
              <div>
                <SectionHeader
                  title="Dokumen KKS/KIP/SKTM"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                  <RadioGroupBoolean
                    label="Kepemilikan KKS"
                    value={form.validasi_kks ?? null}
                    onChange={set("validasi_kks")}
                  />
                  <RadioGroupBoolean
                    label="Kepemilikan KIP"
                    value={form.validasi_kip ?? null}
                    onChange={set("validasi_kip")}
                  />
                  <RadioGroupBoolean
                    label="Kepemilikan SKTM"
                    value={form.validasi_sktm ?? null}
                    onChange={set("validasi_sktm")}
                  />
                </div>
              </div>

              {/* Validasi Penghasilan & Tanggungan */}
              <div>
                <SectionHeader
                  title="Kondisi Ekonomi Riil"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <TextInput
                    label="Pekerjaan Ayah (Riil)"
                    value={form.ket_pekerjaan_ayah ?? ""}
                    onChange={set("ket_pekerjaan_ayah")}
                  />
                  <NumberInput
                    label="Penghasilan Ayah/bulan (Rp)"
                    value={form.ket_penghasilan_ayah ?? null}
                    onChange={set("ket_penghasilan_ayah")}
                  />
                  <TextInput
                    label="Pekerjaan Ibu (Riil)"
                    value={form.ket_pekerjaan_ibu ?? ""}
                    onChange={set("ket_pekerjaan_ibu")}
                  />
                  <NumberInput
                    label="Penghasilan Ibu/bulan (Rp)"
                    value={form.ket_penghasilan_ibu ?? null}
                    onChange={set("ket_penghasilan_ibu")}
                  />
                  <div className="sm:col-span-2">
                    <NumberInput
                      label="Total Penghasilan Lainnya/bulan (Rp) (Bantuan, Warisan, Kakak, dll)"
                      value={form.penghasilan_lain ?? null}
                      onChange={set("penghasilan_lain")}
                    />
                  </div>
                  <NumberInput
                    label="Jml. Tanggungan Keluarga (Riil)"
                    value={form.jml_tanggungan_sebenarnya ?? null}
                    onChange={set("jml_tanggungan_sebenarnya")}
                  />
                  <NumberInput
                    label="Jml. Orang Tinggal Serumah (Riil)"
                    value={form.validasi_orang_rumah ?? null}
                    onChange={set("validasi_orang_rumah")}
                  />
                </div>
              </div>

              {/* Kondisi Rumah Fisik */}
              <div>
                <SectionHeader
                  title="Aset & Kondisi Tempat Tinggal"
                />
                <div className="space-y-6">
                  <RadioGroupNumeric
                    label="Status Kepemilikan Rumah"
                    value={form.kepemilikan_rumah ?? null}
                    options={OPT_KEPEMILIKAN}
                    onChange={set("kepemilikan_rumah")}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <TextInput
                      label="Tahun Perolehan/Dibangun"
                      value={form.tahun_perolehan ?? ""}
                      onChange={set("tahun_perolehan")}
                      placeholder="Contoh: 2005"
                    />
                    <NumberInput
                      label="Luas Tanah (m²)"
                      value={form.luas_tanah ?? null}
                      onChange={set("luas_tanah")}
                    />
                    <NumberInput
                      label="Luas Bangunan (m²)"
                      value={form.luas_bangunan ?? null}
                      onChange={set("luas_bangunan")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <RadioGroupNumeric
                      label="Sumber Air Bersih Utama"
                      value={form.sumber_air ?? null}
                      options={OPT_SUMBER_AIR}
                      onChange={set("sumber_air")}
                    />
                    <RadioGroupNumeric
                      label="Fasilitas Mandi Cuci Kakus (MCK)"
                      value={form.mck ?? null}
                      options={OPT_MCK}
                      onChange={set("mck")}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <TextInput
                      label="Aset Bernilai yang Dimiliki (Motor, TV, Kulkas, dll)"
                      value={form.aset ?? ""}
                      onChange={set("aset")}
                      placeholder="Pisahkan dengan koma..."
                    />
                    <TextInput
                      label="Akun Media Sosial Utama (IG/TikTok)"
                      value={form.sosial_media ?? ""}
                      onChange={set("sosial_media")}
                      placeholder="@username"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
                    <RadioGroupString
                      label="Kesimpulan Kondisi Fisik Rumah"
                      value={form.kondisi_rumah ?? null}
                      options={OPT_KONDISI}
                      onChange={set("kondisi_rumah")}
                    />
                    <NumberInput
                      label="Jarak ke Pusat Kota/Kecamatan (KM)"
                      value={form.jarak_pusat_kota ?? null}
                      onChange={set("jarak_pusat_kota")}
                    />
                  </div>
                </div>
              </div>

              {/* Kesimpulan Akhir */}
              <div className="pt-6 border-t-2 border-dashed border-slate-200">
                <SectionHeader
                  title="Rekomendasi Akhir Pewawancara"
                />
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Rekomendasi:{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {OPT_HASIL_AKHIR.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, hasil_akhir: opt.value }))
                          }
                          className={`px-6 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                            form.hasil_akhir === opt.value
                              ? `${opt.color} shadow-md`
                              : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Catatan / Alasan Rekomendasi
                    </label>
                    <textarea
                      value={form.alasan ?? ""}
                      onChange={(e) => set("alasan")(e.target.value)}
                      rows={4}
                      placeholder="Jelaskan secara singkat alasan Anda memilih rekomendasi di atas..."
                      className="w-full px-5 py-4 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-slate-50 resize-none transition-all placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer Fixed Action Bar (Mobile only) */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 md:hidden z-50">
          <SaveBtn className="w-full justify-center h-12" />
        </div>
      </div>
    </div>
  );
}