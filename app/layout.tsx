import type { Metadata } from "next";
import { Inter, Manrope, Montserrat } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import LenisScroll from "@/components/layout/LenisScroll";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body", 
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-headline",
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '700'], // Optional: Specify weights to reduce bundle size
  variable: '--font-montserrat', // Optional: For CSS variables
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
      lang="id" className={montserrat.className}
    >
      <body className="min-h-full flex flex-col font-body">
        <LenisScroll />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}