import type { ReactNode } from "react";

interface WawancaraPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** Kerangka halaman Wawancara: breadcrumb + judul, dipakai Daftar Pengguna & Urutan Pewawancara. */
export default function WawancaraPageShell({
  title,
  description,
  children,
}: WawancaraPageShellProps) {
  return (
    <div className="p-6 md:p-10 min-h-screen bg-admin-bg font-admin-body text-admin-text">
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-admin-text-5 mb-4">
        <span>Dashboard</span>
        <span>›</span>
        <span className="text-admin-accent">{title}</span>
      </nav>

      <div className="mb-6">
        <h1 className="font-admin-heading text-3xl font-extrabold text-admin-text tracking-tight">
          {title}
        </h1>
        <p className="text-admin-text-4 text-sm mt-1">{description}</p>
      </div>

      {children}
    </div>
  );
}
