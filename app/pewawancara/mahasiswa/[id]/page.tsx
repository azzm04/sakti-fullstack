"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { MahasiswaEvaluasi } from "@/schemas";
import {
  DetailHeader,
  ProfilReadOnly,
  FormObservasi,
  OPT_HASIL_AKHIR,
  SaveButton,
} from "@/components/pewawancara/detail";
import type { SaveStatus } from "@/components/pewawancara/detail";

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

  // ── Data Fetching ──
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

        setForm({ ...d, hasil_akhir: mappedHasil });
      })
      .catch(() => setKandidat(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (key: keyof MahasiswaEvaluasi) => (v: any) =>
    setForm((f) => ({ ...f, [key]: v }));

  // ── Save Handler ──
  async function handleSave() {
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
    const textRekomendasi = OPT_HASIL_AKHIR.find((o) => o.value === form.hasil_akhir)?.text_db || null;

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
        toast.error("Gagal menyimpan", { description: errData.error || "Terjadi kesalahan." });
        throw new Error();
      }

      setSaveStatus("saved");
      toast.success("Data Hasil Wawancara berhasil disimpan");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  // ── Loading & Error States ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-3 text-muted-foreground">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm font-medium">Memuat data form...</p>
      </div>
    );
  }

  if (!kandidat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <ClipboardList size={32} className="text-muted-foreground" />
        </div>
        <p className="text-xl font-bold text-foreground mb-2">Data Tidak Ditemukan</p>
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          Mohon pastikan URL sudah benar atau kandidat belum ditarik oleh sistem.
        </p>
        <Link
          href="/pewawancara/mahasiswa"
          className="px-6 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-2xl shadow-sm hover:bg-primary/90 transition-colors"
        >
          Kembali ke Daftar
        </Link>
      </div>
    );
  }

  // ── Main Render ──
  return (
    <div className="min-h-screen bg-background pb-24 pt-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <DetailHeader kandidat={kandidat} saveStatus={saveStatus} onSave={handleSave} />

        <div className="grid grid-cols-1 gap-8">
          <ProfilReadOnly kandidat={kandidat} />
          <FormObservasi form={form} onChange={handleChange} />
        </div>

        {/* Mobile Fixed Save Bar */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-tertiary/80 backdrop-blur-md border-t border-border md:hidden z-50">
          <SaveButton status={saveStatus} onSave={handleSave} className="w-full justify-center h-12" />
        </div>
      </div>
    </div>
  );
}
