import { ShieldAlert, Megaphone } from "lucide-react";

export default function WhistleblowerSection() {
  return (
    <section className="py-24 px-8 bg-white">
      <div className="max-w-5xl mx-auto bg-primary/40 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-secondary/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-destructive/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/20 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-destructive/20 rounded-3xl flex items-center justify-center border border-destructive/30 shadow-inner mb-2">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white font-headline tracking-tight">
            Kawal Transparansi <span className="text-primary">KIP-Kuliah</span>
          </h2>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Mengetahui ada penerima KIP-Kuliah yang gaya hidupnya tergolong keluarga mampu atau tidak tepat sasaran?
            Bantu kami menjaga keadilan program ini.{" "}
            <span className="text-secondary font-bold bg-white px-3 py-1 rounded-md mt-4 inline-block shadow-sm">
              Identitas pelapor dijamin 100% rahasia.
            </span>
          </p>
          <div className="pt-6">
            <a href="https://forms.gle/contohlinkgform" target="_blank" rel="noopener noreferrer" className="inline-flex">
              <button className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-primary/90 transition-all active:scale-95 border border-white/10">
                <Megaphone className="w-5 h-5" />
                Buat Laporan Penyelewengan
              </button>
            </a>
          </div>
          <p className="text-xs text-white/50 max-w-lg mx-auto mt-6">
            *Laporan palsu atau fitnah dapat dikenakan sanksi akademik. Pastikan Anda memiliki bukti yang cukup sebelum melapor.
          </p>
        </div>
      </div>
    </section>
  );
}
