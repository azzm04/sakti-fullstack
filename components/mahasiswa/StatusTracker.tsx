export default function StatusTracker() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-headline text-xl font-bold text-primary">Status Pencairan Semester Genap</h4>
          <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Update: 2 Jam Lalu</span>
        </div>

        <div className="relative py-4">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-variant -translate-y-1/2 rounded-full" />
          <div className="absolute top-1/2 left-0 w-2/3 h-1 bg-surface-tint -translate-y-1/2 rounded-full" />
          <div className="relative flex justify-between items-center">
            {[
              { label: "Verifikasi", icon: "check", done: true },
              { label: "SK Rektor",  icon: "check", done: true },
              { label: "Proses Bank", icon: "account_balance", active: true },
              { label: "Cair",       icon: "payments", pending: true },
            ].map((step) => (
              <div key={step.label} className={`flex flex-col items-center gap-2 ${step.pending ? "opacity-30" : ""}`}>
                <div className={`rounded-full flex items-center justify-center shadow-lg ${
                  step.active
                    ? "w-12 h-12 bg-surface-container-lowest border-4 border-surface-tint text-primary animate-pulse"
                    : "w-10 h-10 bg-surface-tint text-on-primary"
                }`}>
                  <span className="material-symbols-outlined text-sm" style={step.done ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                    {step.icon}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase ${step.active ? "text-primary" : "text-on-surface-variant"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 p-4 bg-surface-container-lowest rounded-2xl flex items-center gap-4">
          <span className="material-symbols-outlined text-tertiary">info</span>
          <p className="text-sm text-on-surface-variant italic">
            Estimasi pencairan ke rekening Anda dalam 3-5 hari kerja setelah proses Bank selesai.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-highest rounded-4xl p-8 flex flex-col justify-center items-center text-center shadow-lg">
        <img alt="Student Group" className="w-24 h-24 rounded-full object-cover mb-4 grayscale opacity-50" src="/placeholder-students.jpg" />
        <h4 className="font-headline text-lg font-bold text-primary mb-2">Bantuan Teknis?</h4>
        <p className="text-sm text-on-surface-variant mb-6">Hubungi admin universitas melalui sistem tiket internal kami.</p>
        <button className="w-full py-3 bg-surface-container-lowest text-primary font-bold rounded-xl hover:bg-white transition-colors">
          Buka Tiket
        </button>
      </div>
    </div>
  );
}
