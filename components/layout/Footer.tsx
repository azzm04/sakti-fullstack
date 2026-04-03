import Link from "next/link";
import { Mail, Share2 } from "lucide-react";

const LINKS_PENTING = [
  { label: "Beasiswa Unggulan", href: "#" },
  { label: "Afirmasi ADik", href: "#" },
  { label: "Portal SNPMB", href: "#" },
];

const LINKS_BANTUAN = [
  { label: "Kebijakan Privasi", href: "#" },
  { label: "Syarat & Ketentuan", href: "#" },
  { label: "Pusat Bantuan", href: "#" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary mt-12 select-none">
      <div className="max-w-7xl mx-auto px-8 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <p className="text-lg font-headline font-bold text-white tracking-tight">Platform SAKTI</p>
          <p className="text-sm text-white/70 leading-relaxed">
            Sistem Asisten KIPK Terpadu dan Interaktif. Menghadirkan layanan informasi cerdas dan
            analitik data untuk mendukung tata kelola beasiswa KIPK di Universitas Diponegoro.
          </p>
        </div>

        {/* Tautan Penting */}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Tautan Penting</p>
          <ul className="space-y-2.5">
            {LINKS_PENTING.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-white/80 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bantuan */}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Bantuan</p>
          <ul className="space-y-2.5">
            {LINKS_BANTUAN.map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="text-sm text-white/80 hover:text-white transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Kontak */}
        <div>
          <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Kontak Kami</p>
          <p className="text-sm text-white/80 leading-relaxed">
            Gedung C Lt. 13, Kemendikbudristek<br />
            Jakarta Pusat, 10270
          </p>
          <div className="flex gap-3 mt-5">
            <button
              title="Email"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Mail className="w-4 h-4 text-white" />
            </button>
            <button
              title="Bagikan"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/50">
        © {currentYear} Puslapdik Kemendikbudristek & Tim Capstone SAKTI. All Rights Reserved.
      </div>
    </footer>
  );
}
