"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  ScanSearch,
  AlertCircle,
  Trash2,
  ChevronDown,
  Plus,
  X,
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
  new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });


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
  initialTab?: "jadwal" | "hasil";
  initialPeriodId?: string;
}

export default function MonevClient({ initialSchedules, initialTab = "jadwal", initialPeriodId }: MonevClientProps) {
  const [activeTab, setActiveTab] = useState<"jadwal" | "hasil">(initialTab);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState("semua");
  const [dataError, setDataError] = useState<string | null>(null);
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
    initialPeriodId && initialSchedules.some((period) => period.id === initialPeriodId) ? initialPeriodId : initialSchedules[0]?.id ?? ""
  );
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
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
      const nextSchedules: MonevSchedule[] = json.data ?? [];
      setSchedules(nextSchedules);
      setSelectedScheduleId((current) => nextSchedules.some((schedule) => schedule.id === current) ? current : nextSchedules[0]?.id ?? "");
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
    setDataError(null);
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
        setDataError("Laporan belum dapat dimuat. Silakan coba lagi.");
      }
    } catch {
      setData([]);
      setDataError("Laporan belum dapat dimuat. Periksa koneksi dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedScheduleId]);

  useEffect(() => {
    if (activeTab !== "hasil") return;
    const timer = setTimeout(() => fetchData(), search ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search, activeTab]);

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
    } catch {
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
      } catch {
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

  const selectedSchedule = schedules.find((schedule) => schedule.id === selectedScheduleId);
  const detail = data.find((row) => row.id === detailId);
  const visibleRows = filteredData.filter((row) => submissionStatus === "semua" || row.status_pengisian === submissionStatus);
  const resultLabel = (row: AdminMonevData) => {
    if (row.status_pengisian === "Belum") return "—";
    if (scanningId === row.id) return "Sedang diperiksa";
    if (row.hasil_deteksi_yolo === 0) return "Dokumen belum terbaca";
    const status = getMonevStatus(row);
    if (status === "melebihi_batas") return "Pendapatan perlu ditinjau";
    if (status === "data_tidak_sesuai") return "Data perlu ditinjau";
    return status === "sesuai" ? "Tidak ada indikasi perbedaan" : "Belum diperiksa";
  };
  const showResults = (id: string) => {
    if (id !== selectedScheduleId) setLoading(true);
    setSelectedScheduleId(id);
    setPage(1);
    setSubmissionStatus("semua");
    setFilters([]);
    setDetailId(null);
    setActiveTab("hasil");
  };
  const tabs = [
    { id: "jadwal", label: "Jadwal pengisian" },
    { id: "hasil", label: "Hasil Monev" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#334155]" style={{ fontFamily: "Roboto, sans-serif" }}>
      <PageHeader title="Monitoring dan Evaluasi" description="Kelola periode pengisian dan tinjau laporan mahasiswa." />
      <div className="px-4 sm:px-[30px] pt-6 pb-8">
        <div role="tablist" aria-label="Menu Monev" className="mb-6 flex gap-6 overflow-x-auto border-b border-[#E2E8F0]">
          {tabs.map((tab, index) => (
            <button key={tab.id} id={`tab-${tab.id}`} role="tab" aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                let next = index;
                if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
                else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
                else if (event.key === "Home") next = 0;
                else if (event.key === "End") next = tabs.length - 1;
                else return;
                event.preventDefault();
                setActiveTab(tabs[next].id);
                document.getElementById(`tab-${tabs[next].id}`)?.focus();
              }}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#000352]/30 ${activeTab === tab.id ? "border-[#000352] text-[#000352]" : "border-transparent text-[#64748B] hover:text-[#000352]"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <section id="panel-jadwal" role="tabpanel" aria-labelledby="tab-jadwal" hidden={activeTab !== "jadwal"}>
          <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E2E8F0] px-5 py-5 sm:px-6">
              <div><h2 className="text-lg font-semibold text-[#0B1536]">Periode pengisian</h2><p className="mt-1 text-sm text-[#64748B]">Atur waktu mulai dan batas pengisian Monev.</p></div>
              <button onClick={() => setShowScheduleForm(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#000352] px-4 text-sm font-medium text-white hover:bg-[#151965]"><Plus size={16} /> Buat periode</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr>{["Periode", "Mulai (WIB)", "Batas pengisian (WIB)", "Status", "Aksi"].map((label) => <th key={label} scope="col" className="px-5 py-3 font-medium">{label}</th>)}</tr></thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {scheduleLoading ? <tr><td colSpan={5} className="p-10 text-center text-[#64748B]">Memuat periode...</td></tr> : schedules.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-[#64748B]">Belum ada periode. Buat periode untuk membuka pengisian Monev.</td></tr> : schedules.map((schedule) => {
                    const status = statusOf(schedule);
                    const action = status === "BERAKHIR" ? "Buka kembali" : isDeadlineOnly(status) ? "Perpanjang" : "Ubah jadwal";
                    return <tr key={schedule.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-5"><p className="font-medium text-[#0B1536]">{schedule.label}</p><p className="mt-1 text-xs text-[#64748B]">{schedule.jumlah_laporan ?? 0} laporan masuk</p></td>
                      <td className="px-5 py-5 text-[#475569]">{schedule.waktu_mulai ? formatDate(schedule.waktu_mulai) : "Tidak ditentukan"}</td>
                      <td className="px-5 py-5 text-[#475569]">{formatDate(schedule.deadline)}</td>
                      <td className="px-5 py-5"><span title={STATUS_BADGE[status].hint} className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${status === "BERLANGSUNG" ? "text-emerald-700" : "text-[#64748B]"}`}><Clock size={14} />{STATUS_BADGE[status].label}</span></td>
                      <td className="px-5 py-5"><div className="flex items-center gap-3 whitespace-nowrap"><button onClick={() => showResults(schedule.id)} className="font-medium text-[#000352] hover:underline">Lihat hasil</button><button onClick={() => openActionDialog(schedule)} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs hover:bg-slate-50">{action}</button><button onClick={() => askDeleteSchedule(schedule)} aria-label={`Hapus periode ${schedule.label}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"><Trash2 size={16} /></button></div></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <Dialog open={showScheduleForm} onOpenChange={(open) => { if (!savingSchedule) setShowScheduleForm(open); }}>
          <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto rounded-lg bg-white">
            <DialogTitle>Buat periode Monev</DialogTitle>
            <DialogDescription>Tentukan periode akademik dan waktu pengisian. Semua waktu menggunakan WIB.</DialogDescription>
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
                          <p className="text-sm font-medium text-admin-accent">{previewLabel}</p>
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
                                aria-controls="monev-period-options"
                                aria-label="Periode akademik"
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
                                <CommandList id="monev-period-options">
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
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-semibold rounded-lg hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
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
                          className="px-5 py-2.5 text-sm font-semibold text-admin-text-2 border border-admin-border rounded-lg hover:bg-admin-accent/5 transition-all"
                        >
                          Batal
                        </button>
                      </div>

          </DialogContent>
        </Dialog>

        <section id="panel-hasil" role="tabpanel" aria-labelledby="tab-hasil" hidden={activeTab !== "hasil"}>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="w-full sm:max-w-md"><label htmlFor="monev-result-period" className="mb-2 block text-sm font-medium text-[#0B1536]">Periode Monev</label><select id="monev-result-period" value={selectedScheduleId} onChange={(event) => showResults(event.target.value)} className="min-h-11 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#000352]/20">{schedules.length === 0 && <option value="">Belum ada periode</option>}{schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.label}</option>)}</select></div>
            {selectedSchedule && <p className="text-sm text-[#64748B]">Batas pengisian: {formatDate(selectedSchedule.deadline)} WIB · {STATUS_BADGE[statusOf(selectedSchedule)].label}</p>}
          </div>
          {!selectedSchedule ? <div className="rounded-lg border border-[#E2E8F0] bg-white p-10 text-center text-sm text-[#64748B]">Buat periode pengisian terlebih dahulu untuk melihat hasil Monev.</div> : <>
          <div className="mb-6 grid grid-cols-1 divide-y divide-[#E2E8F0] overflow-hidden rounded-lg border border-[#E2E8F0] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[{ label: "Total mahasiswa", value: stats.total }, { label: "Sudah mengirim", value: stats.sudah }, { label: "Belum mengirim", value: stats.belum }].map((item) => <div key={item.label} className="px-6 py-5"><p className="text-sm text-[#64748B]">{item.label}</p><p className="mt-2 text-2xl font-semibold tabular-nums text-[#0B1536]">{loading || dataError ? "—" : item.value.toLocaleString("id-ID")}</p></div>)}
          </div>
          {search && <p className="mb-3 text-xs text-[#64748B]">Jumlah mahasiswa mengikuti pencarian nama atau NIM.</p>}
      {!detail && <>
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
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari NIM atau Nama..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-admin-border rounded-lg bg-admin-surface text-admin-accent focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 transition-all shadow-sm placeholder:text-admin-text-2/50"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Status pengisian pada halaman ini" value={submissionStatus} onChange={(event) => setSubmissionStatus(event.target.value)} className="h-10 rounded-lg border border-admin-border bg-white px-3 text-sm"><option value="semua">Semua pengisian</option><option value="Sudah">Sudah mengirim</option><option value="Belum">Belum mengirim</option></select>
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
              disabled={isScanningMass || loading || !data.some((m) => m.status_pengisian === "Sudah" && m.hasil_deteksi_yolo === null)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-medium rounded-lg hover:bg-admin-accent/90 transition-all  disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isScanningMass ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Memindai AI...
                </>
              ) : (
                <>
                  <ScanSearch size={16} /> Pindai AI halaman ini
                </>
              )}
            </button>
          </div>
        </div>
      </div>


          <p className="mb-3 text-xs text-[#64748B]">Filter pengisian, pemeriksaan, dan pemindaian AI berlaku pada data di halaman ini.</p>
      </>}
          {dataError ? <div role="alert" className="rounded-lg border border-red-200 bg-white p-6 text-sm text-red-700">{dataError}<button onClick={fetchData} className="ml-3 underline">Coba lagi</button></div> : detail ? (
            <div className="rounded-lg border border-[#E2E8F0] bg-white">
              <div className="border-b border-[#E2E8F0] p-6"><button onClick={() => setDetailId(null)} className="mb-4 text-sm text-[#000352] hover:underline">Kembali ke daftar laporan</button><h2 className="text-xl font-semibold text-[#0B1536]">{detail.nama}</h2><p className="mt-1 text-sm text-[#64748B]">{detail.nim} · {detail.prodi}</p><p className="mt-2 text-sm text-[#64748B]">{selectedSchedule.label}</p></div>
              <div className="grid gap-6 p-6 md:grid-cols-2">
                {[{ title: "Data ayah", job: detail.pekerjaan_ayah, income: detail.penghasilan_ayah, files: detail.url_bukti_ayah }, { title: "Data ibu", job: detail.pekerjaan_ibu, income: detail.penghasilan_ibu, files: detail.url_bukti_ibu }].map((parent) => <section key={parent.title}><h3 className="mb-3 font-semibold text-[#0B1536]">{parent.title}</h3><dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#64748B]">Pekerjaan</dt><dd>{parent.job}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#64748B]">Penghasilan</dt><dd>{formatRp(parent.income)}</dd></div></dl><div className="mt-3 flex flex-wrap gap-3">{[{ path: parent.files.kerja, label: "Bukti pekerjaan" }, { path: parent.files.gaji, label: "Bukti penghasilan" }].map((file) => file.path ? <button key={file.label} onClick={() => handlePreviewFile(file.path!, `${detail.nama} - ${parent.title} - ${file.label}`)} className="inline-flex items-center gap-1.5 text-sm text-[#000352] hover:underline"><FileImage size={14} />{file.label}</button> : <span key={file.label} className="text-xs text-[#64748B]">{file.label} tidak tersedia</span>)}</div></section>)}
                <section className="border-t border-[#E2E8F0] pt-5 md:col-span-2"><h3 className="mb-3 font-semibold text-[#0B1536]">Kondisi keluarga</h3><dl className="grid grid-cols-2 gap-5 text-sm sm:grid-cols-4">{[{ label: "Penghasilan lain", value: formatRp(detail.penghasilan_lain) }, { label: "Jumlah tanggungan", value: detail.jumlah_tanggungan }, { label: "Total pendapatan", value: formatRp(detail.total_pendapatan) }, { label: "Pendapatan per tanggungan", value: formatRp(detail.rupiah_per_tanggungan) }].map((item) => <div key={item.label}><dt className="text-[#64748B]">{item.label}</dt><dd className="mt-2 font-medium">{item.value}</dd></div>)}</dl><div className="mt-4 flex flex-wrap gap-4">{[{ path: detail.url_bukti_lain, label: "Bukti penghasilan lain" }, { path: detail.url_scan_kk, label: "Kartu keluarga" }].map((file) => file.path ? <button key={file.label} onClick={() => handlePreviewFile(file.path!, `${detail.nama} - ${file.label}`)} className="inline-flex items-center gap-1.5 text-sm text-[#000352] hover:underline"><FileImage size={14} />{file.label}</button> : <span key={file.label} className="text-xs text-[#64748B]">{file.label} tidak tersedia</span>)}</div></section>
                <section className="border-t border-[#E2E8F0] pt-5 md:col-span-2"><h3 className="font-semibold text-[#0B1536]">Pemeriksaan laporan</h3><p className="mt-2 text-sm">{resultLabel(detail)}</p><p className="mt-2 text-xs text-[#64748B]">Hasil AI menjadi bahan peninjauan admin, bukan keputusan akhir.</p>{detail.hasil_deteksi_yolo !== null && <p className="mt-2 text-sm text-[#64748B]">Jumlah terdeteksi pada KK: {detail.hasil_deteksi_yolo}</p>}<button onClick={() => handleScanSingle(detail.id)} disabled={!!scanningId || isScanningMass || !detail.url_scan_kk} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm text-[#000352] disabled:opacity-50"><ScanSearch size={16} />{scanningId === detail.id ? "Memeriksa..." : "Pindai AI"}</button></section>
              </div>
            </div>
          ) : <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"><tr>{["Mahasiswa", "Program studi", "Pengisian", "Pemeriksaan", "Aksi"].map((label) => <th scope="col" key={label} className="px-5 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-[#E2E8F0]">
              {loading ? <tr><td colSpan={5} className="p-12 text-center text-[#64748B]">Memuat laporan...</td></tr> : visibleRows.length === 0 ? <tr><td colSpan={5} className="p-12 text-center text-[#64748B]">Tidak ada mahasiswa yang sesuai dengan pencarian atau filter.</td></tr> : visibleRows.map((row) => <tr key={row.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-medium text-[#0B1536]">{row.nama}</p><p className="mt-1 text-xs text-[#64748B]">{row.nim}</p></td><td className="px-5 py-4">{row.prodi}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs ${row.status_pengisian === "Sudah" ? "text-emerald-700" : "text-[#64748B]"}`}>{row.status_pengisian === "Sudah" ? <CheckCircle2 size={14} /> : <Clock size={14} />}{row.status_pengisian === "Sudah" ? "Sudah mengirim" : "Belum mengirim"}</span></td><td className="px-5 py-4 text-xs text-[#475569]">{resultLabel(row)}</td><td className="px-5 py-4">{row.status_pengisian === "Sudah" ? <button onClick={() => setDetailId(row.id)} className="whitespace-nowrap font-medium text-[#000352] hover:underline">Lihat detail</button> : <span className="text-[#94A3B8]">—</span>}</td></tr>)}
            </tbody></table></div>
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

          </div>}
          </>}
        </section>

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
              className="relative max-w-4xl max-h-[90vh] w-full mx-4 bg-white rounded-lg shadow-2xl overflow-hidden"
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
              className="bg-admin-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-admin-accent/10 text-admin-accent rounded-lg">
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
                    <div className="bg-admin-accent/5 rounded-lg p-3 border border-admin-accent/10">
                      <p className="text-[10px] uppercase font-bold text-admin-text-2">Berhasil Diproses</p>
                      <p className="text-xl font-black text-admin-accent">{massScanProgress.success}</p>
                    </div>
                    <div className="bg-admin-warn-bg/20 rounded-lg p-3 border border-admin-warn-border">
                      <p className="text-[10px] uppercase font-bold text-admin-warn-text">Gagal Diproses</p>
                      <p className="text-xl font-black text-admin-warn-text">{massScanProgress.fail}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-admin-background border-t border-admin-border flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-lg border-admin-border"
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
              className="bg-admin-surface rounded-lg shadow-xl w-full max-w-md overflow-hidden"
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
                  className="px-4 py-2 text-sm font-medium text-admin-text-2 border border-admin-border rounded-lg hover:bg-admin-accent/5 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveAction}
                  disabled={savingAction}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-admin-accent text-white text-sm font-semibold rounded-lg hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
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
