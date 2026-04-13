import { GraduationCap, ExternalLink } from "lucide-react";

export default function RegistrationSection() {
  return (
    <section className="py-24 px-8 bg-white">
      <div className="max-w-5xl mx-auto bg-primary/90 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-secondary/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/30 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center border border-white/30 shadow-inner mb-2">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-headline tracking-tight">
            Pendaftaran KIP-Kuliah
          </h2>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Bagi calon mahasiswa yang memenuhi kualifikasi, silakan lakukan
            pendaftaran KIP-Kuliah melalui portal resmi Kementerian.{" "}
            <span className="text-primary font-bold bg-white px-3 py-1 rounded-md mt-4 inline-block shadow-sm">
              Pastikan data yang diisi valid dan sesuai kondisi sebenarnya.
            </span>
          </p>
          <div className="pt-6">
            <a
              href="https://kip-kuliah.kemdiktisaintek.go.id/siswa/pendaftaran/baru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <button className="flex items-center gap-3 bg-white text-primary px-10 py-4 rounded-xl font-bold text-lg shadow-xl mouse-pointer hover:bg-slate-50 transition-all active:scale-95 border border-white/10">
                <ExternalLink className="w-5 h-5 mouse-pointer" />
                Daftar di Portal Resmi KIP-K
              </button>
            </a>
          </div>
          <p className="text-xs text-white/70 max-w-lg mx-auto mt-6 leading-relaxed">
            *Bagi calon penerima KIP Kuliah yang dinyatakan tidak lolos
            penetapan, diwajibkan membayar Uang Kuliah Tunggal (UKT) dengan
            besaran yang akan ditetapkan kemudian.
          </p>
        </div>
      </div>
    </section>
  );
}
