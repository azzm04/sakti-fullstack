import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function WelcomeBanner() {
  return (
    <section className="relative overflow-hidden rounded-4xl">
      <BackgroundGradient className="rounded-4xl p-10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 text-white">
            Penerima KIP-K 2024
          </span>
          <h2 className="font-headline text-4xl font-black mb-4 leading-tight text-white">
            Selamat Datang di Portal SAKTI, Andi!
          </h2>
          <p className="text-blue-100 text-lg leading-relaxed opacity-90">
            Pantau status pencairan, lengkapi laporan Monev, dan pastikan seluruh administrasi Anda tetap terkelola dengan baik.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 transform translate-x-12">
          <span className="material-symbols-outlined text-[20rem] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
        </div>
      </BackgroundGradient>
    </section>
  );
}
