import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap } from "lucide-react";
import { CanvasText } from "@/components/ui/canvas-text";

export default function HeroSection() {
  return (
    <section className="relative min-h-[87.5vh] flex items-center overflow-hidden px-8 lg:px-24">
      <div className="grid lg:grid-cols-2 gap-16 items-center w-full max-w-7xl mx-auto">
        <div className="z-10">
          <span className="inline-block px-4 py-1.5 mb-6 text-[11px] font-bold tracking-[0.15em] text-[#743B00] bg-[#743B00]/10 rounded-full uppercase">
            Puslapdik Kemendikbudristek
          </span>
          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.2] text-primary mb-8 tracking-tight">
            Sistem Informasi Akademik dan
            <div className="block w-full mt-2">
              <CanvasText
                text="KIP-Kuliah Terpadu"
                className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white"
                backgroundClassName="bg-white"
                colors={[
                  "rgba(0, 86, 179, 1)", "rgba(0, 86, 179, 0.9)", "rgba(0, 86, 179, 0.8)",
                  "rgba(0, 86, 179, 0.7)", "rgba(0, 86, 179, 0.6)", "rgba(0, 86, 179, 0.5)",
                  "rgba(0, 86, 179, 0.4)", "rgba(0, 86, 179, 0.3)", "rgba(0, 86, 179, 0.2)",
                  "rgba(0, 86, 179, 0.1)",
                ]}
                lineGap={4}
                animationDuration={20}
              />
            </div>
          </h1>
          <p className="text-lg text-secondary leading-relaxed mb-10 max-w-xl">
            Wujudkan mimpi pendidikan tinggi Anda melalui integrasi data akademik yang cerdas dan bantuan biaya pendidikan nasional yang tepat sasaran.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/student">
              <button className="bg-primary text-white px-8 py-4 rounded-md font-bold text-base hover:bg-primary/90 transition-all flex items-center gap-3">
                Daftar Sekarang <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <button className="bg-transparent border border-secondary text-secondary px-8 py-4 rounded-md font-bold text-base hover:bg-secondary/5 transition-all">
              Pelajari Alur
            </button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -top-20 -right-20 w-[37.5rem] h-[37.5rem] bg-primary/5 rounded-full blur-3xl" />
          <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700">
            <Image
              className="w-full object-cover"
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
              alt="Mahasiswa belajar"
              width={600}
              height={600}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-white font-bold text-xl">952k+ Mahasiswa</div>
                  <div className="text-white/80 text-sm">Telah terbantu di tahun 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
