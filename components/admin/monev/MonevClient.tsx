"use client";

import { PageHeader } from "@/components/admin/ui/PageHeader";
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

import ConfirmModal from "@/components/admin/wawancara/shared/ConfirmModal";
import {
  getOperationalStatus,
  wibInputToUtcIso,
  utcIsoToWibInput,
  addOneMonthToWibInput,
  addDaysToWibInput,
  type OperationalStatus,
} from "@/lib/monev-schedule";

interface MonevSchedule {
  id: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
  tahun_akademik?: number | null;
  semester?: string | null;
  jumlah_laporan?: number;
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
  status_anomali?: boolean | null;
  hasil_scan_ai?: unknown;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const isDeadlinePassed = (deadline: string) => new Date(deadline) < new Date();

/**
 * Tahun awal dari tahun ajaran yang sedang berjalan.
 * Tahun ajaran dimulai Agustus, jadi Okt 2026 ada di tahun ajaran 2026/2027
 * sementara Mar 2027 masih 2026/2027.
 */
const getTahunAjaranBerjalan = (now: Date = new Date()): number =>
  now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;

const statusOf = (s: MonevSchedule): OperationalStatus =>
  getOperationalStatus({
    is_active:      s.is_active,
    waktu_mulai:    s.waktu_mulai,
    deadline:       s.deadline,
    jumlah_laporan: s.jumlah_laporan,
  });

/**
 * Periode yang sudah berjalan / berakhir / punya laporan hanya boleh
 * diperpanjang deadline-nya — waktu_mulai terkunci.
 */
const isDeadlineOnly = (status: OperationalStatus) =>
  status === "BERLANGSUNG" ||
  status === "BERAKHIR" ||
  status === "NONAKTIF_BERJALAN";

/**
 * Badge status. Labelnya menjelaskan apa yang dialami mahasiswa, bukan nilai
 * kolom di database — "Aktif" dulu menyesatkan karena periode dengan
 * waktu_mulai di masa depan ikut berlabel aktif padahal formnya belum terbuka.
 *
 * Status NONAKTIF* hanya muncul jika is_active=false diubah dari luar aplikasi;
 * admin tidak punya tombolnya lagi.
 */
const STATUS_BADGE: Record<
  OperationalStatus,
  { label: string; hint: string; className: string }
> = {
  BELUM_DIMULAI: {
    label:     "Belum dibuka",
    hint:      "Mahasiswa melihat jadwal ini sebagai akan datang, tapi belum bisa mengisi",
    className: "bg-admin-warn-bg text-admin-warn-text border-admin-warn-border",
  },
  BERLANGSUNG: {
    label:     "Sedang berjalan",
    hint:      "Form terbuka, mahasiswa bisa mengisi",
    className: "bg-admin-accent/20 text-admin-accent-ink border-admin-accent/25",
  },
  BERAKHIR: {
    label:     "Berakhir",
    hint:      "Deadline sudah lewat, pengisian tertutup",
    className: "bg-admin-accent/5 text-admin-text-2 border-admin-border",
  },
  NONAKTIF: {
    label:     "Tersembunyi",
    hint:      "Tidak tampil di halaman mahasiswa (is_active=false)",
    className: "bg-admin-warn-border text-admin-warn-text border-admin-warn-border",
  },
  NONAKTIF_BERJALAN: {
    label:     "Tersembunyi",
    hint:      "Tidak tampil di halaman mahasiswa walau jadwalnya sedang berjalan",
    className: "bg-admin-warn-border text-admin-warn-text border-admin-warn-border",
  },
};

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
  | "menunggu_verifikasi"
  | "dalam_verifikasi"
  | "melebihi_batas"
  | "data_tidak_sesuai"
  | "sesuai";

function getMonevStatus(m: AdminMonevData): MonevValidationStatus {
  if (m.status_pengisian === "Belum") return "belum_mengisi";
  if (m.rupiah_per_tanggungan > BATAS_KIPK_PER_TANGGUNGAN) return "melebihi_batas";

  // Gunakan flag status_anomali langsung dari DB (hasil update AI)
  if (m.status_anomali === true) {
    return "data_tidak_sesuai";
  }

  // Jika AI sudah menscan (hasil tidak null dan tidak undefined) dan tidak ada anomali
  if (
    (m.hasil_deteksi_yolo !== null && m.hasil_deteksi_yolo !== undefined) ||
    (m.hasil_scan_ai !== null && m.hasil_scan_ai !== undefined)
  ) {
    return "sesuai";
  }

  return "menunggu_verifikasi";
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
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(
    initialSchedules.length > 0 ? initialSchedules[0].id : ""
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const tahunAjaranBerjalan = getTahunAjaranBerjalan();

  function buildPeriodeOptions(years: number[]) {
    return years.flatMap((y) => [
      { label: `Gasal ${y}/${y + 1}`, tahun: y, semester: "Gasal" as const },
      { label: `Genap ${y}/${y + 1}`, tahun: y, semester: "Genap" as const },
    ]);
  }

  // Opsi default: tahun ajaran berjalan + berikutnya (4 opsi). Tahun ajaran
  // yang sudah lewat tidak ditawarkan — untuk kebutuhan lain, admin bisa
  // mengetik tahunnya langsung di kolom pencarian.
  const defaultYears = [tahunAjaranBerjalan, tahunAjaranBerjalan + 1];

  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [periodeSearch, setPeriodeSearch] = useState("");
  const [periodeOpen, setPeriodeOpen] = useState(false);
  const [periodeSelected, setPeriodeSelected] = useState<{ label: string; tahun: number; semester: "Gasal" | "Genap" } | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    waktu_mulai: "",
    deadline: "",
    // true setelah admin mengetik sendiri di field deadline —
    // auto-fill tidak boleh menimpa nilai yang sudah disentuh manual
    deadlineTouched: false,
  });

