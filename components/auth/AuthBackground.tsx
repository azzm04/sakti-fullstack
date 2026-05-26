"use client";

import Image from "next/image";

/**
 * Background overlay yang digunakan di semua halaman auth (login, verify-otp, verify-kandidat).
 * Menggunakan gambar widyapuraya dengan overlay warna primary.
 */
export function AuthBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <div className="absolute inset-0 bg-primary/65 z-10 mix-blend-multiply" />
      <div className="absolute inset-0 bg-secondary/40 z-10" />
      <Image
        src="/widyapuraya.jpeg"
        alt="Background Undip"
        fill
        priority
        className="object-cover object-center"
      />
    </div>
  );
}
