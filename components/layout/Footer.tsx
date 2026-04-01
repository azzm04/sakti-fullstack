import Link from "next/link";
import { Mail, Phone, Share2 } from "lucide-react"; // Menggunakan Lucide Icon bawaan shadcn

export default function Footer() {
  const currentYear = new Date().getFullYear(); // Otomatis mengikuti tahun saat ini

  return (
    <footer className="bg-[#0056B3] border-t border-white opacity-70 mt-12">
      <div className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        <div className="space-y-4">
          <div className="text-lg font-bold text-white">Platform SAKTI</div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Sistem Aplikasi Terintegrasi untuk masa depan pendidikan Indonesia yang lebih inklusif dan merata.
          </p>
        </div>

        <div>
          <h4 className="text-lg font-bold text-white mb-4">Tautan Penting</h4>
          <ul className="space-y-2">
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Beasiswa Unggulan
              </Link>
            </li>
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Afirmasi ADik
              </Link>
            </li>
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Portal SNPMB
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold text-white mb-4">Bantuan</h4>
          <ul className="space-y-2">
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Kebijakan Privasi
              </Link>
            </li>
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Syarat &amp; Ketentuan
              </Link>
            </li>
            <li>
              <Link href="#" className="text-slate-300 hover:text-white transition-colors">
                Pusat Bantuan
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-bold text-white mb-4">Kontak Kami</h4>
          <p className="text-sm text-white">
            Gedung C Lt. 13, Kemendikbudristek<br />
            Jakarta Pusat, 10270
          </p>
          <div className="flex gap-4 mt-4">
            <Mail className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <Phone className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
            <Share2 className="w-5 h-5 text-slate-400 cursor-pointer hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </div>

      <div className="border-t border-white py-6 text-center text-sm text-white">
        © {currentYear} Puslapdik Kemendikbudristek & Tim Capstone SAKTI. All Rights Reserved.
      </div>
    </footer>
  );
}