"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, CheckCircle2, Loader2, Eye } from "lucide-react";

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
  skor_total: number;
  ranking: number;
  created_at: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

const OPT_ADA_TIDAK   = ["Ada", "Tidak Ada"];
const OPT_KEPEMILIKAN = ["Milik Sendiri", "Sewa", "Tidak Memiliki", "Menumpang"];
const OPT_SUMBER_AIR  = ["Sumur", "PDAM", "Sungai/Mata Air"];
const OPT_MCK         = ["Berbagi Pakai", "Milik Sendiri"];
const OPT_KONDISI     = ["Layak Menerima Beasiswa", "Tidak Layak Beasiswa"];
const OPT_REKOMENDASI = ["Diusulkan Menerima KIPK", "Tidak Diusulkan"];

const fmt = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 });

// ── Read-only field ──────────────────────────────────────
function ReadField({ label, value }: { label: string; value?: string | number | null }) {
  const display = value && value !== 0 ? String(value) : "—";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm text-on-surface font-medium">{display}</p>
    </div>
  );
}

// ── Editable components ──────────────────────────────────
function RadioGroup({ label, value, options, onChange, required }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              value === opt ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 transition-all"
      />
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      <input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 transition-all"
      />
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="pb-2 border-b border-border mb-4">
      <h3 className="text-sm font-bold text-on-surface">{title}</h3>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function PewawancaraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [kandidat, setKandidat]     = useState<Kandidat | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [form, setForm]             = useState<Partial<Kandidat>>({});

  useEffect(() => {
    fetch(`/api/admin/evaluasi/${id}`)
      .then((r) => r.json())
      .then((d) => { setKandidat(d); setForm(d); })
      .catch(() => setKandidat(null))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (key: keyof Kandidat) => (v: string | number) =>
    setForm((f) => ({ ...f, [key]: v }));

  async function handleSave() {
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/admin/evaluasi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          validasi_kks: form.validasi_kks, validasi_kip: form.validasi_kip,
          validasi_sktm: form.validasi_sktm, sosial_media: form.sosial_media,
          ket_pekerjaan_ayah: form.ket_pekerjaan_ayah, ket_penghasilan_ayah: form.ket_penghasilan_ayah,
          ket_pekerjaan_ibu: form.ket_pekerjaan_ibu, ket_penghasilan_ibu: form.ket_penghasilan_ibu,
          penghasilan_lain: form.penghasilan_lain,
          jml_tanggungan_sebenarnya: form.jml_tanggungan_sebenarnya,
          validasi_orang_rumah: form.validasi_orang_rumah,
          kepemilikan_rumah: form.kepemilikan_rumah, tahun_perolehan: form.tahun_perolehan,
          luas_tanah: form.luas_tanah, luas_bangunan: form.luas_bangunan,
          sumber_air: form.sumber_air, mck: form.mck,
          aset: form.aset, kondisi_rumah: form.kondisi_rumah,
          jarak_pusat_kota: form.jarak_pusat_kota,
          rekomendasi: form.rekomendasi, alasan: form.alasan, pewawancara: form.pewawancara,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground">
      <Loader2 size={16} className="animate-spin" /> Memuat...
    </div>
  );

  if (!kandidat) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="font-bold mb-2">Data tidak ditemukan</p>
        <Link href="/pewawancara/mahasiswa" className="text-sm text-primary hover:underline">← Kembali</Link>
      </div>
    </div>
  );

  const SaveBtn = ({ className = "" }: { className?: string }) => (
    <button onClick={handleSave} disabled={saveStatus === "saving"}
      className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-all disabled:opacity-60 ${
        saveStatus === "saved" ? "bg-emerald-500 text-white" :
        saveStatus === "error" ? "bg-red-500 text-white" :
        "bg-primary text-white hover:bg-primary/90"
      } ${className}`}>
      {saveStatus === "saving"
        ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        : saveStatus === "saved" ? <CheckCircle2 size={15} /> : <Save size={15} />}
      {saveStatus === "saving" ? "Menyimpan..." : saveStatus === "saved" ? "Tersimpan" : "Simpan Evaluasi"}
    </button>
  );

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-16">

      {/* Header */}
      <div className="mb-6">
        <Link href="/pewawancara/mahasiswa"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mb-3 transition-colors">
          <ArrowLeft size={13} /> Kembali ke daftar
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-primary font-headline">{kandidat.nama}</h1>
            <p className="text-muted-foreground text-sm font-mono">{kandidat.no_pendaftaran_kipk}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{kandidat.prodi}</p>
          </div>
          <SaveBtn />
        </div>
      </div>

      {/* ── BAGIAN 1: Data dari mahasiswa (READ-ONLY) ── */}
      <div className="bg-slate-50 rounded-2xl border border-border p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye size={15} className="text-muted-foreground" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Data Mahasiswa — Hanya Baca (diisi oleh calon penerima)
          </p>
        </div>

        <div className="space-y-5">
          {/* Identitas */}
          <div>
            <SectionHeader title="Identitas" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ReadField label="No. Pendaftaran KIPK"                value={kandidat.no_pendaftaran_kipk} />
              <ReadField label="Nomor Bantuan Sosial (KIP/KKS/SKTM)" value={kandidat.no_bantuan_sosial}   />
              <ReadField label="NIK"                                  value={kandidat.nik}                 />
              <ReadField label="No. Kartu Keluarga"                   value={kandidat.no_kartu_keluarga}   />
              <ReadField label="NISN"                                 value={kandidat.nisn}                />
              <ReadField label="Nama Sekolah Asal"                    value={kandidat.asal_sekolah}        />
              <ReadField label="Kota/Kabupaten Asal"                  value={kandidat.kab_kota}            />
              <ReadField label="Provinsi Asal"                        value={kandidat.provinsi}            />
              <ReadField label="Alamat Domisili"                      value={kandidat.alamat}              />
              <ReadField label="No. HP Aktif"                         value={kandidat.no_hp}               />
              <ReadField label="Alamat Email Aktif"                   value={kandidat.email}               />
              <ReadField label="Koordinat / Link GPS"                 value={kandidat.koordinat}           />
            </div>
          </div>

          {/* Status Sosial */}
          <div>
            <SectionHeader title="Status Sosial Ekonomi" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ReadField label="Status DTSEN"                   value={kandidat.status_dtsen}       />
              <ReadField label="Jumlah Tanggungan"              value={kandidat.jumlah_tanggungan}  />
              <ReadField label="Jumlah Orang Tinggal di Rumah"  value={kandidat.jumlah_orang_rumah} />
            </div>
          </div>

          {/* Pekerjaan & Penghasilan */}
          <div>
            <SectionHeader title="Pekerjaan & Penghasilan" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ReadField label="Pekerjaan Bapak/Wali"   value={kandidat.pekerjaan_ayah}  />
              <ReadField label="Penghasilan Bapak/Wali" value={kandidat.penghasilan_ayah ? fmt.format(kandidat.penghasilan_ayah) : "—"} />
              <ReadField label="Pekerjaan Ibu"          value={kandidat.pekerjaan_ibu}   />
              <ReadField label="Penghasilan Ibu"        value={kandidat.penghasilan_ibu  ? fmt.format(kandidat.penghasilan_ibu)  : "—"} />
            </div>
          </div>

          {/* Kondisi Rumah dari mahasiswa */}
          <div>
            <SectionHeader title="Kondisi Tempat Tinggal (Klaim Mahasiswa)" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ReadField label="Jumlah PBB Terakhir Dibayar" value={kandidat.pbb ? fmt.format(kandidat.pbb) : "—"} />
              <ReadField label="Daya Listrik"                value={kandidat.daya_listrik}                      />
            </div>
          </div>
        </div>
      </div>

      {/* ── BAGIAN 2: Form validasi pewawancara (EDITABLE) ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <p className="text-xs font-bold text-primary uppercase tracking-wider">
            Form Validasi — Diisi Pewawancara
          </p>
        </div>

        {/* Validasi Dokumen */}
        <div>
          <SectionHeader title="Validasi Dokumen" subtitle="Cocokkan dengan dokumen fisik yang dibawa mahasiswa" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RadioGroup label="Validasi KKS"  value={form.validasi_kks  ?? ""} options={OPT_ADA_TIDAK} onChange={set("validasi_kks")}  />
            <RadioGroup label="Validasi KIP"  value={form.validasi_kip  ?? ""} options={OPT_ADA_TIDAK} onChange={set("validasi_kip")}  />
            <RadioGroup label="Validasi SKTM" value={form.validasi_sktm ?? ""} options={OPT_ADA_TIDAK} onChange={set("validasi_sktm")} />
          </div>
        </div>

        {/* Validasi Penghasilan */}
        <div>
          <SectionHeader title="Validasi Penghasilan" subtitle="Verifikasi keterangan penghasilan yang disampaikan mahasiswa" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput   label="Validasi Ket. Pekerjaan Ayah"        value={form.ket_pekerjaan_ayah   ?? ""} onChange={set("ket_pekerjaan_ayah")}   />
            <TextInput   label="Validasi Ket. Penghasilan Ayah/bln"  value={form.ket_penghasilan_ayah ?? ""} onChange={set("ket_penghasilan_ayah")} />
            <TextInput   label="Validasi Ket. Pekerjaan Ibu"         value={form.ket_pekerjaan_ibu    ?? ""} onChange={set("ket_pekerjaan_ibu")}    />
            <TextInput   label="Validasi Ket. Penghasilan Ibu/bln"   value={form.ket_penghasilan_ibu  ?? ""} onChange={set("ket_penghasilan_ibu")}  />
            <NumberInput label="Validasi Penghasilan Lain/bln (Rp)"  value={form.penghasilan_lain ?? 0}     onChange={set("penghasilan_lain")}      />
            <NumberInput label="Validasi Jumlah Tanggungan Sebenarnya"  value={form.jml_tanggungan_sebenarnya ?? 0} onChange={set("jml_tanggungan_sebenarnya")} />
            <NumberInput label="Validasi Jumlah Orang Tinggal di Rumah" value={form.validasi_orang_rumah      ?? 0} onChange={set("validasi_orang_rumah")}      />
          </div>
        </div>

        {/* Kondisi Tempat Tinggal */}
        <div>
          <SectionHeader title="Kondisi Tempat Tinggal" subtitle="Hasil observasi langsung saat kunjungan rumah" />
          <div className="space-y-4">
            <RadioGroup label="Kepemilikan Rumah" value={form.kepemilikan_rumah ?? ""} options={OPT_KEPEMILIKAN} onChange={set("kepemilikan_rumah")} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextInput   label="Tahun Perolehan Rumah" value={form.tahun_perolehan ?? ""} onChange={set("tahun_perolehan")} placeholder="2010" />
              <NumberInput label="Luas Tanah (m²)"       value={form.luas_tanah    ?? 0}   onChange={set("luas_tanah")}    />
              <NumberInput label="Luas Bangunan (m²)"    value={form.luas_bangunan ?? 0}   onChange={set("luas_bangunan")} />
            </div>
            <RadioGroup label="Sumber Air Minum" value={form.sumber_air    ?? ""} options={OPT_SUMBER_AIR} onChange={set("sumber_air")}    />
            <RadioGroup label="MCK"              value={form.mck           ?? ""} options={OPT_MCK}        onChange={set("mck")}           />
            <TextInput   label="Aset yang Dimiliki (Elektronik/Kendaraan)" value={form.aset ?? ""} onChange={set("aset")} placeholder="TV, motor, kulkas, dll." />
            <RadioGroup  label="Kondisi Rumah"   value={form.kondisi_rumah ?? ""} options={OPT_KONDISI}    onChange={set("kondisi_rumah")} />
            <NumberInput label="Jarak Pusat Kota (KM)" value={form.jarak_pusat_kota ?? 0} onChange={set("jarak_pusat_kota")} />
          </div>
        </div>

        {/* Hasil Wawancara */}
        <div>
          <SectionHeader title="Hasil Wawancara" subtitle="Kesimpulan dan rekomendasi pewawancara" />
          <div className="space-y-4">
            <RadioGroup label="Rekomendasi" value={form.rekomendasi ?? ""} options={OPT_REKOMENDASI} onChange={set("rekomendasi")} required />
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Alasan</label>
              <textarea value={form.alasan ?? ""} onChange={(e) => set("alasan")(e.target.value)}
                rows={3} placeholder="Catatan hasil wawancara..."
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-slate-50 resize-none transition-all"
              />
            </div>
            <TextInput label="Nama Pewawancara" value={form.pewawancara ?? ""} onChange={set("pewawancara")} placeholder="Dr. Budi Santoso" required />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <SaveBtn />
      </div>
    </div>
  );
}
