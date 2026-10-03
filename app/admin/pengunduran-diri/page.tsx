import { PengunduranDiriAdminClient } from "@/components/admin/pengunduran-diri/PengunduranDiriAdminClient";
import { PageHeader } from "@/components/admin/ui/PageHeader";

export const metadata = {
  title: "Pengunduran Diri KIP-K | SAKTI Admin",
};

export default function AdminPengunduranDiriPage() {
  return (
    <div className="min-h-screen bg-admin-bg">
      <PageHeader
        title="Pengunduran Diri KIP-K"
        description="Kelola pengajuan pengunduran diri mahasiswa penerima KIP-Kuliah."
      />
      <div className="px-4 sm:px-[30px] pt-6 pb-[34px]">
        <PengunduranDiriAdminClient />
      </div>
    </div>
  );
}
