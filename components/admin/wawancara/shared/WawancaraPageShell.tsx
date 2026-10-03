import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/ui/PageHeader";

interface WawancaraPageShellProps {
  title: string;
  description: string;
  children: ReactNode;
}

/** Kerangka halaman Wawancara: header standar admin + konten, dipakai Daftar Pengguna & Urutan Pewawancara. */
export default function WawancaraPageShell({
  title,
  description,
  children,
}: WawancaraPageShellProps) {
  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text">
      <PageHeader title={title} description={description} />
      <div className="px-4 sm:px-[30px] pt-6 pb-[34px]">{children}</div>
    </div>
  );
}
