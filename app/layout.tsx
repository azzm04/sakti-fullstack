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
      className={cn(
        "h-full antialiased", 
        inter.variable, 
        manrope.variable
      )}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col font-body">
        {children}
      </body>
    </html>
  );
}