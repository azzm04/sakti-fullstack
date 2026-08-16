"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import {
  Search,
  CheckCircle2,
  Clock,
  Loader2,
  FileImage,
  ExternalLink,
  Users,
  ScanSearch,
  AlertCircle,
  FileQuestion,
  CalendarPlus,
  CalendarClock,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ShieldAlert,
  TriangleAlert,
  ListFilter,
} from "lucide-react";
import Filters, {
  AnimateChangeInHeight,
  Filter,
  FilterOperator,
  FilterType,
  monevFilterViewOptions,
  filterViewToFilterOptions,
  FilterOption,
  ValidasiMonev,
} from "@/components/ui/filters";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface MonevSchedule {
  id: string;
  tipe_monev: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminMonevData {
  id: string;
  user_id: string;
  nim: string;
  nama: string;
  prodi: string;
  pekerjaan_ayah: string;
  penghasilan_ayah: number;
  url_bukti_ayah: { kerja: string | null; gaji: string | null };
  pekerjaan_ibu: string;
  penghasilan_ibu: number;
  url_bukti_ibu: { kerja: string | null; gaji: string | null };
  penghasilan_lain: number;
  url_bukti_lain: string | null;
  jumlah_tanggungan: number;
  url_scan_kk: string | null;
  status_pengisian: "Sudah" | "Belum";
  total_pendapatan: number;
  rupiah_per_tanggungan: number;
  hasil_deteksi_yolo: number | null;
}

const TIPE_OPTIONS = [
  "Evaluasi Ekonomi",
  "Evaluasi Akademik",
  "Evaluasi Sosial",
  "Evaluasi Akhir",
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

const formatRp = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(angka);

const BATAS_KIPK_PER_TANGGUNGAN = 750000;

type MonevValidationStatus =
  | "belum_mengisi"
  | "melebihi_batas"
  | "data_tidak_sesuai"
  | "sesuai";

function getMonevStatus(m: AdminMonevData): MonevValidationStatus {
  // Prioritas 1: Jika AI deteksi tanggungan beda dengan input → tidak sesuai
  if (
    m.hasil_deteksi_yolo !== null &&
    m.hasil_deteksi_yolo !== 0 &&
    m.hasil_deteksi_yolo !== m.jumlah_tanggungan
  )
    return "data_tidak_sesuai";
  // Prioritas 2: Jika Rp/tanggungan melebihi batas KIPK
  if (m.rupiah_per_tanggungan > BATAS_KIPK_PER_TANGGUNGAN)
    return "melebihi_batas";
  // Prioritas 3: Belum mengisi form
  if (m.status_pengisian === "Belum") return "belum_mengisi";
  return "sesuai";
}

interface MonevClientProps {
  initialSchedules: MonevSchedule[];
}

export default function MonevClient({ initialSchedules }: MonevClientProps) {
  const [data, setData] = useState<AdminMonevData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    sudah: 0,
    belum: 0,
    melebihi: 0,
    tidakSesuai: 0,
  });
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    nama: string;
  } | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<FilterType | null>(null);
  const [filterInput, setFilterInput] = useState("");

  // Jadwal Evaluasi State - diinisialisasi dari server
  const [schedules, setSchedules] = useState<MonevSchedule[]>(initialSchedules);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    tipe_monev: "Evaluasi Ekonomi",
    label: "",
    waktu_mulai: "",
    deadline: "",
  });

  const fetchSchedules = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/admin/monev/schedule");
      const json = await res.json();
      setSchedules(json.data ?? []);
    } catch {
      setSchedules([]);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  const handleCreateSchedule = async () => {
    if (
      !scheduleForm.tipe_monev ||
      !scheduleForm.label ||
      !scheduleForm.deadline
    )
      return;
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/admin/monev/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe_monev: scheduleForm.tipe_monev,
          label: scheduleForm.label,
          waktu_mulai: scheduleForm.waktu_mulai || null,
          deadline: scheduleForm.deadline,
        }),
      });
      if (res.ok) {
        setScheduleForm({
          tipe_monev: "Evaluasi Ekonomi",
          label: "",
          waktu_mulai: "",
          deadline: "",
        });
        setShowScheduleForm(false);
        fetchSchedules();
      }
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleSchedule = async (id: string, current: boolean) => {
    await fetch(`/api/admin/monev/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    fetchSchedules();
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Hapus jadwal evaluasi ini?")) return;
    await fetch(`/api/admin/monev/schedule/${id}`, { method: "DELETE" });
    fetchSchedules();
  };

  // FETCH DATA MONEV
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const mockData: AdminMonevData[] = [
        {
          id: "1",
          user_id: "u1",
          nim: "21110631170001",
          nama: "Azzam Syaiful Islam",
          prodi: "Teknik Komputer",
          pekerjaan_ayah: "PNS",
          penghasilan_ayah: 4500000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Ibu Rumah Tangga",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 4,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 4500000,
          rupiah_per_tanggungan: 1125000,
          hasil_deteksi_yolo: null,
        },
        {
          id: "2",
          user_id: "u2",
          nim: "11000125120161",
          nama: "Zahro Nur Alifah",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Wiraswasta",
          penghasilan_ayah: 1500000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Tidak Bekerja",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 2,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 1500000,
          rupiah_per_tanggungan: 750000,
          hasil_deteksi_yolo: 3,
        },
        {
          id: "3",
          user_id: "u3",
          nim: "11000125120015",
          nama: "Nazwa Amalia",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Petani",
          penghasilan_ayah: 800000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Petani",
          penghasilan_ibu: 700000,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 3,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 1500000,
          rupiah_per_tanggungan: 500000,
          hasil_deteksi_yolo: 3,
        },
        {
          id: "4",
          user_id: "u4",
          nim: "11000125120030",
          nama: "Ghiza Bilal",
          prodi: "Hukum S1",
          pekerjaan_ayah: "Lainnya",
          penghasilan_ayah: 3250000,
          url_bukti_ayah: { kerja: "#", gaji: "#" },
          pekerjaan_ibu: "Tidak Bekerja",
          penghasilan_ibu: 0,
          url_bukti_ibu: { kerja: "#", gaji: "#" },
          penghasilan_lain: 0,
          url_bukti_lain: null,
          jumlah_tanggungan: 4,
          url_scan_kk: "#",
          status_pengisian: "Sudah",
          total_pendapatan: 3250000,
          rupiah_per_tanggungan: 812500,
          hasil_deteksi_yolo: 0,
        },
      ];
      setTimeout(() => {
        setData(mockData);
        setTotalPages(10);
        setStats({
          total: 5000,
          sudah: 4200,
          belum: 800,
          melebihi: 312,
          tidakSesuai: 87,
        });
        setLoading(false);
      }, 500);
    } catch {
      setData([]);
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const handleScanAll = async () => {
    setIsScanningAll(true);
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.hasil_deteksi_yolo === null
            ? { ...item, hasil_deteksi_yolo: Math.floor(Math.random() * 5) }
            : item,
        ),
      );
      setIsScanningAll(false);
    }, 2500);
  };

  const handleScanSingle = async (id: string) => {
    setScanningId(id);
    setTimeout(() => {
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, hasil_deteksi_yolo: item.jumlah_tanggungan }
            : item,
        ),
      );
      setScanningId(null);
    }, 1500);
  };

  // Filter data berdasarkan status validasi
  const filteredData = data.filter((m) => {
    for (const f of filters) {
      if (!f.value?.length) continue;
      if (f.type === FilterType.VALIDASI_MONEV) {
        const status = getMonevStatus(m);
        const statusMap: Record<string, MonevValidationStatus> = {
          [ValidasiMonev.SESUAI]: "sesuai",
          [ValidasiMonev.BELUM_MENGISI]: "belum_mengisi",
          [ValidasiMonev.MELEBIHI_BATAS]: "melebihi_batas",
          [ValidasiMonev.DATA_TIDAK_SESUAI]: "data_tidak_sesuai",
        };
        const match = f.value.some((v) => statusMap[v] === status);
        if (!match) return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-admin-bg p-6 md:p-10">
      <div className="mb-8">
        <nav className="flex items-center gap-1.5 mb-3 text-[11px] uppercase tracking-wider font-semibold">
          <span className="text-admin-text-2">Dashboard</span>
          <span className="text-admin-text-2">›</span>
          <span className="text-admin-accent">Monitoring & Evaluasi</span>
        </nav>
        <h2 className="font-admin-heading text-3xl font-extrabold text-admin-accent tracking-tight">
          Data Laporan Monev
        </h2>
        <p className="text-admin-text-2 text-sm mt-1">
          Pantau kelengkapan dokumen evaluasi ekonomi mahasiswa KIP-Kuliah
          secara real-time.
        </p>
      </div>

      {/* JADWAL EVALUASI */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm mb-8 overflow-hidden">
        <button
          onClick={() => setScheduleExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-admin-accent/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-admin-accent/10 text-admin-accent rounded-lg">
              <CalendarClock size={18} />
            </div>
            <div className="text-left">
              <h3 className="font-admin-heading font-bold text-admin-accent text-base">
                Jadwal Evaluasi
              </h3>
              <p className="text-xs text-admin-text-2 mt-0.5">
                Kelola periode evaluasi yang aktif untuk mahasiswa KIP-Kuliah
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-admin-text-2 bg-admin-accent/5 px-2.5 py-1 rounded-full">
              {schedules.length} jadwal
            </span>
            {scheduleExpanded ? (
              <ChevronUp size={18} className="text-admin-text-2" />
            ) : (
              <ChevronDown size={18} className="text-admin-text-2" />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {scheduleExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 border-t border-admin-border">
                <div className="flex justify-end mt-4 mb-4">
                  <button
                    onClick={() => setShowScheduleForm((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 transition-all shadow-sm"
                  >
                    <Plus size={16} /> Tambah Jadwal
                  </button>
                </div>

                <AnimatePresence>
                  {showScheduleForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-admin-accent/5 border border-admin-accent/20 rounded-xl p-5 mb-5"
                    >
                      <h4 className="font-admin-heading font-bold text-admin-accent mb-4 flex items-center gap-2">
                        <CalendarPlus size={16} /> Buat Jadwal Evaluasi Baru
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Tipe Monev <span className="text-admin-danger-bar">*</span>
                          </label>
                          <select
                            value={scheduleForm.tipe_monev}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                tipe_monev: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 bg-admin-surface text-admin-accent"
                            title="input tipe monev"
                          >
                            {TIPE_OPTIONS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Label <span className="text-admin-danger-bar">*</span>
                          </label>
                          <input
                            type="text"
                            value={scheduleForm.label}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                label: e.target.value,
                              }))
                            }
                            placeholder="Contoh: Monev Semester Genap 2025/2026"
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent placeholder:text-admin-text-2/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Waktu Mulai
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleForm.waktu_mulai}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                waktu_mulai: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                            title="tanggal"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Deadline <span className="text-admin-danger-bar">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleForm.deadline}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                deadline: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                            title="tanggal"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleCreateSchedule}
                          disabled={
                            savingSchedule ||
                            !scheduleForm.tipe_monev ||
                            !scheduleForm.label ||
                            !scheduleForm.deadline
                          }
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
                        >
                          {savingSchedule ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Plus size={15} />
                          )}{" "}
                          Simpan Jadwal
                        </button>
                        <button
                          onClick={() => setShowScheduleForm(false)}
                          className="px-5 py-2.5 text-sm font-semibold text-admin-text-2 border border-admin-border rounded-xl hover:bg-admin-accent/5 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {scheduleLoading ? (
                  <div className="flex items-center justify-center py-8 text-admin-text-2">
                    <Loader2
                      size={20}
                      className="animate-spin mr-2 text-admin-accent"
                    />{" "}
                    Memuat jadwal...
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8 text-admin-text-2 text-sm">
                    Belum ada jadwal evaluasi. Klik &quot;Tambah Jadwal&quot;
                    untuk membuat.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map((s) => {
                      const passed = isDeadlinePassed(s.deadline);
                      return (
                        <div
                          key={s.id}
                          className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${s.is_active && !passed ? "bg-admin-accent/10/50 border-admin-accent/25" : passed ? "bg-admin-accent/5 border-admin-border opacity-70" : "bg-admin-accent/5 border-admin-border"}`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div
                              className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${s.is_active && !passed ? "bg-admin-accent/20 text-admin-accent" : "bg-admin-accent/10 text-admin-text-2"}`}
                            >
                              <CalendarClock size={16} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-admin-accent text-sm truncate">
                                  {s.label}
                                </p>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${passed ? "bg-admin-accent/5 text-admin-text-2 border-admin-border" : s.is_active ? "bg-admin-accent/20 text-admin-accent-ink border-admin-accent/25" : "bg-admin-warn-border text-admin-warn-text border-admin-warn-border"}`}
                                >
                                  {passed
                                    ? "Berakhir"
                                    : s.is_active
                                      ? "Aktif"
                                      : "Nonaktif"}
                                </span>
                                <span className="text-[10px] font-semibold text-admin-accent bg-admin-accent/10 px-2 py-0.5 rounded-full border border-admin-accent/20">
                                  {s.tipe_monev}
                                </span>
                              </div>
                              <p className="text-xs text-admin-text-2 mt-1">
                                {s.waktu_mulai
                                  ? `Mulai: ${formatDate(s.waktu_mulai)} — `
                                  : ""}
                                Deadline:{" "}
                                <span
                                  className={`font-semibold ${passed ? "text-admin-danger-bar" : "text-admin-accent"}`}
                                >
                                  {formatDate(s.deadline)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() =>
                                handleToggleSchedule(s.id, s.is_active)
                              }
                              title={s.is_active ? "Nonaktifkan" : "Aktifkan"}
                              className="p-2 rounded-lg hover:bg-admin-surface border border-transparent hover:border-admin-border transition-all text-admin-text-2 hover:text-admin-accent"
                            >
                              {s.is_active ? (
                                <ToggleRight
                                  size={20}
                                  className="text-admin-accent"
                                />
                              ) : (
                                <ToggleLeft size={20} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              title="Hapus jadwal"
                              className="p-2 rounded-lg hover:bg-admin-danger-bg border border-transparent hover:border-admin-danger-border transition-all text-admin-text-2 hover:text-admin-danger-bar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-admin-surface rounded-2xl border border-admin-border p-5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-admin-accent/5 rounded-bl-full -z-10" />
          <p className="text-xs font-bold text-admin-text-2 uppercase tracking-widest mb-1">
            Total Mahasiswa
          </p>
          <p className="text-3xl font-extrabold text-admin-accent">
            {stats.total.toLocaleString("id-ID")}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-admin-surface rounded-2xl border border-admin-warn-border p-5 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-admin-warn-bg-2 rounded-bl-full -z-10" />
          <p className="text-xs font-bold text-admin-warn-text uppercase tracking-widest mb-1">
            Belum Mengisi
          </p>
          <p className="text-3xl font-extrabold text-admin-warn-text">
            {stats.belum.toLocaleString("id-ID")}
          </p>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-5 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative w-full max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-2"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari NIM atau Nama..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-admin-border rounded-xl bg-admin-surface text-admin-accent focus:outline-none focus:border-admin-accent focus:ring-4 focus:ring-admin-accent/10 transition-all shadow-sm placeholder:text-admin-text-2/50"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Filter chips */}
            <Filters filters={filters} setFilters={setFilters} />

            {filters.filter((f) => f.value?.length > 0).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg px-3 text-admin-text-3 hover:text-admin-danger-text hover:border-admin-danger-border"
                onClick={() => setFilters([])}
              >
                <X className="size-3 mr-1" /> Hapus Filter
              </Button>
            )}

            <Popover
              open={filterOpen}
              onOpenChange={(o) => {
                setFilterOpen(o);
                if (!o)
                  setTimeout(() => {
                    setSelectedView(null);
                    setFilterInput("");
                  }, 200);
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs rounded-lg flex gap-1.5 items-center transition group border border-admin-border hover:border-admin-accent/30 px-3"
                >
                  <ListFilter className="size-3.5 shrink-0 text-admin-text-3 group-hover:text-admin-accent transition-all" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[220px] p-0 z-50 shadow-lg"
                align="end"
                sideOffset={8}
              >
                <AnimateChangeInHeight>
                  <Command>
                    <CommandInput
                      placeholder={selectedView ?? "Filter..."}
                      className="h-9"
                      value={filterInput}
                      onInputCapture={(e) =>
                        setFilterInput(e.currentTarget.value)
                      }
                    />
                    <CommandList>
                      <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                      {selectedView ? (
                        <CommandGroup>
                          {filterViewToFilterOptions[selectedView].map(
                            (f: FilterOption) => (
                              <CommandItem
                                key={f.name}
                                value={f.name}
                                className="group text-admin-text-3 flex gap-2 items-center"
                                onSelect={(val) => {
                                  setFilters((prev) => [
                                    ...prev,
                                    {
                                      id: nanoid(),
                                      type: selectedView,
                                      operator: FilterOperator.IS,
                                      value: [val],
                                    },
                                  ]);
                                  setTimeout(() => {
                                    setSelectedView(null);
                                    setFilterInput("");
                                  }, 200);
                                  setFilterOpen(false);
                                }}
                              >
                                {f.icon}
                                <span className="text-accent-foreground">
                                  {f.name}
                                </span>
                              </CommandItem>
                            ),
                          )}
                        </CommandGroup>
                      ) : (
                        monevFilterViewOptions.map(
                          (group: FilterOption[], idx: number) => (
                            <CommandGroup key={idx}>
                              {group.map((f: FilterOption) => (
                                <CommandItem
                                  key={f.name}
                                  value={f.name}
                                  className="group text-admin-text-3 flex gap-2 items-center"
                                  onSelect={(val) => {
                                    setSelectedView(val as FilterType);
                                    setFilterInput("");
                                  }}
                                >
                                  {f.icon}
                                  <span className="text-accent-foreground">
                                    {f.name}
                                  </span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          ),
                        )
                      )}
                    </CommandList>
                  </Command>
                </AnimateChangeInHeight>
              </PopoverContent>
            </Popover>

            <button
              onClick={handleScanAll}
              disabled={isScanningAll}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-bold rounded-xl hover:bg-admin-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isScanningAll ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Memindai AI...
                </>
              ) : (
                <>
                  <ScanSearch size={16} /> Pindai Foto{" "}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1100px]">
            <thead className="bg-admin-accent/5 border-b border-admin-border text-admin-text-2">
              <tr>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] w-12 text-center">
                  No
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Identitas Mahasiswa
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-admin-accent/10/50">
                  Data Ayah
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-admin-danger-bg/50">
                  Data Ibu
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] bg-admin-warn-bg-2/50">
                  Lainnya & KK
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px]">
                  Kalkulasi Sistem
                </th>
                <th className="px-5 py-4 font-bold uppercase tracking-wider text-[11px] text-center">
                  Validasi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <div className="inline-flex items-center gap-3 text-admin-text-2">
                      <Loader2
                        size={20}
                        className="animate-spin text-admin-accent"
                      />
                      <span className="text-sm font-medium">
                        Memuat data monev...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-16 text-center text-admin-text-2 text-sm"
                  >
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((m, idx) => (
                  <tr
                    key={m.id}
                    className="hover:bg-admin-accent/5 transition-colors group"
                  >
                    <td className="px-5 py-4 text-xs font-mono text-admin-text-2 text-center">
                      {(page - 1) * 50 + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-admin-accent text-sm mb-0.5">
                        {m.nama}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-admin-accent bg-admin-accent/5 px-1.5 rounded">
                          {m.nim}
                        </span>
                        <span className="text-admin-text-2 truncate max-w-[150px]">
                          {m.prodi}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 bg-admin-accent/10/20">
                      <p className="font-semibold text-admin-text-2 text-xs mb-1">
                        {m.pekerjaan_ayah}
                      </p>
                      <p className="text-sm font-bold text-admin-accent mb-2">
                        {formatRp(m.penghasilan_ayah)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {m.url_bukti_ayah.kerja && (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                url: m.url_bukti_ayah.kerja!,
                                nama: `${m.nama} - Bukti Kerja Ayah`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-accent/20 text-admin-accent-ink px-2 py-1 rounded hover:bg-admin-accent/25 transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </button>
                        )}
                        {m.url_bukti_ayah.gaji && (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                url: m.url_bukti_ayah.gaji!,
                                nama: `${m.nama} - Bukti Gaji Ayah`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-accent/20 text-admin-accent-ink px-2 py-1 rounded hover:bg-admin-accent/25 transition-colors"
                          >
                            <FileImage size={12} /> Gaji
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 bg-admin-danger-bg/20">
                      <p className="font-semibold text-admin-text-2 text-xs mb-1">
                        {m.pekerjaan_ibu}
                      </p>
                      <p className="text-sm font-bold text-admin-accent mb-2">
                        {formatRp(m.penghasilan_ibu)}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {m.url_bukti_ibu.kerja && (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                url: m.url_bukti_ibu.kerja!,
                                nama: `${m.nama} - Bukti Kerja Ibu`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-danger-border text-admin-danger-text px-2 py-1 rounded hover:bg-admin-danger-border transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </button>
                        )}
                        {m.url_bukti_ibu.gaji && (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                url: m.url_bukti_ibu.gaji!,
                                nama: `${m.nama} - Bukti Gaji Ibu`,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-accent/20 text-admin-accent-ink px-2 py-1 rounded hover:bg-admin-accent/25 transition-colors"
                          >
                            <FileImage size={12} /> Gaji
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 bg-admin-warn-bg-2/20 min-w-[200px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-admin-text-2">
                          Pend. Lain:
                        </span>
                        <span className="font-bold text-admin-accent text-xs">
                          {formatRp(m.penghasilan_lain)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-admin-text-2">
                          Tanggungan:
                        </span>
                        <span className="font-bold text-admin-accent text-xs flex items-center gap-1">
                          <Users size={12} /> {m.jumlah_tanggungan}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-admin-warn-border/50">
                        {m.url_scan_kk && (
                          <button
                            onClick={() =>
                              setPreviewImage({
                                url: m.url_scan_kk!,
                                nama: `${m.nama} - Kartu Keluarga`,
                              })
                            }
                            className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-admin-warn-border text-admin-warn-text px-2 py-1.5 rounded hover:bg-admin-warn-border transition-colors border border-admin-warn-border"
                            title="Lihat Kartu Keluarga"
                          >
                            <ExternalLink size={12} /> Lihat KK
                          </button>
                        )}
                        {m.hasil_deteksi_yolo === null ? (
                          <button
                            onClick={() => handleScanSingle(m.id)}
                            disabled={scanningId === m.id || isScanningAll}
                            className="inline-flex w-full justify-center items-center gap-1.5 text-[10px] font-bold bg-admin-surface text-admin-text-2 px-2 py-1.5 rounded border border-admin-border hover:bg-admin-accent/5 hover:text-admin-accent transition-colors disabled:opacity-50"
                          >
                            {scanningId === m.id ? (
                              <>
                                <Loader2 size={12} className="animate-spin" />{" "}
                                Memproses...
                              </>
                            ) : (
                              <>
                                <ScanSearch size={12} /> Pindai AI
                              </>
                            )}
                          </button>
                        ) : m.hasil_deteksi_yolo === 0 ? (
                          <div className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-admin-accent/5 text-admin-text-2 px-2 py-1.5 rounded border border-admin-border">
                            <FileQuestion size={12} className="shrink-0" />{" "}
                            Gambar tak terdeteksi AI
                          </div>
                        ) : (
                          <div
                            className={`inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded border ${m.hasil_deteksi_yolo !== m.jumlah_tanggungan ? "bg-admin-danger-bg text-admin-danger-text border-admin-danger-border" : "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25"}`}
                          >
                            {m.hasil_deteksi_yolo !== m.jumlah_tanggungan ? (
                              <>
                                <AlertCircle size={12} className="shrink-0" />{" "}
                                Beda: AI ({m.hasil_deteksi_yolo}) vs Input (
                                {m.jumlah_tanggungan})
                              </>
                            ) : (
                              <>
                                <ScanSearch size={12} className="shrink-0" />{" "}
                                Sesuai (Lolos AI)
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 bg-admin-accent/5">
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-[10px] text-admin-text-2 font-semibold uppercase">
                            Total Pendapatan
                          </p>
                          <p className="font-bold text-admin-accent text-sm">
                            {formatRp(m.total_pendapatan)}
                          </p>
                        </div>
                        <div className="border-t border-admin-border pt-1.5">
                          <p className="text-[10px] text-admin-text-2 font-semibold uppercase">
                            Rp / Tanggungan
                          </p>
                          <p
                            className={`font-extrabold text-sm ${m.rupiah_per_tanggungan > BATAS_KIPK_PER_TANGGUNGAN ? "text-admin-danger-text" : "text-admin-accent"}`}
                          >
                            {formatRp(m.rupiah_per_tanggungan)}
                          </p>
                          {m.rupiah_per_tanggungan >
                            BATAS_KIPK_PER_TANGGUNGAN && (
                            <p className="text-[9px] text-admin-danger-bar font-semibold mt-0.5">
                              Maks: {formatRp(BATAS_KIPK_PER_TANGGUNGAN)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {(() => {
                        const status = getMonevStatus(m);
                        switch (status) {
                          case "belum_mengisi":
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-admin-warn-text bg-admin-warn-bg-2 px-3 py-1.5 rounded-full border border-admin-warn-border">
                                <Clock size={14} /> Belum Mengisi
                              </span>
                            );
                          case "melebihi_batas":
                            return (
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-admin-danger-text bg-admin-danger-bg px-3 py-1.5 rounded-full border border-admin-danger-border">
                                  <ShieldAlert size={14} /> Melebihi Batas
                                </span>
                                <button className="text-[10px] font-semibold text-admin-danger-text hover:text-admin-danger-text underline underline-offset-2 transition-colors">
                                  Tindak Lanjut
                                </button>
                              </div>
                            );
                          case "data_tidak_sesuai":
                            return (
                              <div className="flex flex-col items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-admin-warn-text bg-admin-warn-bg-2 px-3 py-1.5 rounded-full border border-admin-warn-border">
                                  <TriangleAlert size={14} /> Tidak Sesuai
                                </span>
                                <button className="text-[10px] font-semibold text-admin-warn-text hover:text-admin-warn-text underline underline-offset-2 transition-colors">
                                  Tindak Lanjut
                                </button>
                              </div>
                            );
                          case "sesuai":
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-admin-accent-ink bg-admin-accent/10 px-3 py-1.5 rounded-full border border-admin-accent/25">
                                <CheckCircle2 size={14} /> Sesuai
                              </span>
                            );
                        }
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-5 py-4 border-t border-admin-border flex items-center justify-between bg-admin-accent/5">
            <p className="text-xs font-medium text-admin-text-2">
              Halaman <span className="font-bold text-admin-accent">{page}</span>{" "}
              dari <span className="font-bold text-admin-accent">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold border border-admin-border bg-admin-surface text-admin-text-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-admin-accent/5 hover:text-admin-accent transition-colors shadow-sm"
              >
                ← Sebelumnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold border border-admin-border bg-admin-surface text-admin-text-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-admin-accent/5 hover:text-admin-accent transition-colors shadow-sm"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-admin-border bg-admin-accent/5">
                <div>
                  <p className="font-bold text-admin-accent text-sm">
                    Preview Dokumen
                  </p>
                  <p className="text-xs text-admin-text-2">{previewImage.nama}</p>
                </div>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-lg hover:bg-admin-accent/10 text-admin-text-2 hover:text-admin-accent transition-colors"
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>
              {/* Image */}
              <div className="p-4 flex items-center justify-center bg-admin-surface-soft max-h-[75vh] overflow-auto">
                <img
                  src={previewImage.url}
                  alt={`KK - ${previewImage.nama}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
