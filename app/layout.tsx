import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Setup Font Inter untuk teks biasa (Sangat mirip Cerebri Sans)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body", 
});

// Setup Font Manrope untuk Judul/Headline agar tebal dan tegas
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
});

export const metadata: Metadata = {
  title: "SAKTI - Platform KIP-K Terpadu",
  description: "Sistem Informasi Akademik dan KIP-Kuliah Terpadu",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      // Memasukkan variabel font dan memastikan antialiased agar font terlihat halus
      className={cn(
        "h-full antialiased", 
        inter.variable, 
        manrope.variable
      )}
    >
      {/* Hapus "font-mono", ganti dengan "font-body" 
        (Sesuai dengan variabel Tailwind Sakti Nusantara yang sudah kita buat) 
      */}
      <body className="min-h-full flex flex-col font-body">
        {children}
      </body>
    </html>
  );
}