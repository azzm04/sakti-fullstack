"use client";

import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { MahasiswaEvaluasi } from "@/schemas";
import { ReadField, SectionHeader } from "@/components/pewawancara/form";

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function formatRupiahAman(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return fmt.format(num);
}

interface ProfilReadOnlyProps {
  kandidat: MahasiswaEvaluasi;
}

export function ProfilReadOnly({ kandidat }: ProfilReadOnlyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-tertiary rounded-3xl border border-border shadow-sm p-6 md:p-8"
    >
      <div className="flex items-center gap-2 mb-6 bg-primary/10 text-primary w-fit px-4 py-2 rounded-xl">
        <Eye size={18} />
        <p className="text-xs font-bold uppercase tracking-wider">
          Informasi Awal (Berdasarkan REGON)
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <SectionHeader title="Profil Pendaftar" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 bg-muted/50 p-5 rounded-2xl border border-border">
            <ReadField label="No Bantuan Sosial" value={kandidat.no_bantuan_sosial} />
            <ReadField label="NIK" value={kandidat.nik} />
            <ReadField label="NISN" value={kandidat.nisn} />
            <ReadField label="No. Kartu Keluarga" value={kandidat.no_kartu_keluarga} />
            <ReadField label="Asal Sekolah" value={kandidat.asal_sekolah} />
            <ReadField label="Kota/Kabupaten Asal" value={kandidat.kab_kota} />
            <ReadField label="No. HP Aktif" value={kandidat.no_hp} />
            <ReadField label="Alamat Email" value={kandidat.email} />
            <ReadField label="Koordinat GPS" value={kandidat.koordinat} />
            <div className="sm:col-span-2 md:col-span-3">
              <ReadField label="Alamat Lengkap" value={kandidat.alamat} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SectionHeader title="Status & Tanggungan" />
            <div className="space-y-5 bg-muted/50 p-5 rounded-2xl border border-border h-full">
              <ReadField label="Status DTSEN" value={kandidat.status_dtsen} />
              <div className="grid grid-cols-2 gap-4">
                <ReadField label="Tanggungan" value={kandidat.jumlah_tanggungan} />
                <ReadField label="Orang di Rumah" value={kandidat.jumlah_orang_rumah} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ReadField label="PBB Tahunan" value={kandidat.pbb ? fmt.format(kandidat.pbb) : "—"} />
                <ReadField label="Daya Listrik" value={kandidat.daya_listrik} />
              </div>
            </div>
          </div>
          <div>
            <SectionHeader title="Pekerjaan & Penghasilan" />
            <div className="space-y-5 bg-muted/50 p-5 rounded-2xl border border-border h-full">
              <ReadField label="Pekerjaan Ayah" value={kandidat.pekerjaan_ayah} />
              <ReadField label="Penghasilan Ayah" value={formatRupiahAman(kandidat.penghasilan_ayah)} />
              <ReadField label="Pekerjaan Ibu" value={kandidat.pekerjaan_ibu} />
              <ReadField label="Penghasilan Ibu" value={formatRupiahAman(kandidat.penghasilan_ibu)} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
