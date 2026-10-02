"use client";

import { GraduationCap, Plus, UserCheck } from "lucide-react";

export type AkunRole = "PEWAWANCARA" | "MAHASISWA_KIPK";

const ROLE_META: Record<AkunRole, { label: string; icon: React.ElementType }> = {
  PEWAWANCARA: { label: "Pewawancara", icon: UserCheck },
  MAHASISWA_KIPK: { label: "Mahasiswa KIP-K", icon: GraduationCap },
};

interface RoleSectionProps {
  /** Role yang dimiliki akun ini. */
  roles: string[];
  /** Role yang sedang dikelola di tab aktif — ditandai "tab ini". */
  current: AkunRole;
  /** Tombol tambah role (mis. "Jadikan Pewawancara") — muncul kalau diisi. */
  addAction?: { label: string; onClick: () => void };
}

/**
 * Daftar role akun di dalam modal edit. Menggantikan badge "Juga: …" di tabel,
 * supaya status multi-role cukup terlihat saat akun dibuka.
 */
export default function RoleSection({ roles, current, addAction }: RoleSectionProps) {
  const known = (Object.keys(ROLE_META) as AkunRole[]).filter(
    (r) => r === current || roles.includes(r),
  );
  const multiRole = known.length > 1;

  return (
    <div className="rounded-xl border border-admin-border-soft bg-admin-surface-soft p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-admin-text-4">Role akun</p>
        {multiRole && (
          <span className="text-[11px] font-medium text-admin-text-5">{known.length} role</span>
        )}
      </div>

      <ul className="space-y-1.5">
        {known.map((role) => {
          const { label, icon: Icon } = ROLE_META[role];
          return (
            <li
              key={role}
              className="flex items-center gap-2.5 rounded-lg border border-admin-border-soft bg-white px-3 py-2"
            >
              <Icon size={14} className="shrink-0 text-admin-accent" />
              <span className="flex-1 text-[13px] font-medium text-admin-text">{label}</span>
              {role === current && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-admin-text-5">
                  Tab ini
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {addAction && (
        <button
          type="button"
          onClick={addAction.onClick}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-admin-border px-3 py-2 text-[12px] font-semibold text-admin-accent transition-colors hover:border-admin-accent hover:bg-white"
        >
          <Plus size={13} /> {addAction.label}
        </button>
      )}

      {multiRole && (
        <p className="mt-2 text-[11px] leading-4 text-admin-text-5">
          Akun ini terdaftar di lebih dari satu role. Menghapus di sini hanya mencabut role{" "}
          {ROLE_META[current].label}.
        </p>
      )}
    </div>
  );
}
