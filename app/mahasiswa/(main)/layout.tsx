"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarMahasiswa from "@/components/layout/SidebarMahasiswa";
import Topbar from "@/components/mahasiswa/Topbar";
import { UserProvider } from "@/components/providers/UserProvider";

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  // Validasi role mahasiswa
  useEffect(() => {
    const checkMahasiswaRole = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        
        if (!res.ok || data.role !== "MAHASISWA_KIPK") {
          // Redirect ke halaman berdasarkan role
          const roleRoutes: Record<string, string> = {
            PEWAWANCARA: "/pewawancara",
            ADMIN_DIRMAWA: "/admin",
          };
          const redirectPath = roleRoutes[data.role] || "/login";
          router.push(redirectPath);
          return;
        }
      } catch {
        router.push("/login");
      }
    };

    checkMahasiswaRole();
  }, [router]);

  return (
    <UserProvider>
      <div className="flex min-h-screen bg-slate-50 font-body text-slate-600">
        <SidebarMahasiswa />
        <main className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="p-4 sm:p-6 md:p-8">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
