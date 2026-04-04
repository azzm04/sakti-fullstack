const STATS = [
  { value: "3",      label: "Fitur Utama Sistem"   },
  { value: "mRAG",   label: "Teknologi Chatbot"    },
  { value: "TOPSIS", label: "Algoritma Seleksi"    },
  { value: "24/7",   label: "Asisten Virtual"      },
];

export default function StatsBar() {
  return (
    <section className="py-16 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <div className="text-4xl font-extrabold text-primary mb-2">{value}</div>
              <div className="text-xs font-bold text-secondary uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
