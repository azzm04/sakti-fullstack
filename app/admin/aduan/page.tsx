import AduanDashboard from "@/components/admin/aduan/AduanDashboard";

export default function AdminAduanPage() {
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Sederhana Halaman Admin */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dasbor Pengaduan</h1>
          <p className="text-sm text-slate-500 mt-1">Sistem Informasi Pengaduan KIP-K Terpadu</p>
        </div>

        {/* Memanggil Komponen Tabel */}
        <AduanDashboard />
        
      </div>
    </div>
  );
}