"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { RotateCw, Loader2, Globe, QrCode as QrCodeIcon, Send } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import QRCode from "react-qr-code";
import { telegramAPI } from "@/lib/api";
import type { TelegramActivation } from "@/schemas";

/**
 * Jalur aktivasi Telegram. Semuanya memakai kode sekali-pakai yang sama:
 *  - app  : tautan t.me — hanya jalan bila aplikasi Telegram terpasang
 *  - web  : tautan web.telegram.org yang tetap membawa kode
 *  - qr   : QR berisi tautan app, untuk dipindai dengan HP
 */
type ActivationPath = "app" | "web" | "qr";

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

/** Ilustrasi jadwal; tinggi batang bersifat dekoratif, bukan jumlah notifikasi. */
function TelegramReminderCard() {
  const reducedMotion = useReducedMotion();
  const animateEntrance = reducedMotion === false;
  const reminders = [
    { day: 30, height: 72 },
    { day: 7, height: 94 },
    { day: 3, height: 116 },
    { day: 2, height: 138 },
    { day: 1, height: 160 },
  ];

  return (
    <aside
      aria-labelledby="reminder-schedule-heading"
      className="min-w-0 self-start rounded-xl border border-[#E2E8F0] bg-white p-5 sm:p-6"
    >
      <h3 id="reminder-schedule-heading" className="text-[15px] font-semibold leading-6 text-[#0F172A]">
        Kapan Anda diingatkan?
      </h3>
      <p className="mt-1 text-[12px] leading-5 text-[#64748B]">
        Anda diingatkan sebelum batas pengisian:
      </p>
    
      <ol aria-label="Pengingat dijadwalkan 30, 7, 3, 2, dan 1 hari sebelum batas pengisian" className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
        {reminders.map(({ day, height }, index) => (
          <li key={day} className="min-w-0">
            <div aria-hidden="true" className="flex h-40 items-end">
              <motion.div
                initial={animateEntrance ? { scaleY: 0.85, opacity: 0 } : false}
                whileInView={{ scaleY: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: animateEntrance ? index * 0.06 : 0, ease: 'easeOut' }}
                style={{ height }}
                className="flex w-full origin-bottom flex-col overflow-hidden rounded-[4px]"
              >
                <div className="h-[100%] shrink-0 border-b-2 border-white bg-[#DCE2EA]" />
              </motion.div>
            </div>
            <p className="mt-2.5 text-center text-[11px] font-medium leading-5 tabular-nums text-[#64748B]">
              {day} hari<span className="sr-only"> sebelum batas pengisian</span>
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-[#EEF2F6] pt-4 text-[12px] leading-5 text-[#64748B]">
        Pengingat periode ini berhenti setelah laporan monev dikirim.
      </p>
    </aside>
  );
}

/** Nomor langkah polos untuk urutan panduan. */
function StepNumber({ number }: { number: number }) {
  return (
    <span
      aria-hidden="true"
      className="w-4 shrink-0 text-[14px] font-medium leading-7 tabular-nums text-[#64748B]"
    >
      {number}.
    </span>
  );
}

/** Tautan jalur cadangan aktivasi — tenang, tidak bersaing dengan tombol utama. */
function AltPathButton({
  label,
  icon,
  busy,
  disabled,
  expanded,
  onClick,
}: {
  label: string;
  icon: "web" | "qr";
  busy: boolean;
  disabled: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={expanded}
      className="inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-md border border-[#E2E8F0] bg-white px-2 py-2 text-[12px] font-medium leading-5 text-[#475569] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#000352] aria-expanded:border-[#94A3B8] aria-expanded:bg-[#F1F5F9] aria-expanded:text-[#000352] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
    >
      {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : icon === "web" ? <Globe size={14} className="shrink-0" aria-hidden="true" /> : <QrCodeIcon size={14} className="shrink-0" aria-hidden="true" />}
      {label}
    </button>
  );
}

/**
 * Video panduan. Letakkan berkasnya di public/videos/tutorial-telegram.mp4;
 * selama berkas itu belum ada, kolom video tidak ditampilkan dan langkah
 * memakai lebar penuh.
 */
const TELEGRAM_TUTORIAL_VIDEO_SRC = "/videos/tutorial-telegram.mp4";

const TELEGRAM_STEPS: {
  title: string;
  description: string;
  action?: "open" | "check";
}[] = [
  {
    title: "Buka bot SAKTI",
    description: "Buka melalui aplikasi, web, atau kode QR.",
    action: "open",
  },
  {
    title: "Tekan Start / Mulai",
    description: "Di Telegram, tekan Start untuk menghubungkan akun.",
  },
  {
    title: "Kembali ke SAKTI",
    description: "Status koneksi diperiksa otomatis saat Anda kembali.",
    action: "check",
  },
];

/**
 * Nama periode untuk tampilan: awalan "Monev KIP-K Undip" dibuang karena
 * konteksnya sudah jelas dari judul halaman. Label yang tidak berawalan itu
 * ditampilkan apa adanya.
 */
function shortPeriodLabel(label: string): string {
  return label.replace(/^Monev KIP-K Undip\s+/i, "");
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
  })
    .format(d)
    .replace(":", ".");
  return `${dateStr}, ${timeStr} WIB`;
}

export default function RiwayatMonevClient({
  initialSchedules,
  initialSubmittedIds,
}: RiwayatMonevClientProps) {
  // Hindari state salinan props yang stale; gunakan useMemo untuk Set submitted
  const schedules = initialSchedules;
  const submittedSet = useMemo(
    () => new Set(initialSubmittedIds),
    [initialSubmittedIds],
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
    telegramName: string | null;
    telegramUsername: string | null;
  }>({
    connected: false,
    loading: true,
    error: false,
    telegramName: null,
    telegramUsername: null,
  });
  // Jalur aktivasi yang sedang diproses, dan panel cadangan yang terbuka
  const [busyPath, setBusyPath] = useState<ActivationPath | null>(null);
  const [altPanel, setAltPanel] = useState<"qr" | null>(null);
  // true setelah pemeriksaan status pertama selesai (berhasil atau gagal).
  // Panduan baru ditampilkan sesudahnya supaya mahasiswa yang sudah
  // terhubung tidak sempat melihat panduan berkedip lalu hilang.
  const [statusChecked, setStatusChecked] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [hasTutorialVideo, setHasTutorialVideo] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  // Kode aktivasi hanya disimpan di state — tidak di localStorage/URL
  const [activation, setActivation] = useState<TelegramActivation | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  // Detik berjalan untuk hitung mundur masa berlaku kode
  const [tick, setTick] = useState(() => Date.now());

  const fetchTelegramStatus = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!silent) {
        setTelegramStatus((prev) => ({ ...prev, loading: true, error: false }));
      }
      try {
        const res = await fetch("/api/auth/telegram/status", { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal mengambil status");
        const data = await res.json();
        const connected = data.connected === true;
        setTelegramStatus({
          connected,
          loading: false,
          error: false,
          telegramName: data.telegramName ?? null,
          telegramUsername: data.telegramUsername ?? null,
        });
        if (connected) setActivation(null);
      } catch {
        if (!silent) {
          setTelegramStatus((prev) => ({ ...prev, connected: false, loading: false, error: true }));
        }
      } finally {
        setStatusChecked(true);
      }
    },
    [],
  );

  const requestActivationCode = async (): Promise<TelegramActivation | null> => {
    setActivationError(null);
    try {
      const data = await telegramAPI.activate();
      if (data?.code && data?.deepLink) {
        setActivation(data);
        setTick(Date.now());
        return data;
      }
      setActivationError(data?.error ?? "Gagal membuat kode aktivasi.");
    } catch {
      setActivationError("Gagal terhubung ke server. Silakan coba lagi.");
    }
    return null;
  };

  /**
   * Pakai kode yang masih berlaku, atau minta yang baru. Semua jalur
   * aktivasi memakai kode yang sama, jadi berpindah jalur tidak
   * membatalkan kode yang sedang ditampilkan.
   */
  const ensureActivation = async (): Promise<TelegramActivation | null> => {
    if (activation && Date.now() < new Date(activation.expiresAt).getTime()) {
      return activation;
    }
    return requestActivationCode();
  };

  // Koneksi tidak dianggap berhasil hanya karena bot dibuka — status
  // diperiksa ulang lewat polling dan saat mahasiswa kembali ke tab ini.
  const handleOpenLink = async (path: "app" | "web") => {
    setBusyPath(path);
    try {
      const data = await ensureActivation();
      if (data) {
        window.open(
          path === "app" ? data.deepLink : data.webLink,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } finally {
      setBusyPath(null);
    }
  };

  const handleTogglePanel = async (panel: "qr") => {
    if (altPanel === panel) {
      setAltPanel(null);
      return;
    }
    setBusyPath(panel);
    try {
      const data = await ensureActivation();
      if (data) setAltPanel(panel);
    } finally {
      setBusyPath(null);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setDisconnectError(null);
    try {
      const data = await telegramAPI.disconnect();
      if (data?.connected === false) {
        setConfirmDisconnect(false);
        setShowGuide(false);
        await fetchTelegramStatus();
      } else {
        setDisconnectError(data?.error ?? "Gagal memutus koneksi Telegram.");
      }
    } catch {
      setDisconnectError("Gagal terhubung ke server. Silakan coba lagi.");
    } finally {
      setIsDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();

    // Auto-refresh saat mahasiswa kembali ke tab ini setelah membuka Telegram bot
    const handleFocus = () => fetchTelegramStatus();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchTelegramStatus]);

  // Selama kode aktif: hitung mundur per detik dan polling status tiap 5
  // detik, maksimal 5 menit sejak kode dibuat.
  const activationExpiresAt = activation ? new Date(activation.expiresAt).getTime() : 0;
  useEffect(() => {
    if (!activation) return;
    const startedAt = Date.now();
    const ticker = setInterval(() => setTick(Date.now()), 1000);
    const poller = setInterval(() => {
      if (Date.now() - startedAt > 5 * 60 * 1000) {
        clearInterval(poller);
        return;
      }
      fetchTelegramStatus({ silent: true });
    }, 5000);
    return () => {
      clearInterval(ticker);
      clearInterval(poller);
    };
  }, [activation, fetchTelegramStatus]);

  const codeSecondsLeft = activation
    ? Math.max(0, Math.floor((activationExpiresAt - tick) / 1000))
    : 0;
  const codeExpired = !!activation && codeSecondsLeft === 0;
  const codeCountdown = `${Math.floor(codeSecondsLeft / 60)}:${String(codeSecondsLeft % 60).padStart(2, "0")}`;

  // Tampilkan kolom video hanya jika berkasnya benar-benar ada. Content-type
  // diperiksa juga: tanpa itu halaman 404 berstatus 200 dianggap video.
  useEffect(() => {
    let cancelled = false;
    fetch(TELEGRAM_TUTORIAL_VIDEO_SRC, { method: "HEAD" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        if (!cancelled) setHasTutorialVideo(res.ok && type.startsWith("video/"));
      })
      .catch(() => {
        if (!cancelled) setHasTutorialVideo(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Panduan tampil selama belum terhubung; setelah terhubung, hanya jika
  // mahasiswa memintanya lewat "Lihat panduan".
  const guideVisible =
    statusChecked && (!telegramStatus.connected || showGuide);

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
      className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6"
      style={{ fontFamily: "Roboto, sans-serif" }}
    >
      {/* ─── SECTION 1: HERO (DIPERTAHANKAN SESUAI PERMINTAAN USER) ────────── */}
      {/* Dotted orbital arc */}
      <div className="pointer-events-none absolute right-10 top-0 w-72 h-72 rounded-full border border-dashed border-blue-100/40 hidden md:block" />

      {/* Top: Judul + Slot Gambar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Teks Judul & Deskripsi */}
        <div className="max-w-xl md:pt-6">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0B1536] tracking-tight leading-[1.25]">
            Monitoring dan Evaluasi
            <br />
            KIP Kuliah
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed">
            Perbarui laporan kondisi ekonomi Anda untuk mendukung proses
            evaluasi KIP Kuliah.
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

      {/* ─── PANEL UTAMA ──────────────────────────────────────────────────────
          Satu panel, tiga bagian bertumpuk dipisah garis tipis. Aksi utama tiap
          bagian berada di kanan (sejajar), dan menurun ke bawah isi di mobile. */}
      <div className="rounded-lg border border-[#E2E8F0] bg-white">
        {/* ── 1. Monev periode ini ── */}
        <section
          aria-labelledby="current-monev-heading"
          className="px-5 py-6 md:px-9 md:py-9"
        >
          {currentPeriod ? (
            <>
              {fillablePeriods.length > 1 && (
                <div className="mb-5">
                  <label
                    htmlFor="period-select"
                    className="mb-1 block text-[13px] leading-[20px] text-[#475569]"
                  >
                    Pilih periode aktif
                  </label>
                  <select
                    id="period-select"
                    value={currentPeriod.id}
                    onChange={(e) => setSelectedPeriodId(e.target.value)}
                    className="max-w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[14px] text-[#0F172A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]"
                  >
                    {fillablePeriods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {shortPeriodLabel(p.label)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[13px] leading-[20px] text-[#475569]">
                Monev periode ini
              </p>
              <h2
                id="current-monev-heading"
                className="mt-1 text-[24px] leading-[32px] font-semibold text-[#000352] break-words"
              >
                {shortPeriodLabel(currentPeriod.label)}
              </h2>
              <p className="mt-1 text-[14px] leading-[22px] text-[#475569]">
                Monitoring dan evaluasi ekonomi KIP-K Undip.
              </p>

              {/* Informasi di kiri, tombol di kanan pada baris yang sama */}
              <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
                  <div className="min-w-0 sm:pr-10">
                    <p className="text-[13px] leading-[20px] text-[#475569]">
                      Batas pengisian
                    </p>
                    <p className="mt-1 text-[15px] leading-[22px] text-[#0F172A]">
                      {formatDateTimeID(currentPeriod.deadline)}
                    </p>
                  </div>
                  <div className="min-w-0 sm:border-l sm:border-[#E2E8F0] sm:pl-10">
                    <p className="text-[13px] leading-[20px] text-[#475569]">
                      Status laporan
                    </p>
                    <p className="mt-1 text-[15px] leading-[22px] text-[#0F172A]">
                      {submittedSet.has(currentPeriod.id)
                        ? "Terkirim"
                        : "Belum dikirim"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/mahasiswa/monev/${currentPeriod.id}`}
                  className="inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center rounded-lg bg-[#000352] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#1a1e68] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2 md:w-auto"
                >
                  {submittedSet.has(currentPeriod.id)
                    ? "Lihat laporan"
                    : "Isi Monev"}
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2
                id="current-monev-heading"
                className="text-[20px] leading-[28px] font-semibold text-[#000352]"
              >
                Tidak ada periode Monev yang aktif
              </h2>
              <p className="mt-2 text-[14px] leading-[22px] text-[#475569]">
                Jadwal pengisian berikutnya akan diinformasikan oleh pengelola
                beasiswa.
              </p>
            </>
          )}
        </section>

        {/* ── 2. Pengingat Telegram ── */}
        <section
          aria-labelledby="telegram-heading"
          className="border-t border-[#E2E8F0] px-5 py-6 md:px-9 md:py-9"
        >
          <h2
            id="telegram-heading"
            className="text-[20px] leading-[28px] font-semibold text-[#000352]"
          >
            Pengingat Telegram
          </h2>
          <p className="mt-1 text-[14px] leading-[22px] text-[#475569]">
            {telegramStatus.connected
              ? "Telegram terhubung. Pengingat Monev akan dikirim ke akun Anda."
              : "Hubungkan Telegram untuk menerima pengingat batas pengisian."}
          </p>

          {/* Akun yang terhubung ditampilkan agar mahasiswa bisa memastikan
              itu memang akunnya, lengkap dengan opsi memutus koneksi. */}
          {telegramStatus.connected && (
            <div className="mt-4 rounded-lg border border-[#E2E8F0] px-4 py-3">
              <p className="text-[13px] leading-[20px] text-[#475569]">
                Akun terhubung:{" "}
                <span className="font-medium text-[#0F172A]">
                  {telegramStatus.telegramName ?? "Akun Telegram"}
                  {telegramStatus.telegramUsername &&
                    ` (${telegramStatus.telegramUsername})`}
                </span>
              </p>

              {confirmDisconnect ? (
                <div className="mt-3">
                  <p className="text-[13px] leading-[20px] text-[#0F172A]">
                    Putuskan Telegram? Anda tidak akan menerima pengingat Monev lagi.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-4 text-[13px] font-medium text-white hover:bg-red-700 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                    >
                      {isDisconnecting && <Loader2 size={14} className="animate-spin" />}
                      Ya, putuskan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmDisconnect(false);
                        setDisconnectError(null);
                      }}
                      disabled={isDisconnecting}
                      className="inline-flex h-9 items-center rounded-lg border border-[#E2E8F0] px-4 text-[13px] font-medium text-[#0F172A] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                    >
                      Batal
                    </button>
                  </div>
                  {disconnectError && (
                    <p className="mt-2 text-[13px] leading-[20px] text-red-600">
                      {disconnectError}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
                  {/* Setelah terhubung, panduan disembunyikan di balik tindakan ini */}
                  <button
                    type="button"
                    onClick={() => setShowGuide((prev) => !prev)}
                    aria-expanded={showGuide}
                    aria-controls="telegram-guide"
                    className="rounded text-[13px] font-medium text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                  >
                    {showGuide ? "Sembunyikan panduan" : "Lihat panduan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(true)}
                    className="rounded text-[13px] font-medium text-red-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  >
                    Putuskan
                  </button>
                </div>
              )}
            </div>
          )}

          {guideVisible && (
            // @container: dua kolom ditentukan oleh lebar area konten yang
            // sebenarnya (sudah dikurangi sidebar), bukan lebar layar.
            <div id="telegram-guide" className="@container mt-7">
              <div className="grid items-start gap-8 @[44rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] @[44rem]:gap-10">
                {/* Video di kiri (di atas langkah pada layar kecil). Tanpa
                    autoplay; rasio asli dipertahankan, tidak dipotong. */}
                {hasTutorialVideo && (
                  <div className="min-w-0 @[44rem]:col-span-2">
                    <video
                      src={TELEGRAM_TUTORIAL_VIDEO_SRC}
                      controls
                      preload="metadata"
                      playsInline
                      onError={() => setHasTutorialVideo(false)}
                      aria-label="Video panduan menghubungkan Telegram"
                      className="block h-auto max-h-[420px] w-full rounded-lg border border-[#E2E8F0] bg-white object-contain"
                    />
                  </div>
                )}

                {/* Panduan ringkas; nomor menunjukkan urutan, bukan progres. */}
                <div className="min-w-0">
                <ol aria-label="Cara menghubungkan Telegram" className="min-w-0">
                  {TELEGRAM_STEPS.map((step, i) => (
                      <li key={step.title} className={`flex gap-3.5 ${i === 0 ? 'pb-5' : 'py-5'} last:pb-0`}>
                        <StepNumber number={i + 1} />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] leading-7 font-semibold text-[#0F172A]">
                            {step.title}
                          </h3>
                          <p className="mt-0.5 text-[13px] leading-[21px] text-[#64748B]">
                            {step.description}
                          </p>

                          {step.action === "open" && (
                            <>
                              <div className="mt-3 w-full max-w-[320px]">
                              <button
                                type="button"
                                onClick={() => handleOpenLink("app")}
                                disabled={busyPath !== null}
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#000352] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1a1e68] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                              >
                                {busyPath === "app" ? (
                                  <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>Membuka Telegram...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={15} aria-hidden="true" />
                                    <span>Buka Bot Telegram</span>
                                  </>
                                )}
                              </button>

                              {/* Jalur cadangan. Tautan t.me di atas hanya
                                  berfungsi bila aplikasi Telegram terpasang —
                                  halaman t.me tidak pernah mengoper ke
                                  web.telegram.org — jadi pengguna Telegram Web
                                  dan desktop tanpa aplikasi dilayani di sini. */}
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <AltPathButton
                                  label="Telegram Web"
                                  icon="web"
                                  busy={busyPath === "web"}
                                  disabled={busyPath !== null}
                                  onClick={() => handleOpenLink("web")}
                                />
                                <AltPathButton
                                  label="Scan QR"
                                  icon="qr"
                                  busy={busyPath === "qr"}
                                  disabled={busyPath !== null}
                                  expanded={altPanel === "qr"}
                                  onClick={() => handleTogglePanel("qr")}
                                />
                              </div>
                              </div>

                              {activationError && (
                                <p className="mt-3 text-[13px] leading-[20px] text-red-600">
                                  {activationError}
                                </p>
                              )}

                              {activation && altPanel && !telegramStatus.connected && (
                                <div className="mt-4 max-w-[380px] rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                                  {codeExpired ? (
                                    <>
                                      <p className="text-[13px] leading-[20px] text-red-600">
                                        Kode sudah kedaluwarsa.
                                      </p>
                                      <button
                                        type="button"
                                        onClick={requestActivationCode}
                                        className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg border border-[#000352] bg-white px-4 text-[13px] font-medium text-[#000352] hover:bg-[#EEF2FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                                      >
                                        <RotateCw size={14} />
                                        Buat kode baru
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-[13px] font-medium leading-[20px] text-[#0F172A]">
                                        Pindai dengan kamera HP
                                      </p>
                                      <p className="mt-1 text-[13px] leading-[20px] text-[#475569]">
                                        Telegram di HP akan terbuka dengan kode sudah
                                        terisi. Tinggal tekan Start.
                                      </p>
                                      <div className="mt-3 w-fit rounded-md bg-white p-3">
                                        <QRCode
                                          value={activation.deepLink}
                                          size={160}
                                          level="M"
                                          aria-label="Kode QR aktivasi Telegram"
                                        />
                                      </div>
                                    </>
                                  )}

                                  {!codeExpired && (
                                    <p className="mt-3 text-[12px] leading-[18px] text-[#64748B]">
                                      Berlaku {codeCountdown} lagi. Jangan bagikan QR ini —
                                      siapa pun yang memindainya akan menerima pengingat
                                      Monev Anda.
                                    </p>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {step.action === "check" && (
                            <>
                              <button
                                type="button"
                                onClick={() => fetchTelegramStatus()}
                                disabled={telegramStatus.loading}
                                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-[12px] font-medium text-[#000352] transition-colors hover:border-[#C7D2FE] hover:bg-[#EEF2FF] disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
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
                              {telegramStatus.error && !telegramStatus.loading && (
                                <p className="text-[13px] leading-[20px] text-red-600">
                                  Status koneksi belum dapat diperiksa.{" "}
                                  <button
                                    type="button"
                                    onClick={() => fetchTelegramStatus()}
                                    className="rounded font-medium text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                                  >
                                    Coba lagi
                                  </button>
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </li>
                  ))}
                </ol>
                </div>
                <TelegramReminderCard />
              </div>
            </div>
          )}
        </section>

        {/* ── 3. Riwayat Monev ── */}
        <section
          aria-labelledby="history-heading"
          className="border-t border-[#E2E8F0] px-5 py-6 md:px-9 md:py-9"
        >
          <h2
            id="history-heading"
            className="text-[20px] leading-[28px] font-semibold text-[#000352]"
          >
            Riwayat Monev
          </h2>

          {historySchedules.length === 0 ? (
            <p className="mt-1 text-[14px] leading-[22px] text-[#475569]">
              Belum ada laporan dari periode sebelumnya.
            </p>
          ) : (
            <>
              <div className="mt-5 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
                {displayedHistory.map((item) => {
                  const isSubmitted = submittedSet.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center sm:gap-6"
                    >
                      <div className="min-w-0">
                        <h3 className="text-[14px] leading-[22px] font-semibold text-[#0F172A] break-words">
                          {item.label}
                        </h3>
                        <p className="mt-1 text-[13px] leading-[20px] text-[#475569]">
                          Batas pengisian: {formatDateID(item.deadline)}
                        </p>
                        <p className="text-[13px] leading-[20px] text-[#475569]">
                          Status: {isSubmitted ? "Terkirim" : "Tidak mengisi"}
                        </p>
                      </div>

                      {isSubmitted && (
                        <Link
                          href={`/mahasiswa/monev/${item.id}`}
                          className="shrink-0 rounded text-[13px] font-medium text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                        >
                          Lihat laporan
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {historySchedules.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowAllHistory((prev) => !prev)}
                  className="mt-4 rounded text-[13px] font-medium text-[#000352] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352] focus-visible:ring-offset-2"
                >
                  {showAllHistory
                    ? "Tampilkan lebih sedikit"
                    : `Lihat semua riwayat (${historySchedules.length})`}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
