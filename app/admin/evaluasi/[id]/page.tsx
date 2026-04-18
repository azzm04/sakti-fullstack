"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Trash2, User, Phone, Mail, BookOpen,
  ClipboardList, AlertCircle, CheckCircle2, Loader2,
  MapPin, UserCheck, Eye, Home,
} from "lucide-react";

interface PewawancaraData {
  id: number;
  nama: string;
  email: string;
  sso_id: string | null;
}

interface Kandidat {
  id: string;
  no: number;
  no_pendaftaran_kipk: string;
  no_bantuan_sosial: string;
  nama: string;
  prodi: string;
  nik: string;
  no_kartu_keluarga: string;
  nisn: string;
  asal_sekolah: string;
  status_dtsen: string;
  jumlah_tanggungan: number;
  jumlah_orang_rumah: number;
  pekerjaan_ayah: string;
  pekerjaan_ibu: string;
  penghasilan_ayah: number;
  penghasilan_ibu: number;
  kab_kota: string;
  provinsi: string;
  alamat: string;
  pbb: number;
  daya_listrik: string;
  no_hp: string;
  email: string;
  koordinat: string;
  // Hasil wawancara
  validasi_kks: string;
  validasi_kip: string;
  validasi_sktm: string;
  sosial_media: string;
  ket_pekerjaan_ayah: string;
  ket_penghasilan_ayah: string;
  ket_pekerjaan_ibu: string;
  ket_penghasilan_ibu: string;
  penghasilan_lain: number;
  jml_tanggungan_sebenarnya: number;
  validasi_orang_rumah: number;
  kepemilikan_rumah: string;
  tahun_perolehan: string;
  luas_tanah: number;
  luas_bangunan: number;
  sumber_air: string;
  mck: string;
  aset: string;
  kondisi_rumah: string;
  jarak_pusat_kota: number;
  rekomendasi: string;
  alasan: string;
  pewawancara: string;
  hasil_akhir: number | null;
  pewawancara_id: number | null;
  pewawancara_data: PewawancaraData | null;
  status_wawancara: string;
  interviewed_at: string | null;
  skor_total: number;
  ranking: number;
  created_at: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const HASIL_AKHIR_OPTIONS: { label: string; value: number; active: string; inactive: string }[] = [
  { label: "Layak",           value: 1, active: "bg-emerald-500 text-white border-emerald-500", inactive: "bg-white text-muted-foreground border-border hover:border-emerald-400" },
  { label: "Dipertimbangkan", value: 2, active: "bg-amber-500 text-white border-amber-500",    inactive: "bg-white text-muted-foreground border-border hover:border-amber-400"   },
  { label: "Tidak Layak",     value: 3, active: "bg-red-500 text-white border-red-500",        inactive: "bg-white text-muted-foreground border-border hover:border-red-400"     },
];

const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

function ReadField({ label, value }: { label: string; value?: string | number | null }) {
  const display = value !== undefined && value !== null && value !== 0 && value !== ""
    ? String(value) : "—";
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

function Badge({ value, type }: { value: string; type: "validasi" | "rekomendasi" | "status" }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>;

  if (type === "validasi") {
    const ada = value === "Ada";
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
        ada ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
      }`}>{value}</span>
    );
  }

  if (type === "rekomendasi") {
    const lower = value.toLowerCase();
    if (lower.includes("layak") && !lower.includes("tidak") && !lower.includes("pertimbang")) {
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{value}</span>;
    }
    if (lower.includes("pertimbang") || lower.includes("dipertimbangkan")) {
      return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">{value}</span>;
    }
    return <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">{value}</span>;
  }

  return <span className="text-xs text-on-surface">{value}</span>;
}

export default function EvaluasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [kandidat, setKandidat] = useState<Kandidat | null>(null);
  const [loading, setLoading]   = useState(true);
  const [form, setForm] = useState({ aset: "", hasil_akhir: null as number | null, alasan: "", pewawancara: "" });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/evaluasi/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setKandidat(d);
        setForm({
          aset:        d.aset        ?? "",
          hasil_akhir: d.hasil_akhir ?? null,
          alasan:      d.alasan      ?? "",
          pewawancara: d.pewawancara ?? "",
        });
      })
      .catch(() => setKandidat(null))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/evaluasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Memuat data...
      </div>
    );
  }

  if (!kandidat) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-on-surface mb-2">Data tidak ditemukan</p>
          <Link href="/admin/evaluasi" className="text-sm text-primary hover:underline">← Kembali ke daftar</Link>
        </div>
      </div>
    );
  }

  const isComplete = !!(form.hasil_akhir && form.pewawancara);
  const hasWawancaraData = !!(kandidat.kepemilikan_rumah || kandidat.kondisi_rumah || kandidat.validasi_kks);

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">›</span>
          <Link href="/admin/evaluasi" className="text-muted-foreground hover:text-primary transition-colors">Evaluasi</Link>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary truncate max-w-[200px]">{kandidat.nama}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/evaluasi" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
              <ArrowLeft size={13} /> Kembali ke daftar
            </Link>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">{kandidat.nama}</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm font-mono">{kandidat.no_pendaftaran_kipk}</p>
              <span className="text-slate-300">·</span>
              <p className="text-muted-foreground text-sm">{kandidat.prodi}</p>
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
              kandidat.pewawancara_data ? "bg-white border-border" : "bg-slate-50 border-dashed border-slate-200"
            }`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center">
                <UserCheck size={14} className="text-primary" />
              </div>
              <h3 className="font-bold text-on-surface text-sm">Pewawancara Bertugas</h3>
            </div>
            {kandidat.pewawancara_data ? (
              <div className="space-y-2">
                <p className="font-semibold text-on-surface text-sm">{kandidat.pewawancara_data.nama}</p>
                <p className="text-xs text-muted-foreground">{kandidat.pewawancara_data.email}</p>
                {kandidat.pewawancara_data.sso_id && (
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                    {kandidat.pewawancara_data.sso_id}
                  </span>
                )}
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

          {/* Status evaluasi */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`rounded-2xl border p-4 ${isComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2">
              {isComplete ? <CheckCircle2 size={15} className="text-emerald-600" /> : <AlertCircle size={15} className="text-amber-600" />}
              <p className={`text-xs font-bold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
                {isComplete ? "Evaluasi Lengkap" : "Evaluasi Belum Selesai"}
              </p>
            </div>
            <p className={`text-[11px] mt-1 ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
              {isComplete ? "Hasil akhir dan pewawancara sudah terisi." : "Hasil akhir dan nama pewawancara wajib diisi."}
            </p>
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
                  <ReadField label="No. Pendaftaran KIPK"         value={kandidat.no_pendaftaran_kipk} />
                  <ReadField label="No. Bantuan Sosial"           value={kandidat.no_bantuan_sosial}   />
                  <ReadField label="NIK"                          value={kandidat.nik}                 />
                  <ReadField label="No. Kartu Keluarga"           value={kandidat.no_kartu_keluarga}   />
                  <ReadField label="NISN"                         value={kandidat.nisn}                />
                  <ReadField label="Nama Sekolah Asal"            value={kandidat.asal_sekolah}        />
                  <ReadField label="Kota/Kabupaten Asal"          value={kandidat.kab_kota}            />
                  <ReadField label="Provinsi Asal"                value={kandidat.provinsi}            />
                  <ReadField label="Alamat Domisili"              value={kandidat.alamat}              />
                  <ReadField label="No. HP Aktif"                 value={kandidat.no_hp}               />
                  <ReadField label="Alamat Email Aktif"           value={kandidat.email}               />
                  <ReadField label="Koordinat / Link GPS"         value={kandidat.koordinat}           />
                </div>
              </div>

              {/* Status Sosial */}
              <div>
                <SectionHeader title="Status Sosial Ekonomi" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Status DTSEN"                  value={kandidat.status_dtsen}       />
                  <ReadField label="Jumlah Tanggungan"             value={kandidat.jumlah_tanggungan}  />
                  <ReadField label="Jumlah Orang Tinggal di Rumah" value={kandidat.jumlah_orang_rumah} />
                </div>
              </div>

              {/* Pekerjaan & Penghasilan */}
              <div>
                <SectionHeader title="Pekerjaan & Penghasilan" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Pekerjaan Bapak/Wali"   value={kandidat.pekerjaan_ayah}  />
                  <ReadField label="Penghasilan Bapak/Wali" value={kandidat.penghasilan_ayah ? fmt.format(kandidat.penghasilan_ayah) : "—"} />
                  <ReadField label="Pekerjaan Ibu"          value={kandidat.pekerjaan_ibu}   />
                  <ReadField label="Penghasilan Ibu"        value={kandidat.penghasilan_ibu  ? fmt.format(kandidat.penghasilan_ibu)  : "—"} />
                </div>
              </div>

              {/* Kondisi Rumah */}
              <div>
                <SectionHeader title="Kondisi Tempat Tinggal (Klaim Mahasiswa)" />
                <div className="grid grid-cols-2 gap-3">
                  <ReadField label="Jumlah PBB Terakhir Dibayar" value={kandidat.pbb ? fmt.format(kandidat.pbb) : "—"} />
                  <ReadField label="Daya Listrik"                value={kandidat.daya_listrik} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Kolom kanan (2/3) ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Data yang diisi pewawancara — READ ONLY untuk admin */}
          {hasWawancaraData && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-slate-50 rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={14} className="text-muted-foreground" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Data Hasil Wawancara — Diisi Pewawancara
                </p>
              </div>

              <div className="space-y-5">
                {/* Validasi Dokumen */}
                <div>
                  <SectionHeader title="Validasi Dokumen" />
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

                {/* Validasi Penghasilan */}
                <div>
                  <SectionHeader title="Validasi Penghasilan" />
                  <div className="grid grid-cols-2 gap-4">
                    <ReadField label="Ket. Pekerjaan Ayah"    value={kandidat.ket_pekerjaan_ayah} />
                    <ReadField label="Penghasilan Ayah/bln"   value={kandidat.ket_penghasilan_ayah} />
                    <ReadField label="Ket. Pekerjaan Ibu"     value={kandidat.ket_pekerjaan_ibu} />
                    <ReadField label="Penghasilan Ibu/bln"    value={kandidat.ket_penghasilan_ibu} />
                    <ReadField label="Penghasilan Lain/bln"   value={kandidat.penghasilan_lain ? fmt.format(kandidat.penghasilan_lain) : null} />
                    <ReadField label="Tanggungan Sebenarnya"  value={kandidat.jml_tanggungan_sebenarnya} />
                    <ReadField label="Orang Tinggal di Rumah" value={kandidat.validasi_orang_rumah} />
                    <ReadField label="Sosial Media"           value={kandidat.sosial_media} />
                  </div>
                </div>

                {/* Kondisi Tempat Tinggal */}
                <div>
                  <SectionHeader title="Kondisi Tempat Tinggal" icon={Home} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <ReadField label="Kepemilikan Rumah"  value={kandidat.kepemilikan_rumah} />
                    <ReadField label="Tahun Perolehan"    value={kandidat.tahun_perolehan} />
                    <ReadField label="Luas Tanah (m²)"    value={kandidat.luas_tanah} />
                    <ReadField label="Luas Bangunan (m²)" value={kandidat.luas_bangunan} />
                    <ReadField label="Sumber Air"         value={kandidat.sumber_air} />
                    <ReadField label="MCK"                value={kandidat.mck} />
                    <ReadField label="Jarak Pusat Kota"   value={kandidat.jarak_pusat_kota ? `${kandidat.jarak_pusat_kota} km` : null} />
                    <ReadField label="Kondisi Rumah"      value={kandidat.kondisi_rumah} />
                  </div>
                  {kandidat.aset && (
                    <div className="mt-3">
                      <ReadField label="Aset yang Dimiliki" value={kandidat.aset} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Form admin — bisa edit rekomendasi & catatan */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <ClipboardList size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">Hasil & Rekomendasi</h3>
                <p className="text-[11px] text-muted-foreground">Admin dapat mengedit hasil wawancara</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Hasil Akhir <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
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
                    Dipilih: <span className="font-semibold">{HASIL_AKHIR_OPTIONS.find((o) => o.value === form.hasil_akhir)?.label}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Alasan / Catatan</label>
                <textarea value={form.alasan}
                  onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
                  placeholder="Catatan hasil wawancara, kondisi ekonomi, dll."
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
              <h3 className="font-bold text-on-surface">Hapus Evaluasi?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Data evaluasi wawancara <span className="font-semibold text-on-surface">{kandidat.nama}</span> akan direset.
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
