"use client";

import Image from "next/image";

interface AuthBrandingProps {
  title: string;
  subtitle: string;
  description: string;
}

/**
 * Kolom kiri branding yang muncul di desktop pada halaman auth.
 * Menampilkan logo, judul, dan deskripsi.
 */
export function AuthBranding({ title, subtitle, description }: AuthBrandingProps) {
  return (
    <div className="hidden lg:flex flex-col text-white pr-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="relative w-20 h-20 bg-tertiary rounded-full overflow-hidden">
          <Image src="/LOGO_SAKTI.png" alt="Logo SAKTI" fill className="object-contain p-2" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-wider uppercase font-headline">
            Sistem SAKTI
          </h1>
          <p className="text-sm text-tertiary/70">Universitas Diponegoro</p>
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight font-headline">
        {title}
      </h2>

      <p className="text-tertiary/80 leading-relaxed text-sm max-w-md text-justify">
        {description}
      </p>
    </div>
  );
}
