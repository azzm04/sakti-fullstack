"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  ZapOff,
  CheckCircle2,
  Clock,
  Loader2,
  ClipboardList,
  ArrowRight,
  Users,
  Hash,
  MousePointerClick,
  X,
} from "lucide-react";

// Sesuaikan path import ini dengan instalasi shadcn kamu
import { toast } from "sonner";
import type { WarStatus } from "@/schemas";

export default function PewawancaraDashboard() {
  const [status, setStatus] = useState<WarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [unwarring, setUnwarring] = useState(false);

  // State baru untuk menggantikan confirm() browser
  const [confirmUnwar, setConfirmUnwar] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/war");
      const json = await res.json();
      setStatus(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Poll setiap 5 detik jika:
    // - WAR sedang aktif dan belum punya slot (rebutan slot)
    // - WAR belum aktif tapi ada sesi upcoming (menunggu admin buka)
    const shouldPoll =
      (status?.war_aktif && !status.slot_saya) ||
      (!status?.war_aktif && !!status?.sesi && !status?.sesi?.distribusi_done);

    if (shouldPoll) {
      intervalRef.current = setInterval(fetchStatus, 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status?.war_aktif, status?.slot_saya, status?.sesi, fetchStatus]);

  async function handleKlaim() {
    if (!selectedSlot) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/war", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot_ke: selectedSlot }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Slot Berhasil Diklaim!", {
          description: json.message || `Kamu mendapatkan slot #${selectedSlot}.`,
        });
        setSelectedSlot(null);
        fetchStatus();
      } else {
        toast.error("Klaim Gagal", {
          description: json.error ?? "Gagal klaim slot, mungkin sudah didului orang lain.",
        });
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleUnwar() {
    setUnwarring(true);
    try {
      const res = await fetch("/api/war", { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        toast.success("Slot Dibatalkan", {
          description: json.message || "Slot kamu telah dikembalikan dan tersedia untuk pewawancara lain.",
        });
        setConfirmUnwar(false);
        fetchStatus();
      } else {
        toast.error("Gagal Membatalkan", {
          description: json.error ?? "Terjadi kesalahan saat membatalkan slot.",
        });
      }
    } finally {
      setUnwarring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Memuat...
      </div>
    );
  }

  const sesi = status?.sesi;
  const slotSaya = status?.slot_saya;
  const warAktif = status?.war_aktif ?? false;
  const slotTerisi = status?.slot_terisi ?? 0;
  const kuota = sesi?.kuota_pewawancara ?? 20;
  const slotPenuh = slotTerisi >= kuota;

  const takenSlots = new Set((status?.slots ?? []).map((s) => s.slot_ke));

  function getMahasiswaForSlot(slotKe: number): number[] {
    if (!sesi) return [];
    const result: number[] = [];
    for (let n = slotKe; n <= sesi.kuota_mahasiswa; n += kuota) {
      result.push(n);
    }
    return result;
  }

  const today = sesi
    ? new Date(sesi.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  // Label header: jika sesi bukan hari ini, tampilkan keterangan
  const tanggalHariIni = new Date().toISOString().split("T")[0];
  const isUpcoming = sesi && sesi.tanggal > tanggalHariIni;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Portal Pewawancara
        </p>
        <h1 className="text-2xl font-extrabold text-primary font-headline">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {today}
          {isUpcoming && (
            <span className="ml-2 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Sesi Mendatang
            </span>
          )}
        </p>
      </div>

      {!sesi && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center">
          <Clock size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">
            Belum ada sesi wawancara hari ini
          </p>
          <p className="text-sm text-muted-foreground">
            Admin belum membuat sesi untuk hari ini. Cek kembali nanti.
          </p>
        </div>
      )}

      {sesi && (
        <div className="space-y-4">
          {/* ════ STATE 1: Sudah dapat slot ════ */}
          {slotSaya && (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="bg-primary px-6 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">
                    Slot Berhasil Diklaim
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    Kamu sudah terdaftar sebagai pewawancara
                  </p>
                </div>
                <span className="ml-auto text-3xl font-extrabold text-white/90">
                  #{slotSaya.slot_ke}
                </span>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Urutan mahasiswa yang akan kamu wawancara
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getMahasiswaForSlot(slotSaya.slot_ke).map((n) => (
                      <span
                        key={n}
                        className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20"
                      >
                        #{n}
                      </span>
                    ))}
                  </div>
                  {!sesi.distribusi_done && (
                    <p className="text-[11px] text-muted-foreground mt-2.5 flex items-center gap-1.5">
                      <Clock size={11} /> Menunggu admin melakukan distribusi
                      mahasiswa…
                    </p>
                  )}
                </div>

                {sesi.distribusi_done ? (
                  <Link
                    href="/pewawancara/mahasiswa"
                    className="flex items-center justify-between w-full px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ClipboardList size={15} /> Mulai Wawancara
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                ) : (
                  <div className="pt-2 border-t border-border">
                    {!confirmUnwar ? (
                      <button
                        onClick={() => setConfirmUnwar(true)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-destructive border border-destructive/20 bg-destructive/5 rounded-xl hover:bg-destructive/10 transition-all"
                      >
                        <ZapOff size={13} /> UN-WAR — Batalkan Slot
                      </button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="text-xs font-medium text-muted-foreground mr-1">
                          Yakin batalkan?
                        </span>
                        <button
                          onClick={handleUnwar}
                          disabled={unwarring}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-destructive rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-all"
                        >
                          {unwarring ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Ya, Batalkan
                        </button>
                        <button
                          onClick={() => setConfirmUnwar(false)}
                          disabled={unwarring}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-all"
                        >
                          <X size={13} /> Batal
                        </button>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ STATE 1.5: Sesi ada tapi WAR belum dibuka ════ */}
          {!slotSaya && !warAktif && sesi && !sesi.distribusi_done && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    Menunggu WAR Dibuka
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Memperbarui otomatis…</span>
                </div>
              </div>
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto">
                  <Clock size={26} className="text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-base">
                    Sesi wawancara sudah dijadwalkan
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Admin belum membuka WAR untuk sesi ini. Halaman akan otomatis
                    memperbarui setiap 5 detik.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl text-sm font-semibold text-primary">
                  <ClipboardList size={14} />
                  {new Date(sesi.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kuota: <span className="font-semibold text-foreground">{sesi.kuota_pewawancara} pewawancara</span>
                  {" · "}
                  <span className="font-semibold text-foreground">{sesi.kuota_mahasiswa} mahasiswa</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* ════ STATE 2: WAR aktif, belum punya slot ════ */}
          {!slotSaya && warAktif && (
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="h-2 w-2 rounded-full bg-primary inline-block"
                  />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    WAR Sedang Berlangsung
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {kuota - slotTerisi} slot tersisa
                </span>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <p className="font-bold text-foreground mb-0.5">
                    Pilih slot yang kamu inginkan
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MousePointerClick size={13} />
                    Klik slot yang tersedia, lalu konfirmasi klaimmu
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: kuota }, (_, i) => {
                      const slotKe = i + 1;
                      const isTaken = takenSlots.has(slotKe);
                      const isSelected = selectedSlot === slotKe;

                      return (
                        <motion.button
                          key={slotKe}
                          whileHover={!isTaken ? { scale: 1.08 } : {}}
                          whileTap={!isTaken ? { scale: 0.95 } : {}}
                          onClick={() => {
                            if (isTaken) return;
                            setSelectedSlot(isSelected ? null : slotKe);
                          }}
                          disabled={isTaken}
                          className={`
                            aspect-square rounded-xl flex items-center justify-center text-sm font-bold
                            transition-all duration-150 border-2 relative
                            ${
                              isTaken
                                ? "bg-muted border-transparent text-muted-foreground/40 cursor-not-allowed"
                                : isSelected
                                  ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/30 ring-offset-1"
                                  : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                            }
                          `}
                        >
                          {slotKe}
                          {isTaken && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="w-4 h-px bg-muted-foreground/30 rotate-45 block" />
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-3 w-3 rounded bg-primary inline-block" />{" "}
                      Dipilih
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-3 w-3 rounded bg-muted border border-border inline-block" />{" "}
                      Terisi
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="h-3 w-3 rounded bg-card border-2 border-border inline-block" />{" "}
                      Tersedia
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {selectedSlot && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                        <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                          <Hash size={12} />
                          Slot {selectedSlot} — Mahasiswa yang akan kamu
                          tangani:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {getMahasiswaForSlot(selectedSlot).map((n) => (
                            <span
                              key={n}
                              className="text-xs font-semibold px-2 py-0.5 bg-primary/15 text-primary rounded-lg"
                            >
                              #{n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={selectedSlot ? { scale: 0.98 } : {}}
                  onClick={handleKlaim}
                  disabled={!selectedSlot || claiming}
                  className={`
                    w-full py-3.5 font-bold text-sm rounded-xl transition-all duration-200
                    flex items-center justify-center gap-2
                    ${
                      selectedSlot && !claiming
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }
                  `}
                >
                  {claiming ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Mengklaim
                      Slot {selectedSlot}…
                    </>
                  ) : selectedSlot ? (
                    <>
                      <Zap size={16} /> Klaim Slot #{selectedSlot}
                    </>
                  ) : (
                    <>Pilih slot di atas terlebih dahulu</>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {/* ════ STATE 3 & 4 (Penuh / Belum Dibuka) tetap sama strukturnya, saya potong untuk efisiensi ruang ════ */}

          {/* ── Perbaikan: Progress bar slot (Tidak gepeng & Responsive) ── */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6 mt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-foreground">
                Status Keterisian
              </p>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                {slotTerisi} / {kuota}
              </span>
            </div>

            <div className="w-full h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden mb-5">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${(slotTerisi / kuota) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            {/* Perbaikan Grid: Menggunakan sm:grid-cols-10 untuk mobile-friendly dan tinggi elemen ditambah (h-3) */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-1.5">
              {Array.from({ length: kuota }, (_, i) => {
                const slotKe = i + 1;
                const slot = status?.slots.find((s) => s.slot_ke === slotKe);
                const isMine = slotSaya?.slot_ke === slotKe;
                return (
                  <div
                    key={slotKe}
                    title={
                      slot
                        ? isMine
                          ? "Slot kamu"
                          : (slot.pewawancara?.nama ?? "Terisi")
                        : `Slot ${slotKe} — tersedia`
                    }
                    className={`h-2.5 sm:h-3 w-full rounded-full transition-all duration-300 ${
                      isMine
                        ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                        : slot
                          ? "bg-primary/40"
                          : "bg-muted border border-border/50"
                    }`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground font-medium">
              <span>Slot 1</span>
              <span>Slot {kuota}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
