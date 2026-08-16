import AnalitikSelector from "@/components/admin/analitik/AnalitikSelector"

export default function AnalitikPage() {
  return (
    <div className="p-4 md:p-8 min-h-screen bg-admin-bg">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-admin-text-3 mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-admin-text font-semibold">Analitik Seleksi</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-admin-accent tracking-tight font-admin-heading">
            Dashboard Analitik
          </h1>
          <p className="text-admin-text-3 text-sm mt-1">
            Analisis pola keputusan pewawancara menggunakan Decision Tree.
            Pilih tahun dan jalur masuk untuk memulai.
          </p>
        </div>

        <AnalitikSelector />
      </div>
    </div>
  )
}
