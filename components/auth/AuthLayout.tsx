"use client";

import { type ReactNode } from "react";
import { AuthBackground } from "./AuthBackground";

interface AuthLayoutProps {
  /** Kolom kiri (branding) */
  branding: ReactNode;
  /** Kolom kanan (form card) */
  children: ReactNode;
}

/**
 * Layout utama halaman auth dengan background, grid 2 kolom (branding + form).
 */
export function AuthLayout({ branding, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden font-body">
      <AuthBackground />

      <div className="relative z-20 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 px-6 sm:px-8 py-12 items-center min-h-screen">
        {branding}
        {children}
      </div>
    </div>
  );
}
