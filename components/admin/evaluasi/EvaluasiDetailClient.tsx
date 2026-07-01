"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Trash2, Home,
  ClipboardList, AlertCircle, CheckCircle2, Loader2,
  UserCheck, Eye,
} from "lucide-react";
import { toast } from "sonner";

import type { Kandidat } from "@/schemas";
import { isPerluReview, autoHasilAkhir } from "@/schemas";

type SaveStatus = "idle" | "saving" | "saved" | "error";

const REKOMENDASI_OPTIONS = [
  {
    label: "Layak",
    value: "Layak",
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-emerald-400",
  },
  {
    label: "Layak Dipertimbangkan",
    value: "Layak Dipertimbangkan",
    active: "bg-teal-500 text-white border-teal-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-teal-400",
  },
  {
    label: "Tidak Layak Dipertimbangkan",
    value: "Tidak Layak Dipertimbangkan",
    active: "bg-amber-500 text-white border-amber-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-amber-400",
  },
  {
    label: "Tidak Layak",
    value: "Tidak Layak",
    active: "bg-red-500 text-white border-red-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-red-400",
  },
];

const HASIL_AKHIR_OPTIONS = [
  {
    label: "Diusulkan",
    value: "Diusulkan",
    active: "bg-emerald-500 text-white border-emerald-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-emerald-400",
  },
  {
    label: "Tidak Diusulkan",
    value: "Tidak Diusulkan",
    active: "bg-red-500 text-white border-red-500",
    inactive: "bg-white text-muted-foreground border-border hover:border-red-400",
  },
];

const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

function ReadField({ label, value }: { label: string; value?: string | number | null }) {
  const display = value !== undefined && value !== null && value !== 0 && value !== "" ? String(value) : "—";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-on-surface font-medium">{display}</p>
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon?: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-border mb-4">
      {Icon && <Icon size={14} className="text-muted-foreground" />}
      <h3 className="text-sm font-bold text-on-surface">{title}</h3>
    </div>
  );
}

