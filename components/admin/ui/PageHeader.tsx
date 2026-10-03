"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { findActiveAdminNavItem } from "@/lib/admin-nav";

interface PageHeaderProps {
  /** Override label breadcrumb setelah "Dashboard ›". Kalau tidak diisi, diturunkan otomatis dari menu sidebar sesuai halaman aktif. */
  breadcrumb?: string;
  title: string;
  description?: ReactNode;
  right?: ReactNode;
}

/**
 * Header standar setiap halaman admin: breadcrumb "Dashboard › Menu",
 * judul besar, deskripsi, dan aksi opsional di kanan.
 * Padding horizontal sama dengan konten halaman (px-4 sm:px-[30px]).
 */
export function PageHeader({
  breadcrumb,
  title,
  description,
  right,
}: PageHeaderProps) {
  const pathname = usePathname();
  const activeNavItem = findActiveAdminNavItem(pathname);
  const crumb = breadcrumb ?? activeNavItem?.label;
  const isDashboard = activeNavItem?.href === "/admin" && !breadcrumb;

  return (
    <header className="px-4 sm:px-[30px] pt-6 md:pt-10">
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-admin-text-5"
      >
        {isDashboard || !crumb ? (
          <span className="text-admin-accent"></span>
        ) : (
          <>
            <span>Admin</span>
            <span aria-hidden="true">›</span>
            <span className="text-admin-accent">{crumb}</span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-admin-heading text-3xl font-extrabold tracking-tight text-admin-text">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-admin-text-4">{description}</p>
          )}
        </div>
        {right && (
          <div className="flex flex-wrap items-center gap-[9px]">{right}</div>
        )}
      </div>
    </header>
  );
}
