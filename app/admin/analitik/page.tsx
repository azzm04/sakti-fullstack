import AnalitikSelector from "@/components/admin/analitik/AnalitikSelector"

export default function AnalitikPage() {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Analitik Seleksi</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight font-headline">
            Dashboard Analitik
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Analisis pola keputusan pewawancara menggunakan Decision Tree.
            Pilih tahun dan jalur masuk untuk memulai.
          </p>
        </div>

        <AnalitikSelector />
      </div>
    </div>
  )
}
