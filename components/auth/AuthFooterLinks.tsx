"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { type ReactNode } from "react";

interface AuthFooterLinksProps {
  /** Tampilkan link beranda */
  showHome?: boolean;
  /** Konten tambahan di sebelah kanan separator */
  children?: ReactNode;
}

/**
 * Footer links yang konsisten di halaman auth.
 */
export function AuthFooterLinks({ showHome = true, children }: AuthFooterLinksProps) {
  return (
    <div className="pt-6 border-t border-border flex flex-row items-center justify-center gap-3 text-[13px] text-muted-foreground">
      {showHome && (
        <>
          <Link
            href="/"
            className="hover:text-primary transition-colors flex items-center gap-1.5 font-semibold text-primary"
          >
            <Home className="w-4 h-4" /> Beranda
          </Link>
          {children && <span className="text-border">|</span>}
        </>
      )}
      {children}
    </div>
  );
}
