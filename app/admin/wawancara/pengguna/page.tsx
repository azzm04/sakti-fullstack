"use client";

import { useState } from "react";
import { GraduationCap, UserCheck } from "lucide-react";
import DaftarPewawancara from "@/components/admin/wawancara/DaftarPewawancara";
import DaftarMahasiswa from "@/components/admin/wawancara/DaftarMahasiswa";
import WawancaraPageShell from "@/components/admin/wawancara/shared/WawancaraPageShell";
import type { DaftarPenggunaRole } from "@/types/wawancara";

const ROLE_TABS: { key: DaftarPenggunaRole; label: string; icon: React.ElementType }[] = [
  { key: "pewawancara", label: "Pewawancara", icon: UserCheck },
  { key: "mahasiswa", label: "Mahasiswa KIP-K", icon: GraduationCap },
];

export default function DaftarPenggunaPage() {
  const [role, setRole] = useState<DaftarPenggunaRole>("pewawancara");

  return (
    <WawancaraPageShell
      title="Daftar Pengguna"
      description="Kelola akun pewawancara dan mahasiswa KIP-K"
    >
      <div className="flex gap-1 p-1 bg-admin-surface-soft border border-admin-border-soft rounded-xl w-fit mb-5">
        {ROLE_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setRole(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 ${
              role === key
                ? "bg-white text-admin-text shadow-sm border border-admin-border-soft"
                : "text-admin-text-4 hover:text-admin-text-2"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
      {role === "pewawancara" ? <DaftarPewawancara /> : <DaftarMahasiswa />}
    </WawancaraPageShell>
  );
}
