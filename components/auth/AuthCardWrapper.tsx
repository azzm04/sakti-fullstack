"use client";

import { type ReactNode } from "react";

interface AuthCardWrapperProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  children: ReactNode;
}

/**
 * Wrapper card form untuk halaman auth.
 * Menampilkan icon, judul, subtitle, dan konten form.
 */
export function AuthCardWrapper({ icon, title, subtitle, children }: AuthCardWrapperProps) {
  return (
    <div className="w-full flex justify-center lg:justify-end">
      <div className="bg-tertiary w-full max-w-[420px] rounded-xl shadow-2xl p-8 sm:p-10 border border-tertiary/20">
        {/* Header Form */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 text-primary mb-4">
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-foreground font-headline">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        </div>

        <div className="space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}
