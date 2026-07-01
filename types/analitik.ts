// Types untuk Dashboard Analitik — sesuai JSON output FastAPI

export interface FeatureImportanceItem {
  fitur: string
  importance: number
  pct: number
  berkontribusi?: boolean
}

export interface KasusAmbigu {
  index: number
  keputusan_aktual: string
  prediksi_model: string
  probabilitas: number
  status_p3ke: string
  nominal_per_kapita: number | null
  kondisi_rumah: string
}

export interface DistribusiKelas {
  label: string
  diusulkan: number
  tidak_diusulkan: number
  total: number
}

export interface DistribusiGeografis {
  provinsi: string
  diusulkan: number
  tidak_diusulkan: number
  total: number
  pct_diusulkan: number
}

export interface RuleNode {
  kondisi: string
  keputusan: string
  jumlah_sampel: number
  confidence: number
}

export interface Konsistensi {
  akurasi_model: number
  pct_dapat_dijelaskan: number
  pct_kasus_ambigu: number
  jumlah_kasus_ambigu: number
  jumlah_total_uji: number
  precision_diusulkan: number
  recall_diusulkan: number
  f1_diusulkan: number
  precision_tidak: number
  recall_tidak: number
  f1_tidak: number
  confusion_matrix: number[][]
}

export interface ModelInfo {
  algoritma: string
  best_params: Record<string, number>
  cv_accuracy: number
  train_accuracy: number
  test_accuracy: number
  jumlah_fitur: number
  jumlah_data_train: number
  jumlah_data_test: number
}

export interface Ringkasan {
  total_pendaftar: number
  total_diusulkan: number
  total_tidak_diusulkan: number
  pct_diusulkan: number
  pct_tidak_diusulkan: number
  tahun_seleksi: string | null
}

export interface DashboardAnalitikData {
  status: string
  pesan: string
  waktu_proses_ms: number
  ringkasan: Ringkasan
  feature_importance: FeatureImportanceItem[]
  konsistensi: Konsistensi
  rule_nodes: RuleNode[]
  kasus_ambigu: KasusAmbigu[]
  distribusi_p3ke: DistribusiKelas[]
  distribusi_kondisi_rumah: DistribusiKelas[]
  distribusi_dtks: DistribusiKelas[]
  distribusi_geografis: DistribusiGeografis[]
  model_info: ModelInfo
}
