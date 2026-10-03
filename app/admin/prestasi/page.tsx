import { PrestasiAdminClient } from "@/components/admin/prestasi/PrestasiAdminClient";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata = {
  title: "Data Prestasi Mahasiswa | SAKTI Admin",
};

export default function AdminPrestasiPage() {
  return (
    <div className="min-h-screen bg-admin-bg">
      <PageHeader
        title="Data Prestasi Mahasiswa"
        description="Arsip dan rekap prestasi mahasiswa penerima KIP-Kuliah."
      />
      <div className="px-4 sm:px-[30px] pt-6 pb-[34px]">
        <PrestasiAdminClient />
      </div>
    </div>
  );
}
