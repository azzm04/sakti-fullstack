import Link from "next/link";
import { Mail, Share2, Phone } from "lucide-react";

const LINKS_PENTING = [
  { label: "KIPK Kemdiktisaintek", href: "https://kip-kuliah.kemdiktisaintek.go.id/" },
  { label: "Kemahasiswaan", href: "https://kemahasiswaan.undip.ac.id/" },
  { label: "PMB Undip", href: "https://admission.undip.ac.id/ " },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary mt-12 select-none">
      <div className="max-w-7xl mx-auto px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <p className="text-lg font-headline font-bold text-white tracking-tight">
            Platform SAKTI
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            Platform pendukung tata kelola beasiswa KIP-Kuliah dilengkapi
            Asisten Virtual AI, sistem pelaporan evaluasi, dan kanal pengaduan
            resmi.
          </p>
        </div>

        {/* Tautan Penting */}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
            Tautan Penting
          </p>
          <ul className="space-y-2.5">
            {LINKS_PENTING.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  target="_blank"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kontak */}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">
            Kontak Kami
          </p>
          <p className="text-sm text-white/80 leading-relaxed">
            Direktorat Kemahasiswaan dan Alumni (DIRMAWA)
            <br />
            Gedung SA-MWA Lt. 1, Tembalang, Kota Semarang
            <br />
          </p>
          
          {/* Tombol Interaktif (Email, Telepon, Share) */}
          <div className="flex gap-3 mt-5">
            
            {/* Tombol Kirim Email Otomatis */}
            <Link href="mailto:kemahasiswaan@live.undip.ac.id" passHref>
              <button
                title="Kirim Email ke Kemahasiswaan"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Mail className="w-4 h-4 text-white" />
              </button>
            </Link>

            {/* Tombol Telepon Otomatis */}
            <Link href="tel:+62247460020" passHref>
              <button
                title="Telepon Dirmawa (024-7460020)"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Phone className="w-4 h-4 text-white" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {currentYear} Direktorat Kemahasiswaan dan Alumni & Tim Capstone
        SAKTI. All Rights Reserved.
      </div>
    </footer>
  );
}
