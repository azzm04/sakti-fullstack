import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { MotionConfig } from "framer-motion";
import "./globals.css";
import { cn } from "@/lib/utils";
import LenisScroll from "@/components/layout/LenisScroll";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
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
    <html lang="id" className={inter.variable} suppressHydrationWarning>
      <body
        className={cn(inter.className, "min-h-full flex flex-col font-body")}
        suppressHydrationWarning
      >
        <LenisScroll />
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
