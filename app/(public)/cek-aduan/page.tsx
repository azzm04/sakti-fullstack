import FormCekAduan from "@/components/aduan/FormCekAduan";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function CekAduanPage() {
  return (
    <div className="bg-[#F8FAFC] font-body text-slate-800 selection:bg-primary/20 selection:text-primary">
      {/* Menggunakan Navbar dari Landing Page */}
      <Navbar />

      <main className="min-h-screen pb-20">
        {/* Warna background disamakan dengan Navbar (#001349) */}
        <div className="bg-[#001349] pt-16 pb-32 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto mt-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-4">
              Lacak Status Pengaduan
            </h1>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
              Masukkan kode resi yang Anda dapatkan saat mengirimkan formulir untuk melihat perkembangan status laporan Anda secara real-time.
            </p>
          </div>
        </div>

        {/* Memanggil Komponen Pencarian */}
        <FormCekAduan />
      </main>

      {/* Menggunakan Footer dari Landing Page */}
      <Footer />
    </div>
  );
}