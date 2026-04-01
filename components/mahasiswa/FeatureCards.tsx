import Link from "next/link";
import { IconRobot, IconGavel, IconBolt } from "@tabler/icons-react";

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Telegram Card */}
      <div className="bg-surface-container-lowest rounded-4xl p-8 flex flex-col shadow-lg border border-outline-variant/10">
        <div className="flex items-start justify-between mb-8">
          <div className="p-4 bg-blue-50 text-blue-800 rounded-2xl"><IconRobot className="w-10 h-10" /></div>
          <span className="px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed-variant rounded-full text-xs font-bold">Rekomendasi</span>
        </div>
        <h3 className="font-headline text-2xl font-bold text-primary mb-3">Aktivasi Bot Telegram</h3>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          Dapatkan notifikasi real-time mengenai batas waktu pelaporan Monev, status pencairan dana, dan pengumuman penting langsung di ponsel Anda.
        </p>
        <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/mahasiswa/aktivasi-bot" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95">
              <IconBolt className="w-5 h-5" /> Aktivasi Sekarang
            </button>
          </Link>
          <span className="text-xs text-on-surface-variant font-medium">Gratis selamanya untuk mahasiswa.</span>
        </div>
      </div>

      {/* Whistleblower Card */}
      <div className="bg-surface-container-lowest rounded-4xl p-8 flex flex-col shadow-lg border border-outline-variant/10">
        <div className="flex items-start justify-between mb-8">
          <div className="p-4 bg-error-container text-error rounded-2xl"><IconGavel className="w-10 h-10" /></div>
          <span className="px-4 py-1.5 bg-surface-container-high text-on-surface-variant rounded-full text-xs font-bold">Layanan Pengaduan</span>
        </div>
        <h3 className="font-headline text-2xl font-bold text-primary mb-3">Pelaporan Penyalahgunaan Dana</h3>
        <p className="text-on-surface-variant leading-relaxed mb-8">
          Temukan indikasi pemotongan dana atau pungutan liar? Laporkan secara anonim. Identitas Anda akan dilindungi sepenuhnya.
        </p>
        <div className="mt-auto pt-6">
          <a href="https://forms.google.com/whistleblower" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
            <span>Isi Formulir Pengaduan</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </div>
    </div>
  );
}
