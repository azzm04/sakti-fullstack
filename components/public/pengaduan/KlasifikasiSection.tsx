'use client';

import { motion } from 'framer-motion';

const CARDS = [
  {
    icon: 'shopping_bag',
    iconBg: 'bg-blue-50',
    iconColor: 'text-primary',
    title: 'Gaya Hidup Mewah',
    desc: 'Penerima beasiswa yang secara nyata menunjukkan gaya hidup yang tidak sesuai dengan kriteria keterbatasan ekonomi, seperti kepemilikan barang mewah atau aktivitas konsumtif berlebih.',
    tags: ['Mismatch Ekonomi', 'Integritas Data'],
    wide: true,
  },
  {
    icon: 'description',
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    title: 'Pemalsuan Data',
    desc: 'Manipulasi dokumen keterangan tidak mampu, data penghasilan orang tua, atau dokumen pendukung lainnya saat proses pendaftaran.',
    tags: [],
    wide: false,
  },
  {
    icon: 'school',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    title: 'Ketidaksesuaian Akademik',
    desc: 'Pelanggaran terkait status kemahasiswaan, seperti sudah lulus namun masih menerima atau tidak lagi aktif berkuliah.',
    tags: [],
    wide: false,
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function KlasifikasiSection() {
  return (
    <section className="py-24 px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <span className="text-slate-400 text-[11px] font-bold tracking-widest uppercase mb-2 block">
          KLASIFIKASI PELAPORAN
        </span>
        <h2 className="text-3xl font-headline font-extrabold text-primary">Apa yang Harus Dilaporkan?</h2>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {CARDS.map((card) => (
          <motion.div
            key={card.title}
            variants={item}
            className={`bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${card.wide ? 'md:col-span-2' : ''}`}
          >
            <div className={`${card.iconBg} p-3 rounded-2xl w-fit mb-6`}>
              <span className={`material-symbols-outlined ${card.iconColor} text-3xl`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {card.icon}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">{card.title}</h3>
            <p className="text-slate-500 leading-relaxed mb-4 text-sm">{card.desc}</p>
            {card.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {card.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-500">{tag}</span>
                ))}
              </div>
            )}
          </motion.div>
        ))}

        {/* Wide CTA card */}
        <motion.div
          variants={item}
          className="md:col-span-2 bg-primary rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center"
        >
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-3">Dan Pelanggaran Lainnya</h3>
            <p className="text-white/70 leading-relaxed text-sm">
              Segala bentuk tindakan yang mencederai prinsip keadilan dalam penyaluran dana bantuan pendidikan nasional KIP-K.
            </p>
          </div>
          <span className="material-symbols-outlined text-6xl text-white/20">policy</span>
        </motion.div>
      </motion.div>
    </section>
  );
}
