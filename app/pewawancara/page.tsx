"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Zap, ZapOff, CheckCircle2, Clock, Loader2,
  ClipboardList, ArrowRight, Users, AlertTriangle,
} from "lucide-react";

import type { WarStatus } from "@/schemas";

export default function PewawancaraDashboard() {
  const [status, setStatus] = useState<WarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
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

  // Polling realtime: setiap 3 detik saat WAR aktif dan belum dapat slot
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (status?.war_aktif && !status.slot_saya) {
      intervalRef.current = setInterval(fetchStatus, 3000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status?.war_aktif, status?.slot_saya, fetchStatus]);

  const [unwarring, setUnwarring] = useState(false);
  const [unwarMsg, setUnwarMsg]   = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleKlaim() {
    setClaiming(true);
    setClaimMsg(null);
    try {
      const res = await fetch("/api/war", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setClaimMsg({ type: "ok", text: json.message });
        fetchStatus();
      } else {
        setClaimMsg({ type: "err", text: json.error ?? "Gagal klaim slot" });
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleUnwar() {
    if (!confirm("Batalkan slot WAR kamu?\nSlot akan tersedia untuk pewawancara lain.")) return;
    setUnwarring(true);
    setUnwarMsg(null);
    try {
      const res = await fetch("/api/war", { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        setUnwarMsg({ type: "ok", text: json.message });
        fetchStatus();
      } else {
        setUnwarMsg({ type: "err", text: json.error ?? "Gagal membatalkan slot" });
      }
    } finally {
      setUnwarring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-slate-400">
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

  const today = sesi
    ? new Date(sesi.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Portal Pewawancara</p>
        <h1 className="text-2xl font-extrabold text-primary font-headline">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">{today}</p>
      </div>

      {/* ── Tidak ada sesi ── */}
      {!sesi && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <Clock size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600 mb-1">Belum ada sesi wawancara hari ini</p>
          <p className="text-sm text-slate-400">Admin belum membuat sesi untuk hari ini. Cek kembali nanti.</p>
        </div>
      )}

      {/* ── Ada sesi ── */}
      {sesi && (
        <div className="space-y-4">

          {/* Card utama WAR */}
          <motion.div
            animate={warAktif && !slotSaya ? { boxShadow: ["0 0 0 0 rgba(245,158,11,0)", "0 0 0 8px rgba(245,158,11,0.15)", "0 0 0 0 rgba(245,158,11,0)"] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`rounded-2xl border p-6 ${
              slotSaya
                ? "bg-emerald-50 border-emerald-200"
                : warAktif
                ? "bg-amber-50 border-amber-300"
                : "bg-white border-slate-100"
            } shadow-sm`}
          >
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-4">
              {slotSaya ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <CheckCircle2 size={12} /> SLOT DIDAPAT
                </span>
              ) : warAktif ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full animate-pulse">
                  <Zap size={12} /> WAR SEDANG BERLANGSUNG
                </span>
              ) : slotPenuh ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  <Users size={12} /> SLOT PENUH
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  <ZapOff size={12} /> MENUNGGU ADMIN
                </span>
              )}
            </div>

            {/* Konten berdasarkan state */}
            {slotSaya ? (
              /* Sudah dapat slot */
              <div>
                <p className="text-3xl font-extrabold text-emerald-700 mb-1">
                  Slot #{slotSaya.slot_ke}
                </p>
                <p className="text-sm text-emerald-600 mb-3">
                  Kamu berhasil mendapatkan slot wawancara hari ini!
                </p>
                <div className="bg-white rounded-xl border border-emerald-200 p-4 mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mahasiswa yang akan kamu wawancara</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      { length: Math.ceil((sesi.kuota_mahasiswa) / kuota) },
                      (_, i) => slotSaya.slot_ke + i * kuota
                    )
                      .filter((n) => n <= sesi.kuota_mahasiswa)
                      .map((n) => (
                        <span key={n} className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                          Urutan #{n}
                        </span>
                      ))}
                  </div>
                  {!sesi.distribusi_done && (
                    <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
                      <Clock size={11} /> Menunggu admin melakukan distribusi mahasiswa...
                    </p>
                  )}
                </div>

                {/* Feedback UN-WAR */}
                <AnimatePresence>
                  {unwarMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        unwarMsg.type === "ok"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {unwarMsg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {unwarMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                {sesi.distribusi_done ? (
                  <Link
                    href="/pewawancara/mahasiswa"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    <ClipboardList size={15} /> Mulai Wawancara <ArrowRight size={14} />
                  </Link>
                ) : (
                  /* Tombol UN-WAR — hanya sebelum distribusi */
                  <button
                    onClick={handleUnwar}
                    disabled={unwarring}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-all"
                  >
                    {unwarring
                      ? <Loader2 size={13} className="animate-spin" />
                      : <ZapOff size={13} />
                    }
                    {unwarring ? "Membatalkan..." : "UN-WAR — Batalkan Slot"}
                  </button>
                )}
              </div>
            ) : warAktif ? (
              /* WAR aktif, belum klaim */
              <div>
                <p className="text-lg font-bold text-amber-800 mb-1">
                  Rebut slot wawancara sekarang!
                </p>
                <p className="text-sm text-amber-700 mb-4">
                  Sisa slot: <span className="font-extrabold text-xl">{kuota - slotTerisi}</span> dari {kuota}
                </p>

                <AnimatePresence>
                  {claimMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mb-3 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        claimMsg.type === "ok"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {claimMsg.type === "ok" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                      {claimMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleKlaim}
                  disabled={claiming}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-amber-200"
                >
                  {claiming ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Zap size={20} />
                  )}
                  {claiming ? "Mengklaim..." : "KLAIM SLOT SEKARANG"}
                </motion.button>
                <p className="text-[11px] text-amber-600 text-center mt-2">
                  Klik cepat sebelum slot habis!
                </p>
              </div>
            ) : slotPenuh ? (
              /* Slot penuh, tidak dapat */
              <div>
                <p className="font-bold text-slate-600 mb-1">Semua slot sudah terisi</p>
                <p className="text-sm text-slate-400">
                  {kuota} pewawancara sudah mendapatkan slot untuk hari ini.
                  Kamu tidak mendapatkan slot pada sesi ini.
                </p>
              </div>
            ) : (
              /* WAR belum dibuka */
              <div>
                <p className="font-bold text-slate-600 mb-1">WAR belum dibuka</p>
                <p className="text-sm text-slate-400">
                  Tunggu admin membuka WAR. Halaman ini akan otomatis update saat WAR dibuka.
                </p>
                <p className="text-xs text-slate-300 mt-3">Halaman refresh otomatis setiap 3 detik</p>
              </div>
            )}
          </motion.div>

          {/* Progress slot realtime */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-700">Slot Terisi</p>
              <span className="text-xs font-bold text-primary">{slotTerisi}/{kuota}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
              <motion.div
                className={`h-full rounded-full ${slotPenuh ? "bg-emerald-500" : "bg-primary"}`}
                animate={{ width: `${(slotTerisi / kuota) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: kuota }, (_, i) => {
                const slot = status?.slots.find((s) => s.slot_ke === i + 1);
                const isMine = slotSaya?.slot_ke === i + 1;
                return (
                  <div
                    key={i}
                    title={slot ? slot.pewawancara?.nama ?? "Terisi" : `Slot ${i + 1}`}
                    className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                      isMine
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                        : slot
                        ? "bg-primary/80 text-white"
                        : "bg-slate-100 text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Link ke daftar mahasiswa jika distribusi sudah done */}
          {sesi.distribusi_done && slotSaya && (
            <Link
              href="/pewawancara/mahasiswa"
              className="flex items-center justify-between p-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <ClipboardList size={18} />
                <div>
                  <p className="font-bold text-sm">Daftar Mahasiswa Saya</p>
                  <p className="text-xs text-white/70">Lihat dan isi hasil wawancara</p>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
