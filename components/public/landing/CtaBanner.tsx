import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="py-12 px-8 mb-24">
      <div className="max-w-7xl mx-auto rounded-2xl overflow-hidden relative bg-primary shadow-xl shadow-primary/20">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')" }}
        />
        <div className="relative z-10 px-12 py-16 lg:py-24 text-center">
          <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-8 tracking-tight">
            Mahasiswa KIPK UNDIP?
          </h2>
          <p className="text-white/80 text-lg mb-4 max-w-2xl mx-auto">
            Akses dashboard personal SAKTI menggunakan email SSO UNDIP Anda untuk mengelola notifikasi Monev dan berinteraksi dengan Asisten Virtual.
          </p>
          <p className="text-white/50 text-sm mb-10 max-w-xl mx-auto">
            Akses login hanya tersedia bagi mahasiswa aktif penerima KIPK yang telah terdaftar di sistem Dirmawa UNDIP.
          </p>
          <Link href="/mahasiswa/dashboard">
            <button className="bg-white text-primary px-10 py-4 rounded-md font-bold text-lg hover:bg-slate-100 transition-all">
              Masuk ke Dashboard SAKTI
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
