import FormCekAduan from "@/components/aduan/FormCekAduan";

export default function CekAduanPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-900 selection:text-white pb-20">
      {/* Hero Section */}
      <div className="bg-[#0b1727] pt-16 pb-32 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Lacak Status Pengaduan
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Masukkan kode resi yang Anda dapatkan saat mengirimkan formulir untuk melihat perkembangan status laporan Anda secara real-time.
          </p>
        </div>
      </div>

      {/* Memanggil Komponen Pencarian */}
      <FormCekAduan />
      
    </div>
  );
}