function Badge({ value, type }: { value: boolean | string | null | undefined; type: "validasi" | "rekomendasi" }) {
  if (value === null || value === undefined || value === "") return <span className="text-slate-300 text-xs">—</span>;

  if (type === "validasi") {
    const isValid = value === true || value === "Ada" || value === "true";
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        isValid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
      }`}>
        {isValid ? "Ada" : "Tidak ada"}
      </span>
    );
  }

  if (type === "rekomendasi") {
    const lower = String(value).toLowerCase();
    if (lower.includes("layak") && !lower.includes("tidak") && !lower.includes("pertimbang")) {
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{String(value)}</span>;
    }
    if (lower.includes("pertimbang")) {
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">{String(value)}</span>;
    }
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">{String(value)}</span>;
  }

  return <span className="text-xs text-on-surface">{String(value)}</span>;
}

interface EvaluasiDetailClientProps {
  kandidat: Kandidat;
  id: string;
}

export default function EvaluasiDetailClient({ kandidat, id }: EvaluasiDetailClientProps) {
  const router = useRouter();

  const [form, setForm] = useState({
    rekomendasi: kandidat.rekomendasi || "",
    hasil_akhir: (kandidat.hasil_akhir as string) || "",
    catatan_admin: kandidat.catatan_admin || "",
    alasan: kandidat.alasan || "",
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showDelete, setShowDelete] = useState(false);

  const perluReview = isPerluReview(form.rekomendasi);
  const autoHasil = autoHasilAkhir(form.rekomendasi);

  async function handleSave() {
    if (!form.rekomendasi) {
      toast.error("Data belum lengkap", {
        description: "Pilih rekomendasi terlebih dahulu sebelum menyimpan.",
      });
      return;
    }

    // Jika "Dipertimbangkan", admin harus memilih hasil akhir dulu
    if (perluReview && !form.hasil_akhir) {
      toast.error("Hasil Akhir belum dipilih", {
        description: "Karena rekomendasi ini perlu ditinjau, Admin harus menentukan Hasil Akhir.",
      });
      return;
    }

    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/admin/evaluasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rekomendasi: form.rekomendasi,
          hasil_akhir: autoHasil ?? form.hasil_akhir,
          catatan_admin: form.catatan_admin,
          alasan: form.alasan,
          is_draft: false,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error("Data belum lengkap", {
          description: errData.error || "Gagal menyimpan perubahan. Pastikan semua data sudah terisi.",
        });
        throw new Error(errData.error || "Gagal menyimpan");
      }

      setSaveStatus("saved");
      toast.success("Berhasil disimpan", {
        description: "Rekomendasi evaluasi telah diperbarui.",
      });
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  async function handleDelete() {
    await fetch(`/api/admin/evaluasi/${id}`, { method: "DELETE" }).catch(() => {});
    router.push("/admin/evaluasi");
  }

  const hasWawancaraData = !!(kandidat.hasil_wawancara_id || kandidat.rekomendasi);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">›</span>
          <Link href="/admin/evaluasi" className="text-muted-foreground hover:text-primary transition-colors">Evaluasi</Link>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary truncate max-w-[200px]">{kandidat.nama_pendaftar}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/evaluasi" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
              <ArrowLeft size={13} /> Kembali ke daftar
            </Link>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">{kandidat.nama_pendaftar}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm font-mono">{kandidat.no_pendaftaran_kipk}</p>
              <span className="text-slate-300">·</span>
              <p className="text-muted-foreground text-sm">{kandidat.prodi_pendaftar}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowDelete(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-all">
              <Trash2 size={13} /> Hapus Evaluasi
            </button>
            <button onClick={handleSave} disabled={saveStatus === "saving"}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all disabled:opacity-60 ${
                saveStatus === "saved" ? "bg-emerald-500 text-white" :
                saveStatus === "error" ? "bg-red-500 text-white" :
                "bg-primary text-white hover:bg-primary/90"
              }`}>
              {saveStatus === "saving"
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : saveStatus === "saved" ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Kolom kiri ── */}
        <div className="space-y-4">

          {/* Info pewawancara yang bertugas */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 shadow-sm ${
              kandidat.pewawancara_data || kandidat.pewawancara_id ? "bg-white border-border" : "bg-slate-50 border-dashed border-slate-200"
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
                <UserCheck size={14} className="text-primary" />
              </div>
              <h3 className="font-bold text-on-surface text-sm">Pewawancara Bertugas</h3>
            </div>

            {kandidat.pewawancara_data || kandidat.pewawancara_id ? (
              <div className="space-y-2">
                <p className="font-semibold text-on-surface text-sm">
                  {kandidat.pewawancara_data?.nama || `Pewawancara ID: ${kandidat.pewawancara_id}`}
                </p>
                {kandidat.interviewed_at && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    Diwawancara: {new Date(kandidat.interviewed_at).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada pewawancara yang ditugaskan</p>
            )}
          </motion.div>

          {/* Data mahasiswa — lengkap, read-only */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="bg-slate-50 rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Eye size={14} className="text-muted-foreground" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Data Mahasiswa — Hanya Baca
              </p>
            </div>

            <div className="space-y-5">
              {/* Identitas */}
              <div>
                <SectionHeader title="Identitas" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="No. Pendaftaran KIPK"   value={kandidat.no_pendaftaran_kipk} />
                  <ReadField label="No. KIP"     value={kandidat.no_kip}   />
                  <ReadField label="No. KKS"     value={kandidat.no_kks}   />
                  <ReadField label="NIK"                    value={kandidat.nik}                 />
                  <ReadField label="No. Kartu Keluarga"     value={kandidat.no_kartu_keluarga}   />
                  <ReadField label="NISN"                   value={kandidat.nisn}                />
                  <ReadField label="Kota/Kabupaten Asal"    value={kandidat.kab_kota}            />
                  <ReadField label="No. HP Aktif"           value={kandidat.no_hp}               />
                </div>
              </div>

              {/* Status Sosial */}
              <div>
                <SectionHeader title="Status Sosial Ekonomi" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Status DTSEN"           value={kandidat.status_p3ke}        />
                  <ReadField label="Jumlah Tanggungan"      value={kandidat.jumlah_tanggungan}  />
                  <ReadField label="Orang Tinggal di Rumah" value={kandidat.jumlah_orang_rumah} />
                </div>
              </div>

              {/* Pekerjaan & Penghasilan */}
              <div>
                <SectionHeader title="Pekerjaan & Penghasilan (Awal)" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Pekerjaan Bapak/Wali"   value={kandidat.pekerjaan_ayah}  />
                  <ReadField label="Penghasilan Bapak/Wali" value={kandidat.penghasilan_ayah ? fmt.format(Number(kandidat.penghasilan_ayah)) : "—"} />
                  <ReadField label="Pekerjaan Ibu"          value={kandidat.pekerjaan_ibu}   />
                  <ReadField label="Penghasilan Ibu"        value={kandidat.penghasilan_ibu  ? fmt.format(Number(kandidat.penghasilan_ibu))  : "—"} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Kolom kanan (2/3) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Data yang diisi pewawancara — READ ONLY untuk admin */}
          {hasWawancaraData ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-slate-50 rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Data Hasil Wawancara Lapangan
                </p>
              </div>

              <div className="space-y-5">
                {/* Validasi Dokumen */}
                <div>
                  <SectionHeader title="Validasi Kepemilikan Dokumen" />
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">KKS</p>
                      <Badge value={kandidat.validasi_kks} type="validasi" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">KIP</p>
                      <Badge value={kandidat.validasi_kip} type="validasi" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">SKTM</p>
                      <Badge value={kandidat.validasi_sktm} type="validasi" />
                    </div>
                  </div>
                </div>

                {/* Validasi Penghasilan Riil */}
                <div>
                  <SectionHeader title="Validasi Penghasilan Riil" />
                  <div className="grid grid-cols-2 gap-4">
                    <ReadField label="Ket. Pekerjaan Ayah"    value={kandidat.ket_pekerjaan_ayah} />
                    <ReadField label="Penghasilan Ayah/bln"   value={kandidat.ket_penghasilan_ayah ? fmt.format(kandidat.ket_penghasilan_ayah) : null} />
                    <ReadField label="Ket. Pekerjaan Ibu"     value={kandidat.ket_pekerjaan_ibu} />
                    <ReadField label="Penghasilan Ibu/bln"    value={kandidat.ket_penghasilan_ibu ? fmt.format(kandidat.ket_penghasilan_ibu) : null} />
                    <ReadField label="Penghasilan Lain/bln"   value={kandidat.penghasilan_lain ? fmt.format(kandidat.penghasilan_lain) : "Rp 0"} />
                    <ReadField label="Tanggungan Sebenarnya"  value={kandidat.jml_tanggungan_sebenarnya} />
                    <ReadField label="Orang Tinggal di Rumah" value={kandidat.validasi_orang_rumah} />
                    <ReadField label="Sosial Media"           value={kandidat.sosial_media} />
                  </div>
                </div>

                {/* Kondisi Tempat Tinggal Riil */}
                <div>
                  <SectionHeader title="Kondisi Tempat Tinggal Riil" icon={Home} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <ReadField label="Kepemilikan Rumah"  value={kandidat.kepemilikan_rumah} />
                    <ReadField label="Tahun Perolehan"           value={kandidat.tahun_perolehan} />
                    <ReadField label="Luas Tanah (m²)"           value={kandidat.luas_tanah} />
                    <ReadField label="Luas Bangunan (m²)"        value={kandidat.luas_bangunan} />
                    <ReadField label="Sumber Air"         value={kandidat.sumber_air} />
                    <ReadField label="MCK"                value={kandidat.mck} />
                    <ReadField label="Jarak Pusat Kota"          value={kandidat.jarak_pusat_kota ? `${kandidat.jarak_pusat_kota} km` : null} />
                    <ReadField label="Kondisi Rumah"             value={kandidat.kondisi_rumah} />
                  </div>
                  {kandidat.aset && (
                    <div className="mt-3">
                      <ReadField label="Aset yang Dimiliki" value={kandidat.aset} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <ClipboardList size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Pewawancara belum mengisi data lapangan.</p>
            </motion.div>
          )}

          {/* Form admin — rekomendasi & hasil akhir */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <ClipboardList size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">Rekomendasi Wawancara</h3>
                <p className="text-[11px] text-muted-foreground">Rekomendasi pewawancara berdasarkan keputusan panitia.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Pilih Rekomendasi (4 opsi) */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Rekomendasi <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {REKOMENDASI_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm((f) => ({
                        ...f,
                        rekomendasi: opt.value,
                        // Reset hasil_akhir saat rekomendasi berubah
                        hasil_akhir: autoHasilAkhir(opt.value) ?? "",
                      }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        form.rekomendasi === opt.value ? opt.active : opt.inactive
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {form.rekomendasi && (
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Dipilih: <span className="font-semibold">{form.rekomendasi}</span>
                  </p>
                )}
              </div>

              {/* Hasil Akhir — auto jika Layak/Tidak Layak, manual jika Dipertimbangkan */}
              <div className={`rounded-xl p-4 border ${perluReview ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50"}`}>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Hasil Akhir{perluReview && <span className="text-amber-600 ml-1">— Perlu Keputusan Admin</span>}
                </label>
                {perluReview ? (
                  <>
                    <p className="text-xs text-amber-700 mb-3">
                      Rekomendasi <strong>{form.rekomendasi}</strong> memerlukan tinjauan langsung. Pilih hasil akhir setelah meninjau data wawancara.
                    </p>
                    <div className="flex gap-2">
                      {HASIL_AKHIR_OPTIONS.map((opt) => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm((f) => ({ ...f, hasil_akhir: opt.value }))}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            form.hasil_akhir === opt.value ? opt.active : opt.inactive
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {form.hasil_akhir && (
                      <p className="text-[11px] text-muted-foreground mt-1.5">
                        Hasil Akhir: <span className="font-semibold">{form.hasil_akhir}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg ${
                    autoHasil === "Diusulkan"
                      ? "bg-emerald-100 text-emerald-700"
                      : autoHasil === "Tidak Diusulkan"
                      ? "bg-red-100 text-red-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {autoHasil ?? "Pilih rekomendasi dulu"}
                  </div>
                )}
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Catatan Admin</label>
                <textarea value={form.catatan_admin}
                  onChange={(e) => setForm((f) => ({ ...f, catatan_admin: e.target.value }))}
                  placeholder="Catatan tambahan untuk keputusan ini..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 resize-none transition-all"
                />
              </div>

              {/* Alasan (dari pewawancara) */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Alasan Pewawancara</label>
                <textarea value={form.alasan}
                  onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
                  placeholder="Alasan dari pewawancara..."
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 resize-none transition-all"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-border shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <h3 className="font-bold text-on-surface">Hapus Hasil Wawancara?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Data laporan lapangan untuk <span className="font-semibold text-on-surface">{kandidat.nama_pendaftar}</span> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-all">
                Batal
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all">
                Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
