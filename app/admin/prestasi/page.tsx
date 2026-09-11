import { PrestasiAdminClient } from "@/components/admin/prestasi/PrestasiAdminClient";

export const metadata = {
  title: "Data Prestasi Mahasiswa | SAKTI Admin",
};

export default function AdminPrestasiPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <div className="max-w-6xl mx-auto pt-10 pb-16 px-4 sm:px-6 space-y-6">
        <div className="pb-6 border-b border-[#E5EAF0]">
          <h1 className="font-roboto font-bold text-[28px] md:text-[30px] text-[#0F172A] leading-tight tracking-tight">
            Data Prestasi Mahasiswa
          </h1>
          <p className="font-roboto text-[14px] md:text-[15px] text-[#64748B] mt-2 leading-relaxed">
            Arsip dan rekap prestasi mahasiswa penerima KIP-Kuliah.
          </p>
        </div>
        <PrestasiAdminClient />
      </div>
    </div>
  );
}
