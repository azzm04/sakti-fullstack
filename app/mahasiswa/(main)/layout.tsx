"use client"

import SidebarMahasiswa from "@/components/layout/SidebarMahasiswa";
import Topbar from "@/components/mahasiswa/Topbar";
import { UserProvider } from "@/components/providers/UserProvider";

export default function MahasiswaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
