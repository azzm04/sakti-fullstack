"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, Save, Trash2, User, Phone, Mail,
  BookOpen, ClipboardList, AlertCircle, CheckCircle2, Loader2,
} from "lucide-react";

interface Kandidat {
  id: string;
  import_batch_id: number;
  no: number;
  // Data Awal
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
  latitude: number;
  longitude: number;
  // Validasi — diisi pewawancara
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
  // Scoring
  skor_total: number;
  ranking: number;
  created_at: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";
const REKOMENDASI_OPTIONS = ["Layak", "Dipertimbangkan", "Tidak Layak"];

export default function EvaluasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const router  = useRouter();

  const [kandidat, setKandidat]     = useState<Kandidat | null>(null);
  const [loading, setLoading]       = useState(true);
  const [form, setForm] = useState({ aset: "", rekomendasi: "", alasan: "", pewawancara: "" });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [showDelete, setShowDelete] = useState(false);

  // Fetch data kandidat
  useEffect(() => {
    fetch(`/api/admin/evaluasi/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setKandidat(d);
        setForm({
          aset:        d.aset        ?? "",
          rekomendasi: d.rekomendasi ?? "",
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

  const isComplete = form.rekomendasi && form.pewawancara;

  return (
    <div className="min-h-screen bg-surface p-6 md:p-10">

      {/* Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-muted-foreground">Dashboard</span>
          <span className="text-muted-foreground">›</span>
          <Link href="/admin/evaluasi" className="text-muted-foreground hover:text-primary transition-colors">
            Evaluasi Wawancara
          </Link>
          <span className="text-muted-foreground">›</span>
          <span className="text-primary truncate max-w-[200px]">{kandidat.nama}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/admin/evaluasi"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-2 transition-colors">
              <ArrowLeft size={13} /> Kembali ke daftar
            </Link>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">{kandidat.nama}</h2>
            <p className="text-muted-foreground text-sm mt-1 font-mono">{kandidat.no_pendaftaran_kipk}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Info mahasiswa (read-only) */}
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <User size={16} className="text-primary" />
              </div>
              <h3 className="font-bold text-on-surface text-sm">Data Mahasiswa</h3>
            </div>
            <dl className="space-y-3">
              {[
                { icon: BookOpen, label: "Prodi",  value: kandidat.prodi  },
                { icon: User,     label: "NIK",    value: kandidat.nik    },
                { icon: Phone,    label: "No. HP", value: kandidat.no_hp  },
                { icon: Mail,     label: "Email",  value: kandidat.email  },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon size={13} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-xs text-on-surface mt-0.5 break-all">{value || "—"}</p>
                  </div>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className={`rounded-2xl border p-4 ${isComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
            <div className="flex items-center gap-2">
              {isComplete
                ? <CheckCircle2 size={15} className="text-emerald-600" />
                : <AlertCircle size={15} className="text-amber-600" />}
              <p className={`text-xs font-bold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
                {isComplete ? "Evaluasi Lengkap" : "Evaluasi Belum Selesai"}
              </p>
            </div>
            <p className={`text-[11px] mt-1 ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
              {isComplete ? "Semua kolom wawancara sudah terisi." : "Rekomendasi dan nama pewawancara wajib diisi."}
            </p>
          </motion.div>
        </div>

        {/* Form evaluasi (editable) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                <ClipboardList size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-on-surface text-sm">Hasil Wawancara</h3>
                <p className="text-[11px] text-muted-foreground">Kolom ini diisi oleh pewawancara — admin dapat mengedit</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nama Pewawancara <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.pewawancara}
                  onChange={(e) => setForm((f) => ({ ...f, pewawancara: e.target.value }))}
                  placeholder="Dr. Budi Santoso, M.Kom."
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Rekomendasi <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {REKOMENDASI_OPTIONS.map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setForm((f) => ({ ...f, rekomendasi: opt }))}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        form.rekomendasi === opt
                          ? opt === "Layak" ? "bg-emerald-500 text-white border-emerald-500"
                          : opt === "Dipertimbangkan" ? "bg-amber-500 text-white border-amber-500"
                          : "bg-red-500 text-white border-red-500"
                          : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Aset yang Dimiliki</label>
                <input type="text" value={form.aset}
                  onChange={(e) => setForm((f) => ({ ...f, aset: e.target.value }))}
                  placeholder="TV, motor, kulkas, AC, dll."
                  className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 transition-all"
                />
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
          </div>
        </motion.div>
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
              Data evaluasi wawancara <span className="font-semibold text-on-surface">{kandidat.nama}</span> akan direset. Tindakan ini tidak dapat dibatalkan.
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
