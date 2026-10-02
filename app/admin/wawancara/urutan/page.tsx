"use client";

import SesiWAR from "@/components/admin/wawancara/SesiWAR";
import WawancaraPageShell from "@/components/admin/wawancara/shared/WawancaraPageShell";

export default function UrutanPewawancaraPage() {
  return (
    <WawancaraPageShell
      title="Urutan Pewawancara"
      description="Kelola sesi dan Pemilihan Urutan Pewawancara"
    >
      <SesiWAR />
    </WawancaraPageShell>
  );
}
