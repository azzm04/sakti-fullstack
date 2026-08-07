"use client";

import { useState } from "react";
import { Users, Zap } from "lucide-react";
import DaftarPewawancara from "@/components/admin/wawancara/DaftarPewawancara";
import SesiWAR from "@/components/admin/wawancara/SesiWAR";
import type { WawancaraTab } from "@/types/wawancara";

const TABS: { key: WawancaraTab; label: string; icon: React.ElementType }[] = [
  { key: "daftar", label: "Daftar Pengguna", icon: Users },
  { key: "sesi", label: "Pemilihan Urutan Pewawancara", icon: Zap },
];

export default function PewawancaraPage() {
  const [tab, setTab] = useState<WawancaraTab>("daftar");

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f7f9fb]">
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        <span>Dashboard</span>
        <span>›</span>
        <span className="text-primary">Wawancara</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">
          Wawancara
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola akun pengguna dan Pemilihan Urutan Pewawancara
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit mb-6 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "daftar" ? <DaftarPewawancara /> : <SesiWAR />}
    </div>
  );
}
