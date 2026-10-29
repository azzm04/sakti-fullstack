"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/admin/ui/PageHeader";

const TABS = [
  { href: "/admin/manajemen-seleksi/import", label: "Import Data" },
  {
    href: "/admin/manajemen-seleksi/urutan-pewawancara",
    label: "Urutan Pewawancara",
  },
  { href: "/admin/manajemen-seleksi/evaluasi", label: "Evaluasi" },
  { href: "/admin/manajemen-seleksi/filtering", label: "Filtering Kuota" },
  { href: "/admin/manajemen-seleksi/hasil-akhir", label: "Hasil Akhir" },
  { href: "/admin/manajemen-seleksi/analitik", label: "Analitik" },
];

export default function ManajemenSeleksiLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        title="Manajemen Seleksi"
        description="Kelola seluruh alur seleksi kandidat KIP-K, dari import data hingga hasil akhir."
      />

      <div className="px-4 pt-6 sm:px-[30px]">
        <nav
          aria-label="Menu Manajemen Seleksi"
          className="flex gap-6 overflow-x-auto border-b border-[#E2E8F0]"
        >
          {TABS.map((tab) => {
            const active =
              pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "shrink-0 whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors",
                  active
                    ? "border-[#000352] text-[#000352]"
                    : "border-transparent text-[#64748B] hover:text-[#000352]",
                ].join(" ")}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </div>
  );
}