  // Opsi ditampilkan: default 6, atau hasil pencarian angka tahun 4-digit
  const searchYear = /^\d{4}$/.test(periodeSearch.trim()) ? parseInt(periodeSearch.trim(), 10) : null;
  const visibleOptions = searchYear
    ? buildPeriodeOptions([searchYear])
    : buildPeriodeOptions(defaultYears);

  const handleSelectPeriode = (opt: { label: string; tahun: number; semester: "Gasal" | "Genap" }) => {
    setPeriodeSelected(opt);
    setPeriodeOpen(false);
    setPeriodeSearch("");
    setScheduleError(null);
    setDuplicateId(null);
  };

  // Preview label otomatis
  const previewLabel = periodeSelected
    ? `Monev KIP-K Undip Semester ${periodeSelected.semester} ${periodeSelected.tahun}/${periodeSelected.tahun + 1}`
    : "";

  // ── State dialog aksi (Ubah jadwal / Perpanjang / Buka kembali) ──
  const [actionDialog, setActionDialog] = useState<{
    schedule: MonevSchedule;
    status: OperationalStatus;
    belumKirim: number | null;
  } | null>(null);
  const [actionForm, setActionForm] = useState({
    waktu_mulai: "",
    deadline: "",
    extendMode: "+7" as "+7" | "custom",
    customDeadline: "",
    catatan: "",
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);
  const openActionDialog = async (s: MonevSchedule) => {
    const status = statusOf(s);

    // Fetch jumlah belum kirim
    let belumKirim: number | null = null;
    try {
      const res = await fetch(`/api/admin/monev/schedule/${s.id}/stats`);
      if (res.ok) {
        const json = await res.json();
        belumKirim = json.belum_kirim;
      }
    } catch { /* skip */ }

    // Pre-fill form berdasarkan status
    if (!isDeadlineOnly(status)) {
      setActionForm({
        waktu_mulai:    utcIsoToWibInput(s.waktu_mulai),
        deadline:       utcIsoToWibInput(s.deadline),
        extendMode:     "+7",
        customDeadline: "",
        catatan:        "",
      });
    } else {
      // BERLANGSUNG atau BERAKHIR — pre-fill default perpanjangan +7 hari.
      // BERAKHIR dihitung dari sekarang, BERLANGSUNG dari deadline lama.
      const base = status === "BERAKHIR"
        ? utcIsoToWibInput(new Date())
        : utcIsoToWibInput(s.deadline);
      setActionForm({
        waktu_mulai:    "",
        deadline:       "",
        extendMode:     "+7",
        customDeadline: addDaysToWibInput(base, 7),
        catatan:        "",
      });
    }
    setActionError(null);
    setActionDialog({ schedule: s, status, belumKirim });
  };

  const handleSaveAction = async () => {
    if (!actionDialog) return;
    const { schedule, status } = actionDialog;
    setSavingAction(true);
    setActionError(null);

    try {
      const body: Record<string, unknown> = {
        updated_at: schedule.updated_at ?? undefined,
        catatan:    actionForm.catatan || null,
      };

      if (!isDeadlineOnly(status)) {
        body.waktu_mulai = actionForm.waktu_mulai
          ? wibInputToUtcIso(actionForm.waktu_mulai)
          : null;
        body.deadline    = wibInputToUtcIso(actionForm.deadline);
      } else {
        // Perpanjang / Buka kembali — kedua mode radio menulis ke
        // customDeadline, jadi sumber nilainya sama
        body.deadline = wibInputToUtcIso(actionForm.customDeadline);
      }

      const res = await fetch(`/api/admin/monev/schedule/${schedule.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        setActionError(json.error ?? "Gagal menyimpan perubahan");
        return;
      }

      setActionDialog(null);
      fetchSchedules();
    } finally {
      setSavingAction(false);
    }
  };

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
    if (!periodeSelected || !scheduleForm.deadline) return;

    setScheduleError(null);
    setDuplicateId(null);
    setSavingSchedule(true);
    try {
      const res = await fetch("/api/admin/monev/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tahun_akademik: periodeSelected.tahun,
          semester:       periodeSelected.semester,
          waktu_mulai:    scheduleForm.waktu_mulai
            ? wibInputToUtcIso(scheduleForm.waktu_mulai)
            : null,
          deadline:       wibInputToUtcIso(scheduleForm.deadline),
        }),
      });
      const json = await res.json();
      if (res.ok) {
        setPeriodeSelected(null);
        setPeriodeSearch("");
        setScheduleForm({ waktu_mulai: "", deadline: "", deadlineTouched: false });
        setShowScheduleForm(false);
        fetchSchedules();
      } else if (res.status === 409) {
        setScheduleError(json.error);
        setDuplicateId(json.existing_id ?? null);
      } else {
        setScheduleError(json.error ?? "Gagal membuat periode");
      }
    } finally {
      setSavingSchedule(false);
    }
  };

  // ── Hapus periode (konfirmasi lewat modal, bukan confirm() bawaan) ──
  const [deleteTarget, setDeleteTarget] = useState<MonevSchedule | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const askDeleteSchedule = (s: MonevSchedule) => {
    setDeleteError(null);
    setDeleteTarget(s);
  };

  const confirmDeleteSchedule = async () => {
    if (!deleteTarget) return;
    setDeletingSchedule(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/monev/schedule/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        // Modal tetap terbuka — pesan server (mis. periode sudah punya
        // laporan) ditampilkan di tempat deskripsi
        setDeleteError(json.error ?? "Gagal menghapus periode.");
        return;
      }
      setDeleteTarget(null);
      fetchSchedules();
    } finally {
      setDeletingSchedule(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!selectedScheduleId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        schedule_id: selectedScheduleId,
        page: String(page),
        limit: "50",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/monev/submissions?${params}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (res.ok) {
        setData(json.data ?? []);
        setTotalPages(json.pagination?.totalPages ?? 1);
        setStats(json.stats ?? { total: 0, sudah: 0, belum: 0, melebihi: 0, tidakSesuai: 0 });
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedScheduleId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  useEffect(() => {
    setPage(1);
  }, [selectedScheduleId]);

  const handlePreviewFile = async (storagePath: string, label: string) => {
    try {
      const res = await fetch(`/api/admin/monev/file-preview?path=${encodeURIComponent(storagePath)}`);
      const json = await res.json();
      if (json.url) {
        setPreviewImage({ url: json.url, nama: label });
      }
    } catch {
      // Gagal generate preview
    }
  };

  const [isScanningMass, setIsScanningMass] = useState(false);
  const [massScanProgress, setMassScanProgress] = useState({ current: 0, total: 0, success: 0, fail: 0 });
  const [showMassScanModal, setShowMassScanModal] = useState(false);
  const handleScanSingle = async (id: string) => {
    setScanningId(id);
    try {
      const res = await fetch("/api/admin/monev/run-ai-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        const result = await res.json();
        setData((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                ...item,
                hasil_deteksi_yolo: result.hasil_deteksi_yolo,
                status_anomali: result.status_anomali,
                hasil_scan_ai: result.hasil_scan_ai,
              }
              : item
          )
        );
      } else {
        alert("Gagal memproses AI untuk data ini.");
      }
    } catch (e) {
      alert("Terjadi kesalahan koneksi.");
    } finally {
      setScanningId(null);
    }
  };

  const handleMassScan = async () => {
    const pendingData = data.filter((m) => m.status_pengisian === "Sudah" && m.hasil_deteksi_yolo === null);
    if (pendingData.length === 0) {
      alert("Tidak ada data yang menunggu verifikasi AI.");
      return;
    }

    setMassScanProgress({ current: 0, total: pendingData.length, success: 0, fail: 0 });
    setShowMassScanModal(true);
    setIsScanningMass(true);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < pendingData.length; i++) {
      setMassScanProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        const res = await fetch("/api/admin/monev/run-ai-single", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: pendingData[i].id }),
        });

        if (res.ok) {
          successCount++;
          const result = await res.json();
          setData((prev) =>
            prev.map((item) =>
              item.id === pendingData[i].id
                ? {
                  ...item,
                  hasil_deteksi_yolo: result.hasil_deteksi_yolo,
                  status_anomali: result.status_anomali,
                }
                : item
            )
          );
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
      }

      setMassScanProgress((prev) => ({ ...prev, success: successCount, fail: failCount }));
    }

    setIsScanningMass(false);
    fetchData();
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
    <div className="min-h-screen bg-admin-bg">
      <PageHeader
        title="Data Laporan Monev"
        description="Pantau kelengkapan dokumen evaluasi ekonomi mahasiswa KIP-Kuliah secara real-time."
      />
      <div className="px-4 sm:px-[30px] pt-6 pb-[34px]">

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
                        <CalendarPlus size={16} /> Buat Periode Monev
                      </h4>

                      {/* Error / duplikasi */}
                      {scheduleError && (
                        <div className="mb-4 flex items-start gap-3 rounded-lg border border-admin-danger-border bg-admin-danger-bg p-3 text-sm text-admin-danger-text">
                          <AlertCircle size={15} className="shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p>{scheduleError}</p>
                            {duplicateId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedScheduleId(duplicateId);
                                  setShowScheduleForm(false);
                                  setScheduleError(null);
                                  setDuplicateId(null);
                                }}
                                className="mt-1.5 font-semibold underline underline-offset-2 hover:no-underline"
                              >
                                Buka Periode →
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pratinjau label */}
                      {previewLabel && (
                        <div className="mb-4 rounded-lg bg-admin-accent/5 border border-admin-accent/20 px-4 py-2.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-admin-text-2 mb-0.5">
                            Nama Periode (Otomatis)
                          </p>
                          <p className="text-sm font-bold text-admin-accent">{previewLabel}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Periode Akademik <span className="text-admin-danger-bar">*</span>
                          </label>

                          {/* Combobox dengan pencarian */}
                          <Popover open={periodeOpen} onOpenChange={setPeriodeOpen}>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                role="combobox"
                                aria-expanded={periodeOpen}
                                className="flex h-[44px] w-full max-w-[560px] items-center justify-between rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-[14px] text-admin-accent transition-colors hover:border-admin-accent/50 focus:outline-none focus:ring-2 focus:ring-admin-accent/20"
                              >
                                <span className={periodeSelected ? "text-admin-accent" : "text-admin-text-2"}>
                                  {periodeSelected ? periodeSelected.label : "Pilih semester dan tahun akademik"}
                                </span>
                                <ChevronDown size={16} className="shrink-0 text-admin-text-2" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[320px] p-0" align="start" sideOffset={4}>
                              <Command>
                                <CommandInput
                                  placeholder="Ketik tahun untuk mencari periode lain"
                                  value={periodeSearch}
                                  onValueChange={setPeriodeSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    {periodeSearch.trim().length > 0 && !/^\d{4}$/.test(periodeSearch.trim())
                                      ? "Ketik 4 digit tahun, misalnya 2032"
                                      : "Tidak ada pilihan."}
                                  </CommandEmpty>
                                  <CommandGroup heading={searchYear ? `Hasil untuk ${searchYear}` : "Periode tersedia"}>
                                    {visibleOptions.map((opt) => (
                                      <CommandItem
                                        key={opt.label}
                                        value={opt.label}
                                        onSelect={() => handleSelectPeriode(opt)}
                                        className="cursor-pointer"
                                      >
                                        <span className={periodeSelected?.label === opt.label ? "font-semibold text-admin-accent" : ""}>
                                          {opt.label}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Waktu Mulai (WIB)
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleForm.waktu_mulai}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScheduleForm((f) => ({
                                ...f,
                                waktu_mulai: val,
                                // Isi deadline +1 bulan selama admin belum
                                // mengubahnya sendiri
                                deadline: f.deadlineTouched
                                  ? f.deadline
                                  : addOneMonthToWibInput(val),
                              }));
                            }}
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">
                            Batas Pengisian (WIB) <span className="text-admin-danger-bar">*</span>
                          </label>
                          <input
                            type="datetime-local"
                            value={scheduleForm.deadline}
                            onChange={(e) =>
                              setScheduleForm((f) => ({
                                ...f,
                                deadline: e.target.value,
                                deadlineTouched: true,
                              }))
                            }
                            className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleCreateSchedule}
                          disabled={savingSchedule || !periodeSelected || !scheduleForm.deadline}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
                        >
                          {savingSchedule ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Plus size={15} />
                          )}{" "}
                          Simpan Periode
                        </button>
                        <button
                          onClick={() => {
                            setShowScheduleForm(false);
                            setScheduleError(null);
                            setDuplicateId(null);
                          }}
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
                      const opStatus = statusOf(s);
                      const actionLabel =
                        opStatus === "BERAKHIR" ? "Buka kembali"
                        : isDeadlineOnly(opStatus) ? "Perpanjang pengisian"
                        : "Ubah jadwal";
                      const badge = STATUS_BADGE[opStatus];

                      return (
                        <div key={s.id} className="space-y-0">
                          <div
                            onClick={() => setSelectedScheduleId(s.id)}
                            className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedScheduleId === s.id
                              ? "ring-2 ring-admin-accent bg-admin-accent/10 border-admin-accent"
                              : s.is_active && !passed
                                ? "bg-admin-accent/10/50 border-admin-accent/25 hover:bg-admin-accent/10"
                                : passed
                                  ? "bg-admin-accent/5 border-admin-border opacity-70 hover:opacity-100"
                                  : "bg-admin-accent/5 border-admin-border hover:bg-admin-accent/10"
                              }`}
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
                                    title={badge.hint}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                </div>
                                <p className="text-xs text-admin-text-2 mt-1">
                                  {s.waktu_mulai ? `Mulai: ${formatDate(s.waktu_mulai)} — ` : ""}
                                  Deadline:{" "}
                                  <span className={`font-semibold ${passed ? "text-admin-danger-bar" : "text-admin-accent"}`}>
                                    {formatDate(s.deadline)}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Tombol aksi kontekstual */}
                              <button
                                onClick={(e) => { e.stopPropagation(); openActionDialog(s); }}
                                title={actionLabel}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-admin-border text-admin-accent bg-admin-surface hover:bg-admin-accent/5 hover:border-admin-accent/40 transition-all"
                              >
                                <CalendarPlus size={13} />
                                {actionLabel}
                              </button>
                              {/* Hapus */}
                              <button
                                onClick={(e) => { e.stopPropagation(); askDeleteSchedule(s); }}
                                title="Hapus jadwal"
                                className="p-2 rounded-lg hover:bg-admin-danger-bg border border-transparent hover:border-admin-danger-border transition-all text-admin-text-2 hover:text-admin-danger-bar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
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
              onClick={handleMassScan}
              disabled={isScanningMass}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-bold rounded-xl hover:bg-admin-accent/90 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isScanningMass ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Memindai AI...
                </>
              ) : (
                <>
                  <ScanSearch size={16} /> Pindai AI Massal
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
                              handlePreviewFile(m.url_bukti_ayah.kerja!, `${m.nama} - Bukti Kerja Ayah`)
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-accent/20 text-admin-accent-ink px-2 py-1 rounded hover:bg-admin-accent/25 transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </button>
                        )}
                        {m.url_bukti_ayah.gaji && (
                          <button
                            onClick={() =>
                              handlePreviewFile(m.url_bukti_ayah.gaji!, `${m.nama} - Bukti Gaji Ayah`)
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
                              handlePreviewFile(m.url_bukti_ibu.kerja!, `${m.nama} - Bukti Kerja Ibu`)
                            }
                            className="inline-flex items-center gap-1 text-[10px] bg-admin-danger-border text-admin-danger-text px-2 py-1 rounded hover:bg-admin-danger-border transition-colors"
                          >
                            <FileImage size={12} /> Kerja
                          </button>
                        )}
                        {m.url_bukti_ibu.gaji && (
                          <button
                            onClick={() =>
                              handlePreviewFile(m.url_bukti_ibu.gaji!, `${m.nama} - Bukti Gaji Ibu`)
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
                        {m.url_bukti_lain && (
                          <button
                            onClick={() =>
                              handlePreviewFile(m.url_bukti_lain!, `${m.nama} - Bukti Pendapatan Lain`)
                            }
                            className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-admin-surface text-admin-text-2 px-2 py-1.5 rounded hover:bg-admin-accent/5 hover:text-admin-accent transition-colors border border-admin-border"
                            title="Lihat Bukti Pendapatan Lain"
                          >
                            <FileImage size={12} /> Penghasilan Lain
                          </button>
                        )}
                        {m.url_scan_kk && (
                          <button
                            onClick={() =>
                              handlePreviewFile(m.url_scan_kk!, `${m.nama} - Kartu Keluarga`)
                            }
                            className="inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold bg-admin-warn-border text-admin-warn-text px-2 py-1.5 rounded hover:bg-admin-warn-border transition-colors border border-admin-warn-border"
                            title="Lihat Kartu Keluarga"
                          >
                            <ExternalLink size={12} /> Kartu Keluarga
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
                            className={`inline-flex w-full justify-center items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded border ${m.status_anomali ? "bg-admin-danger-bg text-admin-danger-text border-admin-danger-border" : "bg-admin-accent/10 text-admin-accent-ink border-admin-accent/25"}`}
                          >
                            {m.status_anomali ? (
                              <>
                                <AlertCircle size={12} className="shrink-0" />{" "}
                                Data Tidak Sesuai
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
                          case "menunggu_verifikasi":
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200">
                                <Clock size={14} /> Menunggu Verifikasi
                              </span>
                            );
                          case "dalam_verifikasi":
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                                <Loader2 size={14} className="animate-spin" /> Dalam Verifikasi
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
              {/* File Preview */}
              <div className="p-4 flex items-center justify-center bg-admin-surface-soft max-h-[75vh] overflow-auto">
                {previewImage.url.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={previewImage.url}
                    title={`Preview - ${previewImage.nama}`}
                    className="w-full h-[70vh] rounded-lg shadow-sm bg-white"
                  />
                ) : (
                  <img
                    src={previewImage.url}
                    alt={`Preview - ${previewImage.nama}`}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showMassScanModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-admin-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-admin-accent/10 text-admin-accent rounded-xl">
                    <ScanSearch size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-admin-accent text-lg">
                      Pemindaian AI Massal
                    </h3>
                    <p className="text-xs text-admin-text-2">
                      Memproses dokumen yang Menunggu Verifikasi
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-semibold text-admin-text-1">
                    <span>Progres: {massScanProgress.current} / {massScanProgress.total}</span>
                    <span>{Math.round((massScanProgress.current / (massScanProgress.total || 1)) * 100)}%</span>
                  </div>

                  <div className="w-full bg-admin-border h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-admin-accent transition-all duration-300"
                      style={{ width: `${(massScanProgress.current / (massScanProgress.total || 1)) * 100}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-admin-accent/5 rounded-xl p-3 border border-admin-accent/10">
                      <p className="text-[10px] uppercase font-bold text-admin-text-2">Berhasil Diproses</p>
                      <p className="text-xl font-black text-admin-accent">{massScanProgress.success}</p>
                    </div>
                    <div className="bg-admin-warn-bg/20 rounded-xl p-3 border border-admin-warn-border">
                      <p className="text-[10px] uppercase font-bold text-admin-warn-text">Gagal Diproses</p>
                      <p className="text-xl font-black text-admin-warn-text">{massScanProgress.fail}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-admin-background border-t border-admin-border flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl border-admin-border"
                  onClick={() => {
                    setIsScanningMass(false);
                    setShowMassScanModal(false);
                  }}
                >
                  {isScanningMass ? "Hentikan Pemindaian" : "Tutup"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dialog Aksi Jadwal (Ubah / Perpanjang / Buka kembali) ── */}
      <AnimatePresence>
        {actionDialog && (() => {
          const d = actionDialog;
          return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActionDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-admin-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-admin-border">
                <div>
                  <p className="font-bold text-admin-accent text-sm">
                    {d.status === "BERAKHIR" ? "Buka Kembali Periode"
                      : isDeadlineOnly(d.status) ? "Perpanjang Batas Pengisian"
                      : "Ubah Jadwal"}
                  </p>
                  <p className="text-xs text-admin-text-2 mt-0.5">{d.schedule.label}</p>
                </div>
                <button
                  onClick={() => setActionDialog(null)}
                  className="p-1.5 rounded-lg hover:bg-admin-accent/10 text-admin-text-2"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* Info jadwal lama */}
                <div className="rounded-lg bg-admin-surface-soft border border-admin-border p-3 text-xs text-admin-text-2 space-y-1">
                  {d.schedule.waktu_mulai && (
                    <p>Waktu mulai: <span className="font-semibold text-admin-accent">{formatDate(d.schedule.waktu_mulai)}</span></p>
                  )}
                  <p>Batas saat ini: <span className="font-semibold text-admin-accent">{formatDate(d.schedule.deadline)}</span></p>
                  {d.belumKirim !== null && (
                    <p className="text-admin-warn-text font-medium">{d.belumKirim} mahasiswa belum mengirim laporan</p>
                  )}
                  {d.status === "BERAKHIR" && (
                    <p className="text-amber-700">Periode ini sudah berakhir. Pembukaan kembali akan mengaktifkan periode.</p>
                  )}
                </div>

                {/* Form berdasarkan status */}
                {!isDeadlineOnly(d.status) ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">Waktu Mulai (WIB)</label>
                      <input
                        type="datetime-local"
                        value={actionForm.waktu_mulai}
                        onChange={(e) => {
                          const val = e.target.value;
                          setActionForm((f) => ({
                            ...f,
                            waktu_mulai: val,
                            // auto-fill deadline jika masih kosong
                            deadline: f.deadline ? f.deadline : addOneMonthToWibInput(val),
                          }));
                        }}
                        className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">Batas Pengisian (WIB) <span className="text-admin-danger-bar">*</span></label>
                      <input
                        type="datetime-local"
                        value={actionForm.deadline}
                        onChange={(e) => setActionForm((f) => ({ ...f, deadline: e.target.value }))}
                        className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text-2 mb-2">Batas Pengisian Baru</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={actionForm.extendMode === "+7"}
                            onChange={() => {
                              const base = d.status === "BERAKHIR"
                                ? utcIsoToWibInput(new Date())
                                : utcIsoToWibInput(d.schedule.deadline);
                              setActionForm((f) => ({
                                ...f,
                                extendMode:     "+7",
                                customDeadline: addDaysToWibInput(base, 7),
                              }));
                            }}
                            className="accent-admin-accent"
                          />
                          <span className="text-sm text-admin-accent">
                            +7 hari → {actionForm.extendMode === "+7" && actionForm.customDeadline
                              ? formatDate(actionForm.customDeadline)
                              : "—"}
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={actionForm.extendMode === "custom"}
                            onChange={() => setActionForm((f) => ({ ...f, extendMode: "custom" }))}
                            className="accent-admin-accent"
                          />
                          <span className="text-sm text-admin-text-2">Tanggal khusus</span>
                        </label>
                        {actionForm.extendMode === "custom" && (
                          <input
                            type="datetime-local"
                            value={actionForm.customDeadline}
                            onChange={(e) => setActionForm((f) => ({ ...f, customDeadline: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent text-admin-accent mt-1"
                          />
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Catatan opsional */}
                <div>
                  <label className="block text-xs font-semibold text-admin-text-2 mb-1.5">Catatan (opsional)</label>
                  <input
                    type="text"
                    value={actionForm.catatan}
                    onChange={(e) => setActionForm((f) => ({ ...f, catatan: e.target.value }))}
                    placeholder="Alasan perubahan..."
                    className="w-full px-3 py-2.5 text-sm border border-admin-border rounded-lg focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 text-admin-accent placeholder:text-admin-text-2/50"
                  />
                </div>

                {actionError && (
                  <div className="flex items-start gap-2 rounded-lg border border-admin-danger-border bg-admin-danger-bg p-3 text-sm text-admin-danger-text">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p>{actionError}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-admin-border">
                <button
                  onClick={() => setActionDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-admin-text-2 border border-admin-border rounded-xl hover:bg-admin-accent/5 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAction}
                  disabled={savingAction}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
                >
                  {savingAction ? <Loader2 size={14} className="animate-spin" /> : null}
                  {d.status === "BERAKHIR" ? "Buka & Aktifkan"
                    : isDeadlineOnly(d.status) ? "Perpanjang"
                    : "Simpan Perubahan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Konfirmasi hapus periode ── */}
      <ConfirmModal
        open={deleteTarget !== null}
        variant="danger"
        title="Hapus periode evaluasi?"
        description={
          deleteError ??
          `"${deleteTarget?.label ?? ""}" akan dihapus permanen beserta jadwal dan catatan perubahannya. Tindakan ini tidak bisa dibatalkan.`
        }
        confirmLabel={deleteError ? "Coba lagi" : "Hapus periode"}
        cancelLabel={deleteError ? "Tutup" : "Batal"}
        loading={deletingSchedule}
        onConfirm={confirmDeleteSchedule}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />

      </div>
    </div>
  );
}
