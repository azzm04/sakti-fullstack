import FormPengaduan from "@/components/aduan/FormPengaduan";

export default function LayananAduanPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-900 selection:text-white pb-20">
      {/* Hero Section (Matching Landing Page Navy Blue) */}
      <div className="bg-[#0b1727] pt-16 pb-32 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
            Layanan Pengaduan KIP-Kuliah
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
            Platform resmi pelaporan evaluasi dan pengaduan indikasi ketidaktepatan sasaran 
            atau penyalahgunaan beasiswa KIP-Kuliah di lingkungan kampus. Identitas pelapor dijamin kerahasiaannya.
          </p>
        </div>
      </div>

      {/* Memanggil Komponen Formulir */}
      <FormPengaduan />
      
    </div>
  );
}