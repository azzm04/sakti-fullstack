"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { telegramAPI } from "@/lib/api";

export interface MonevSchedule {
  id: string;
  label: string;
  waktu_mulai: string | null;
  deadline: string;
  is_active: boolean;
  created_at: string;
}

interface RiwayatMonevClientProps {
  initialSchedules: MonevSchedule[];
  initialSubmittedIds: string[];
}

// ─── DATE HELPERS (Asia/Jakarta) ──────────────────────────────────────────
function isValidDate(d: string | null | undefined): boolean {
  if (!d) return false;
  const time = new Date(d).getTime();
  return !isNaN(time);
}

function formatDateID(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso!));
}

function formatDateTimeID(iso: string | null | undefined): string {
  if (!isValidDate(iso)) return "-";
  const d = new Date(iso!);
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Jakarta",
  }).format(d).replace(":", ".");
  return `${dateStr}, pukul ${timeStr} WIB`;
}

export default function RiwayatMonevClient({
  initialSchedules,
  initialSubmittedIds,
}: RiwayatMonevClientProps) {
  // Hindari state salinan props yang stale; gunakan useMemo untuk Set submitted
  const schedules = initialSchedules;
  const submittedSet = useMemo(
    () => new Set(initialSubmittedIds),
    [initialSubmittedIds]
  );

  // Waktu aktual (diperbarui otomatis setiap 30 detik untuk transisi deadline dinamis)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // ─── STATE TELEGRAM ───────────────────────────────────────────────────────
  const [telegramStatus, setTelegramStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error: boolean;
  }>({ connected: false, loading: true, error: false });
  const [isOpeningBot, setIsOpeningBot] = useState(false);
  const [hasOpenedBot, setHasOpenedBot] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const fetchTelegramStatus = useCallback(async () => {
    setTelegramStatus((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const res = await fetch("/api/auth/telegram/status");
      if (!res.ok) throw new Error("Gagal mengambil status");
      const data = await res.json();
      setTelegramStatus({
        connected: data.connected === true,
        loading: false,
        error: false,
      });
    } catch {
      setTelegramStatus({ connected: false, loading: false, error: true });
    }
  }, []);

  const handleOpenBot = async () => {
    setIsOpeningBot(true);
    setActivationError(null);
    try {
      const data = await telegramAPI.activate();
      if (data?.deepLink) {
        setHasOpenedBot(true);
        window.open(data.deepLink, "_blank");
      } else {
        setActivationError(data?.error ?? "Gagal mendapatkan tautan bot Telegram.");
      }
    } catch {
      setActivationError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsOpeningBot(false);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();

    // Auto-refresh saat mahasiswa kembali ke tab ini setelah membuka Telegram bot
    const handleFocus = () => fetchTelegramStatus();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchTelegramStatus]);

  // ─── ILUSTRASI HERO ───────────────────────────────────────────────────────
  const HERO_IMAGE_SRC = "/illustrations/monev-group-animated.svg";
  const [hasHeroImage, setHasHeroImage] = useState(false);

  useEffect(() => {
    const img = new window.Image();
    img.src = HERO_IMAGE_SRC;
    img.onload = () => setHasHeroImage(true);
    img.onerror = () => setHasHeroImage(false);
  }, []);

  // ─── FILTER & PENGELOMPOKAN JADWAL ─────────────────────────────────────────
  // Periode yang dapat diisi saat ini (aktif, sudah mulai / tidak ada start, deadline belum lewat)
  const fillablePeriods = useMemo(() => {
    return schedules
      .filter((s) => {
        const deadlinePassed =
          isValidDate(s.deadline) && new Date(s.deadline).getTime() < now;
        const started =
          !s.waktu_mulai ||
          (isValidDate(s.waktu_mulai) &&
            new Date(s.waktu_mulai).getTime() <= now);
        return s.is_active && started && !deadlinePassed;
      })
      .sort((a, b) => {
        // Urutkan deterministik: tenggat terdekat terlebih dahulu
        const timeA = isValidDate(a.deadline)
          ? new Date(a.deadline).getTime()
          : 0;
        const timeB = isValidDate(b.deadline)
          ? new Date(b.deadline).getTime()
          : 0;
        return timeA - timeB;
      });
  }, [schedules, now]);

  // State pemilih periode jika terdapat beberapa periode aktif yang dapat diisi
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const currentPeriod = useMemo(() => {
    if (fillablePeriods.length === 0) return null;
    return (
      fillablePeriods.find((p) => p.id === selectedPeriodId) ??
      fillablePeriods[0]
    );
  }, [fillablePeriods, selectedPeriodId]);

  // Riwayat evaluasi: periode yang sudah selesai bagi mahasiswa ini.
  //
  // Syaratnya positif (sudah dikirim ATAU deadline lewat), bukan "semua yang
  // bukan periode aktif dan bukan jadwal mendatang". Rumus lama mensyaratkan
  // is_active untuk mengenali jadwal mendatang, sehingga periode yang
  // disembunyikan admin dan belum dimulai lolos ke sini dan tampil seolah
  // periode yang sudah berakhir.
  const historySchedules = useMemo(() => {
    const fillableIds = new Set(fillablePeriods.map((p) => p.id));
    return schedules
      .filter((s) => {
        // Periode yang sedang bisa diisi punya bagiannya sendiri di atas
        if (fillableIds.has(s.id)) return false;

        // Sudah dikirim — selesai bagi mahasiswa ini, apa pun status jadwalnya
        if (submittedSet.has(s.id)) return true;

        // Belum dikirim: hanya masuk riwayat kalau kesempatannya sudah habis
        return isValidDate(s.deadline) && new Date(s.deadline).getTime() < now;
      })
      .sort((a, b) => {
        const timeA = isValidDate(a.deadline)
          ? new Date(a.deadline).getTime()
          : 0;
        const timeB = isValidDate(b.deadline)
          ? new Date(b.deadline).getTime()
          : 0;
        return timeB - timeA; // Riwayat: terbaru lebih dahulu
      });
  }, [schedules, fillablePeriods, submittedSet, now]);

  // State tampilkan semua riwayat
  const [showAllHistory, setShowAllHistory] = useState(false);

  const displayedHistory = showAllHistory
    ? historySchedules
    : historySchedules.slice(0, 3);

  return (
    <div
      className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      {/* ─── SECTION 1: HERO (DIPERTAHANKAN SESUAI PERMINTAAN USER) ────────── */}
      {/* Dotted orbital arc */}
      <div className="pointer-events-none absolute right-10 top-0 w-72 h-72 rounded-full border border-dashed border-blue-100/40 hidden md:block" />

      {/* Top: Judul + Slot Gambar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Teks Judul & Deskripsi */}
        <div className="max-w-xl md:pt-6">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0B1536] tracking-tight leading-[1.25]">
            Monitoring dan Evaluasi<br />KIP Kuliah
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed max-w-md">
            Perbarui laporan kondisi ekonomi Anda untuk mendukung proses evaluasi KIP Kuliah.
          </p>
        </div>

        {/* Slot Gambar / Ilustrasi di sebelah kanan */}
        <div className="relative shrink-0 flex items-start justify-center self-center md:self-auto w-full md:w-auto md:-mt-8">
          <div className="relative w-72 h-56 sm:w-80 sm:h-64 md:w-96 md:h-72 lg:w-[400px] lg:h-[300px] flex items-center justify-center">
            {hasHeroImage ? (
              <Image
                src={HERO_IMAGE_SRC}
                alt="Ilustrasi Monitoring dan Evaluasi"
                fill
                className="object-contain object-top drop-shadow-md select-none pointer-events-none"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center pointer-events-none select-none" />
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: KARTU PERIODE BERJALAN ──────────────────────────────── */}
      <section aria-labelledby="current-monev-heading">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 sm:p-6">
          {currentPeriod ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              {/* Informasi Periode */}
              <div className="space-y-2 min-w-0">
                {fillablePeriods.length > 1 && (
                  <div className="mb-2">
                    <label
                      htmlFor="period-select"
                      className="block text-[13px] leading-[20px] text-[#475569] mb-1 font-medium"
                    >
                      Pilih Periode Aktif:
                    </label>
                    <select
                      id="period-select"
                      value={currentPeriod.id}
                      onChange={(e) => setSelectedPeriodId(e.target.value)}
                      className="text-[13px] text-[#0F172A] bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#000352]"
                    >
                      {fillablePeriods.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <h2
                  id="current-monev-heading"
                  className="text-[18px] leading-[26px] font-semibold text-[#0F172A] break-words"
                >
                  {currentPeriod.label}
                </h2>

                <p className="text-[13px] leading-[20px] text-[#475569]">
                  <span className="font-medium text-[#0F172A]">Batas pengisian:</span>{" "}
                  {formatDateTimeID(currentPeriod.deadline)}
                </p>

                <p className="text-[14px] leading-[22px] text-[#475569]">
                  {submittedSet.has(currentPeriod.id)
                    ? "Laporan evaluasi Anda telah berhasil dikirim. Anda dapat melihat kembali rincian data laporan yang tersimpan."
                    : "Lengkapi data ekonomi dan dokumen pendukung sebelum batas pengisian."}
                </p>

                <p className="text-[13px] leading-[20px] text-[#475569]">
                  <span className="font-medium text-[#0F172A]">Status laporan:</span>{" "}
                  {submittedSet.has(currentPeriod.id)
                    ? "Laporan terkirim"
                    : "Laporan belum dikirim"}
                </p>
              </div>

              {/* Tombol Utama */}
              <div className="shrink-0 flex items-center sm:justify-end">
                <Link
                  href={`/mahasiswa/monev/${currentPeriod.id}`}
                  className="w-full sm:w-auto inline-flex h-11 min-h-[44px] items-center justify-center px-6 bg-[#000352] hover:bg-[#1a1e68] text-white font-medium rounded-lg text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                >
                  {submittedSet.has(currentPeriod.id)
                    ? "Lihat laporan"
                    : "Isi Monev"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <h2
                id="current-monev-heading"
                className="text-[18px] leading-[26px] font-semibold text-[#0F172A]"
              >
                Tidak ada periode Monev yang aktif saat ini.
              </h2>
              <p className="mt-2 text-[14px] leading-[22px] text-[#475569]">
                Jadwal pengisian berikutnya akan diinformasikan oleh pengelola beasiswa.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 3: PENGINGAT TELEGRAM ────────────────────────────────── */}
      <section aria-labelledby="telegram-heading">
        <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 sm:p-6">
          <h2
            id="telegram-heading"
            className="text-[18px] leading-[26px] font-semibold text-[#0F172A]"
          >
            Pengingat Telegram
          </h2>

          {telegramStatus.connected ? (
            <div className="mt-2">
              <p className="text-[14px] leading-[22px] text-[#475569]">
                Akun Telegram sudah terhubung. Pengingat akan dikirim melalui bot SAKTI.
              </p>
            </div>
          ) : (
            <div>
              <p className="mt-2 text-[14px] leading-[22px] text-[#475569]">
                Hubungkan akun Telegram untuk menerima pengingat batas pengisian Monev.
              </p>

              {/* 3 Langkah Tanpa Kotak, Background, atau Garis Penghubung */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="block text-[14px] font-semibold text-[#000352] mb-1">
                    01
                  </span>
                  <p className="text-[14px] leading-[22px] font-semibold text-[#0F172A]">
                    Buka bot SAKTI
                  </p>
                  <p className="text-[13px] leading-[20px] text-[#475569] mt-0.5">
                    Buka Telegram melalui tombol di bawah.
                  </p>
                </div>

                <div>
                  <span className="block text-[14px] font-semibold text-[#000352] mb-1">
                    02
                  </span>
                  <p className="text-[14px] leading-[22px] font-semibold text-[#0F172A]">
                    Tekan Start / Mulai
                  </p>
                  <p className="text-[13px] leading-[20px] text-[#475569] mt-0.5">
                    Hubungkan akun melalui percakapan bot.
                  </p>
                </div>

                <div>
                  <span className="block text-[14px] font-semibold text-[#000352] mb-1">
                    03
                  </span>
                  <p className="text-[14px] leading-[22px] font-semibold text-[#0F172A]">
                    Periksa koneksi
                  </p>
                  <p className="text-[13px] leading-[20px] text-[#475569] mt-0.5">
                    Kembali ke SAKTI untuk memastikan akun terhubung.
                  </p>
                </div>
              </div>

              {/* Aksi & Pemeriksaan Koneksi */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {telegramStatus.error ? (
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] leading-[20px] text-red-600">
                      Status koneksi belum dapat diperiksa.
                    </span>
                    <button
                      type="button"
                      onClick={fetchTelegramStatus}
                      disabled={telegramStatus.loading}
                      className="text-[13px] font-medium text-[#000352] hover:underline disabled:opacity-50"
                    >
                      Coba lagi
                    </button>
                  </div>
                ) : hasOpenedBot ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={fetchTelegramStatus}
                      disabled={telegramStatus.loading}
                      className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#000352] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#1a1e68] disabled:opacity-60"
                    >
                      {telegramStatus.loading ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Memeriksa koneksi...</span>
                        </>
                      ) : (
                        <>
                          <RotateCw size={15} />
                          <span>Periksa koneksi</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenBot}
                      disabled={isOpeningBot || telegramStatus.loading}
                      className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#000352] bg-white px-4 text-[14px] font-medium text-[#000352] transition-colors hover:bg-[#EEF2FF] disabled:opacity-60"
                    >
                      <span>Buka Bot Telegram</span>
                      <ExternalLink size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenBot}
                    disabled={isOpeningBot || telegramStatus.loading}
                    className="inline-flex h-11 min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#000352] bg-white px-4 text-[14px] font-medium text-[#000352] transition-colors hover:bg-[#EEF2FF] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                  >
                    {isOpeningBot ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        <span>Membuka Telegram...</span>
                      </>
                    ) : (
                      <>
                        <span>Buka Bot Telegram</span>
                        <ExternalLink size={15} />
                      </>
                    )}
                  </button>
                )}

                {telegramStatus.loading && !hasOpenedBot && (
                  <span className="inline-flex items-center gap-2 text-[13px] leading-[20px] text-[#475569]">
                    <Loader2 size={14} className="animate-spin text-[#475569]" />
                    Memeriksa status...
                  </span>
                )}
              </div>

              {activationError && (
                <p className="mt-3 text-[13px] leading-[20px] text-red-600">
                  {activationError}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 4: RIWAYAT MONEV ──────────────────────────────────────── */}
      <section aria-labelledby="history-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2
            id="history-heading"
            className="text-[18px] leading-[26px] font-semibold text-[#0F172A]"
          >
            Riwayat Monev
          </h2>
          {historySchedules.length > 0 && (
            <span className="text-[13px] leading-[20px] text-[#475569]">
              Total: {historySchedules.length} periode
            </span>
          )}
        </div>

        <div className="rounded-lg border border-[#E2E8F0] bg-white overflow-hidden">
          {historySchedules.length === 0 ? (
            <div className="p-6 text-center text-[14px] leading-[22px] text-[#475569]">
              Belum ada riwayat laporan Monev.
            </div>
          ) : (
            <div className="divide-y divide-[#E2E8F0]">
              {displayedHistory.map((item) => {
                const isSubmitted = submittedSet.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="py-4 px-4 sm:py-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6"
                  >
                    {/* Informasi Periode */}
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] break-words">
                        {item.label}
                      </h3>
                      <p className="text-[13px] leading-[20px] text-[#475569]">
                        Batas pengisian: {formatDateID(item.deadline)}
                      </p>
                      <p className="text-[13px] leading-[20px] text-[#475569]">
                        <span className="font-medium text-[#0F172A]">Status:</span>{" "}
                        {isSubmitted ? "Laporan terkirim" : "Tidak mengisi"}
                      </p>
                    </div>

                    {/* Tautan Lihat Laporan jika tersedia */}
                    <div className="shrink-0 flex items-center sm:justify-end">
                      {isSubmitted ? (
                        <Link
                          href={`/mahasiswa/monev/${item.id}`}
                          className="inline-flex items-center text-[13px] font-medium text-[#000352] hover:underline"
                        >
                          Lihat laporan →
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {historySchedules.length > 3 && (
            <div className="border-t border-[#E2E8F0] bg-slate-50/50 p-3 text-center">
              <button
                type="button"
                onClick={() => setShowAllHistory((prev) => !prev)}
                className="text-[13px] font-medium text-[#000352] hover:underline"
              >
                {showAllHistory
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua riwayat (${historySchedules.length})`}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
