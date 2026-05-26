"use client";

import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";
import type { MahasiswaEvaluasi } from "@/schemas";
import {
  RadioGroupBoolean,
  RadioGroupNumeric,
  RadioGroupString,
  TextInput,
  NumberInput,
  SectionHeader,
} from "@/components/pewawancara/form";

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

export const OPT_HASIL_AKHIR = [
  { label: "Layak", value: 1, text_db: "Layak", color: "bg-emerald-500 text-white border-emerald-500" },
  { label: "Dipertimbangkan", value: 2, text_db: "Dipertimbangkan", color: "bg-amber-500 text-white border-amber-500" },
  { label: "Tidak Layak", value: 3, text_db: "Tidak Layak", color: "bg-destructive text-white border-destructive" },
];

interface FormObservasiProps {
  form: Partial<MahasiswaEvaluasi>;
  onChange: (key: keyof MahasiswaEvaluasi) => (v: any) => void;
}

export function FormObservasi({ form, onChange }: FormObservasiProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-tertiary rounded-3xl border border-border shadow-xl shadow-muted/40 p-6 md:p-8"
    >
      <div className="flex items-center gap-2 mb-6 bg-primary text-primary-foreground w-fit px-4 py-2 rounded-xl shadow-sm">
        <ClipboardList size={18} />
        <p className="text-xs font-bold uppercase tracking-wider">
          Laporan Hasil Observasi Lapangan
        </p>
      </div>

      <div className="space-y-10">
        {/* Validasi Dokumen */}
        <div>
          <SectionHeader title="Dokumen KKS/KIP/SKTM" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-muted/50 p-6 rounded-2xl border border-border">
            <RadioGroupBoolean label="Kepemilikan KKS" value={form.validasi_kks ?? null} onChange={onChange("validasi_kks")} />
            <RadioGroupBoolean label="Kepemilikan KIP" value={form.validasi_kip ?? null} onChange={onChange("validasi_kip")} />
            <RadioGroupBoolean label="Kepemilikan SKTM" value={form.validasi_sktm ?? null} onChange={onChange("validasi_sktm")} />
          </div>
        </div>

        {/* Kondisi Ekonomi */}
        <div>
          <SectionHeader title="Kondisi Ekonomi Riil" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <TextInput label="Pekerjaan Ayah (Riil)" value={form.ket_pekerjaan_ayah ?? ""} onChange={onChange("ket_pekerjaan_ayah")} />
            <NumberInput label="Penghasilan Ayah/bulan (Rp)" value={form.ket_penghasilan_ayah ?? null} onChange={onChange("ket_penghasilan_ayah")} />
            <TextInput label="Pekerjaan Ibu (Riil)" value={form.ket_pekerjaan_ibu ?? ""} onChange={onChange("ket_pekerjaan_ibu")} />
            <NumberInput label="Penghasilan Ibu/bulan (Rp)" value={form.ket_penghasilan_ibu ?? null} onChange={onChange("ket_penghasilan_ibu")} />
            <div className="sm:col-span-2">
              <NumberInput label="Total Penghasilan Lainnya/bulan (Rp)" value={form.penghasilan_lain ?? null} onChange={onChange("penghasilan_lain")} />
            </div>
            <NumberInput label="Jml. Tanggungan Keluarga (Riil)" value={form.jml_tanggungan_sebenarnya ?? null} onChange={onChange("jml_tanggungan_sebenarnya")} />
            <NumberInput label="Jml. Orang Tinggal Serumah (Riil)" value={form.validasi_orang_rumah ?? null} onChange={onChange("validasi_orang_rumah")} />
          </div>
        </div>

        {/* Kondisi Rumah */}
        <div>
          <SectionHeader title="Aset & Kondisi Tempat Tinggal" />
          <div className="space-y-6">
            <RadioGroupNumeric label="Status Kepemilikan Rumah" value={form.kepemilikan_rumah ?? null} options={OPT_KEPEMILIKAN} onChange={onChange("kepemilikan_rumah")} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <TextInput label="Tahun Perolehan/Dibangun" value={form.tahun_perolehan ?? ""} onChange={onChange("tahun_perolehan")} placeholder="Contoh: 2005" />
              <NumberInput label="Luas Tanah (m²)" value={form.luas_tanah ?? null} onChange={onChange("luas_tanah")} />
              <NumberInput label="Luas Bangunan (m²)" value={form.luas_bangunan ?? null} onChange={onChange("luas_bangunan")} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/50 rounded-2xl border border-border">
              <RadioGroupNumeric label="Sumber Air Bersih Utama" value={form.sumber_air ?? null} options={OPT_SUMBER_AIR} onChange={onChange("sumber_air")} />
              <RadioGroupNumeric label="Fasilitas MCK" value={form.mck ?? null} options={OPT_MCK} onChange={onChange("mck")} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <TextInput label="Aset Bernilai (Motor, TV, Kulkas, dll)" value={form.aset ?? ""} onChange={onChange("aset")} placeholder="Pisahkan dengan koma..." />
              <TextInput label="Akun Media Sosial Utama (IG/TikTok)" value={form.sosial_media ?? ""} onChange={onChange("sosial_media")} placeholder="@username" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
              <RadioGroupString label="Kesimpulan Kondisi Fisik Rumah" value={form.kondisi_rumah ?? null} options={OPT_KONDISI} onChange={onChange("kondisi_rumah")} />
              <NumberInput label="Jarak ke Pusat Kota/Kecamatan (KM)" value={form.jarak_pusat_kota ?? null} onChange={onChange("jarak_pusat_kota")} />
            </div>
          </div>
        </div>

        {/* Rekomendasi Akhir */}
        <div className="pt-6 border-t-2 border-dashed border-border">
          <SectionHeader title="Rekomendasi Akhir Pewawancara" />
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-3">
                Rekomendasi: <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-3 flex-wrap">
                {OPT_HASIL_AKHIR.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange("hasil_akhir" as any)(opt.value)}
                    className={`px-6 py-3.5 rounded-2xl text-sm font-bold border-2 transition-all ${
                      form.hasil_akhir === opt.value
                        ? `${opt.color} shadow-md`
                        : "bg-tertiary text-muted-foreground border-border hover:border-secondary/50 hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                Catatan / Alasan Rekomendasi
              </label>
              <textarea
                value={form.alasan ?? ""}
                onChange={(e) => onChange("alasan")(e.target.value)}
                rows={4}
                placeholder="Jelaskan secara singkat alasan Anda memilih rekomendasi di atas..."
                className="w-full px-5 py-4 text-sm font-medium border border-border rounded-2xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted resize-none transition-all placeholder:font-normal"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
