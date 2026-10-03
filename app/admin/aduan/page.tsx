import AduanDashboard from "@/components/admin/aduan/AduanDashboard";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export default function AdminAduanPage() {
  return (
    <div className="min-h-screen bg-admin-bg">
      <PageHeader
        title="Dasbor Pengaduan"
        description="Sistem Informasi Pengaduan KIP-K Terpadu"
      />
      <div className="px-4 sm:px-[30px] pt-6 pb-[34px]">
        <AduanDashboard />
      </div>
    </div>
  );
}
