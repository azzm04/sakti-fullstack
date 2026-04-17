"use client";

import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";

export default function PewawancaraDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-extrabold text-primary font-headline mb-1">Dashboard Pewawancara</h1>
      <p className="text-muted-foreground text-sm mb-8">Isi data hasil wawancara mahasiswa KIPK.</p>

      <Link href="/pewawancara/mahasiswa"
        className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
        <ClipboardList size={16} /> Lihat Daftar Mahasiswa <ArrowRight size={14} />
      </Link>
    </div>
  );
}
