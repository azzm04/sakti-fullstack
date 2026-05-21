"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Zap, ZapOff, Play, RefreshCw,
  CheckCircle2, AlertTriangle, Loader2, Plus,
  UserCheck, Users, Clock, Trash2, X
} from "lucide-react";

import type { SesiWawancara, KuotaPewawancara } from "@/schemas";

export default function SesiWAR() {
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);
  const [SesiWawancara, setSesi] = useState<SesiWawancara | null>(null);
  const [kuotaList, setKuotaList] = useState<KuotaPewawancara[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  
  // Modal states
  const [showBuatSesi, setShowBuatSesi] = useState(false);
  const [showConfirmWar, setShowConfirmWar] = useState(false);
  
  const [formSesi, setFormSesi] = useState({
    kuota_pewawancara: "20",
    kuota_mahasiswa: "120",
  });
  const [savingSesi, setSavingSesi] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchSesi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/SesiWawancara?tanggal=${tanggal}`);
      const json = await res.json();
      setSesi(json.SesiWawancara ?? null);
      setKuotaList(json.slots ?? []);
      setOffset(json.offset ?? 0);
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => {
    fetchSesi();
  }, [fetchSesi]);

  useEffect(() => {
    if (!SesiWawancara?.war_aktif) return;
    const t = setInterval(fetchSesi, 5000);
    return () => clearInterval(t);
  }, [SesiWawancara?.war_aktif, fetchSesi]);

  async function handleBuatSesi() {
    setSavingSesi(true);
    try {
      const res = await fetch("/api/admin/SesiWawancara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          kuota_pewawancara: parseInt(formSesi.kuota_pewawancara),
          kuota_mahasiswa: parseInt(formSesi.kuota_mahasiswa),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setShowBuatSesi(false);
      fetchSesi();
    } finally {
      setSavingSesi(false);
    }
  }

  function handleToggleWAR() {
    if (!SesiWawancara) return;
    const newState = !SesiWawancara.war_aktif;
    
    if (newState) {
      setShowConfirmWar(true);
    } else {
      executeToggleWAR(false);
    }
  }

  async function executeToggleWAR(newState: boolean) {
    if (!SesiWawancara) return;
    
    setToggling(true);
    setShowConfirmWar(false);
    
    try {
      const res = await fetch("/api/admin/SesiWawancara", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: SesiWawancara.id, war_aktif: newState }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setSesi(json.data);
      setMsg({
        type: "ok",
        text: newState
          ? "WAR dibuka! Pewawancara bisa klaim Slot."
          : "WAR ditutup.",
      });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setToggling(false);
    }
  }

  async function handleDistribusi() {
    if (!SesiWawancara) return;
    if (kuotaList.length === 0) {
      setMsg({ type: "err", text: "Belum ada pewawancara yang mengisi Slot" });
      return;
    }
    if (!confirm(`Distribusikan mahasiswa ke ${kuotaList.length} pewawancara?\nTindakan ini tidak bisa dibatalkan.`)) return;
    
    setDistributing(true);
    try {
      const res = await fetch("/api/admin/SesiWawancara/distribusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesi_id: SesiWawancara.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setMsg({
        type: "ok",
        text: `Berhasil! ${json.total_assigned} mahasiswa didistribusikan ke ${json.pewawancara_count} pewawancara.`,
      });
      fetchSesi();
    } finally {
      setDistributing(false);
    }
  }

  async function handleHapusSlot(slotId: number, namaPewawancara: string) {
    if (!confirm(`Hapus ${namaPewawancara} dari Slot WAR?\nMereka bisa klaim Slot lagi jika WAR masih aktif.`)) return;
    
    setDeletingSlot(slotId);
    try {
      const res = await fetch(`/api/admin/SesiWawancara?slot_id=${slotId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setMsg({
        type: "ok",
        text: `${namaPewawancara} berhasil dihapus dari Slot`,
      });
      setTimeout(() => setMsg(null), 3000);
      fetchSesi();
    } finally {
      setDeletingSlot(null);
    }
  }

  const kuotaPenuh = SesiWawancara
    ? kuotaList.length >= SesiWawancara.kuota_pewawancara
    : false;

  return (
    <div className="space-y-6">
      {/* Date Control & Feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <CalendarDays size={18} className="text-indigo-500" />
            <input
              type="date"
              title="Filter Tanggal"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="text-sm font-bold text-slate-700 bg-transparent focus:outline-none"
            />
          </div>
          <button
            onClick={fetchSesi}
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <AnimatePresence>
          {msg && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`px-4 py-2.5 rounded-2xl text-sm font-semibold flex items-center gap-2 shadow-sm ${
                msg.type === "ok"
                  ? "bg-emerald-500 text-white"
                  : "bg-rose-500 text-white"
              }`}
            >
              {msg.type === "ok" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertTriangle size={16} />
              )}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin text-indigo-500" />
          <p className="text-sm font-medium">Memuat data sesi...</p>
        </div>
      ) : !SesiWawancara ? (
        <div className="bg-white rounded-3xl border border-slate-200 border-dashed shadow-sm p-16 text-center flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5">
            <CalendarDays size={32} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Belum Ada Sesi
          </h3>
          <p className="text-sm text-slate-500 mb-8 max-w-md">
            Tidak ada sesi wawancara yang dijadwalkan untuk tanggal{" "}
            <span className="font-semibold">
              {new Date(tanggal).toLocaleDateString("id-ID")}
            </span>
            . Buat sesi baru untuk memulai.
          </p>
          <button
            onClick={() => setShowBuatSesi(true)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
          >
            <Plus size={18} /> Buat Sesi Wawancara
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hero Status Card */}
          <div
            className={`relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-sm border ${
              SesiWawancara.war_aktif
                ? "bg-gradient-to-br from-amber-500 to-orange-600 border-transparent text-white"
                : SesiWawancara.distribusi_done
                  ? "bg-white border-emerald-200"
                  : "bg-white border-slate-200"
            }`}
          >
            {/* Background Pattern for active state */}
            {SesiWawancara.war_aktif && (
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                  backgroundSize: "24px 24px",
                }}
              ></div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {SesiWawancara.war_aktif ? (
                    <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      WAR SEDANG AKTIF
                    </span>
                  ) : SesiWawancara.distribusi_done ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200">
                      <CheckCircle2 size={14} /> DISTRIBUSI SELESAI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                      <ZapOff size={14} /> WAR BELUM DIBUKA
                    </span>
                  )}
                </div>

                <h2
                  className={`text-2xl md:text-3xl font-extrabold mb-4 ${SesiWawancara.war_aktif ? "text-white" : "text-slate-900"}`}
                >
                  {new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h2>

                <div
                  className={`flex flex-wrap items-center gap-4 text-sm font-medium ${SesiWawancara.war_aktif ? "text-amber-100" : "text-slate-500"}`}
                >
                  <div className="flex items-center gap-1.5">
                    <UserCheck size={16} className="opacity-70" />
                    <span>
                      Pewawancara:{" "}
                      <span
                        className={
                          SesiWawancara.war_aktif
                            ? "text-white font-bold"
                            : "text-slate-900 font-bold"
                        }
                      >
                        {SesiWawancara.kuota_pewawancara}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={16} className="opacity-70" />
                    <span>
                      Mahasiswa:{" "}
                      <span
                        className={
                          SesiWawancara.war_aktif
                            ? "text-white font-bold"
                            : "text-slate-900 font-bold"
                        }
                      >
                        {SesiWawancara.kuota_mahasiswa}
                      </span>
                    </span>
                  </div>
                  {SesiWawancara.war_dibuka_at && (
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="opacity-70" />
                      <span>
                        Dibuka Pukul:{" "}
                        <span
                          className={
                            SesiWawancara.war_aktif
                              ? "text-white font-bold"
                              : "text-slate-900 font-bold"
                          }
                        >
                          {new Date(
                            SesiWawancara.war_dibuka_at,
                          ).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 min-w-[200px]">
                {!SesiWawancara.distribusi_done && (
                  <button
                    onClick={handleToggleWAR}
                    disabled={toggling || kuotaPenuh}
                    className={`flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-2xl transition-all shadow-sm disabled:opacity-50 ${
                      SesiWawancara.war_aktif
                        ? "bg-white text-amber-600 hover:bg-amber-50"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {toggling ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : SesiWawancara.war_aktif ? (
                      <ZapOff size={18} />
                    ) : (
                      <Zap size={18} className="text-amber-400" />
                    )}
                    {SesiWawancara.war_aktif
                      ? "Tutup Sesi WAR"
                      : "Buka Sesi WAR"}
                  </button>
                )}
                {!SesiWawancara.distribusi_done && kuotaList.length > 0 && (
                  <div className="relative group">
                    <button
                      onClick={handleDistribusi}
                      disabled={distributing || SesiWawancara.war_aktif}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {distributing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Play size={18} />
                      )}
                      Mulai Distribusi
                    </button>
                    {SesiWawancara.war_aktif && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none">
                        Tutup WAR terlebih dahulu
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grid Visualizer Slots */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Slot Pewawancara
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Status pengisian slot oleh para pewawancara
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-slate-500 mr-2">
                  Tingkat Keterisian:
                </span>
                <span className="text-2xl font-black text-indigo-600">
                  {kuotaList.length}{" "}
                  <span className="text-slate-300 text-lg font-medium">
                    / {SesiWawancara.kuota_pewawancara}
                  </span>
                </span>
              </div>
            </div>

            {/* Progress Bar Detail */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-8 shadow-inner">
              <motion.div
                className={`h-full rounded-full relative ${kuotaPenuh ? "bg-emerald-500" : "bg-indigo-500"}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${(kuotaList.length / SesiWawancara.kuota_pewawancara) * 100}%`,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <div
                  className="absolute inset-0 bg-white/20"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
                    backgroundSize: "1rem 1rem",
                  }}
                ></div>
              </motion.div>
            </div>

            {/* Grid of slots */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
              {Array.from(
                { length: SesiWawancara.kuota_pewawancara },
                (_, i) => {
                  const SlotData = kuotaList.find((s) => s.kuota_ke === i + 1);
                  return (
                    <div
                      key={i}
                      title={
                        SlotData
                          ? `${SlotData.pewawancara?.nama ?? "—"} (${new Date(SlotData.claimed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`
                          : `Slot ${i + 1} Kosong`
                      }
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-default relative overflow-hidden ${
                        SlotData
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50"
                          : "bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400"
                      }`}
                    >
                      <span
                        className={`text-sm font-black ${SlotData ? "opacity-100" : "opacity-50"}`}
                      >
                        {i + 1}
                      </span>
                      {SlotData && (
                        <span className="text-[10px] font-medium leading-tight mt-1 opacity-90 truncate w-full text-center">
                          {SlotData.pewawancara?.nama?.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Table Data Slots */}
          {kuotaList.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">
                  Log Klaim Slot Pewawancara
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider w-16">
                        Slot
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                        Identitas Pewawancara
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                        Waktu Klaim
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                        Jatah No. Mhs
                      </th>
                      <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {kuotaList.map((s) => {
                      const step = SesiWawancara.kuota_pewawancara;
                      const urutan = Array.from(
                        {
                          length: Math.ceil(
                            SesiWawancara.kuota_mahasiswa / step,
                          ),
                        },
                        (_, i) => offset + s.kuota_ke + i * step,
                      ).filter((n) => n <= offset + SesiWawancara.kuota_mahasiswa);
                      const isDeleting = deletingSlot === s.id;

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 transition-colors group ${isDeleting ? "opacity-40" : ""}`}
                        >
                          <td className="px-6 py-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                              {s.kuota_ke}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">
                              {s.pewawancara?.nama ?? "—"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {s.pewawancara?.email}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                              <Clock size={14} className="text-slate-400" />
                              {new Date(s.claimed_at).toLocaleTimeString(
                                "id-ID",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                },
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                              {urutan.slice(0, 5).map((n) => (
                                <span
                                  key={n}
                                  className="text-[11px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100"
                                >
                                  #{n}
                                </span>
                              ))}
                              {urutan.length > 5 && (
                                <span className="text-[11px] font-semibold text-slate-400 self-center ml-1">
                                  +{urutan.length - 5} lagi
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!SesiWawancara.distribusi_done && (
                              <button
                                onClick={() =>
                                  handleHapusSlot(
                                    s.id,
                                    s.pewawancara?.nama ?? "Pewawancara",
                                  )
                                }
                                disabled={isDeleting}
                                className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors ml-auto opacity-0 group-hover:opacity-100"
                                title="Hapus slot ini"
                              >
                                {isDeleting ? (
                                  <Loader2
                                    size={18}
                                    className="animate-spin text-rose-500"
                                  />
                                ) : (
                                  <Trash2 size={18} />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Buat Sesi Wawancara */}
      <AnimatePresence>
        {showBuatSesi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Buat Sesi Baru
                  </h3>
                  <p className="text-sm font-medium text-indigo-600 mt-1">
                    {new Date(tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowBuatSesi(false)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  title="Tutup Modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Kuota Pewawancara (Total Slot)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    title="Jumlah maksimal pewawancara yang bisa klaim slot pada sesi ini"
                    value={formSesi.kuota_pewawancara}
                    onChange={(e) =>
                      setFormSesi((f) => ({
                        ...f,
                        kuota_pewawancara: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Tentukan jumlah maksimal pewawancara yang bisa melakukan
                    klaim (WAR) pada hari ini.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Total Mahasiswa yang diwawancara
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formSesi.kuota_mahasiswa}
                    title="Jumlah mahasiswa yang akan didistribusikan ke pewawancara pada sesi ini"
                    onChange={(e) =>
                      setFormSesi((f) => ({
                        ...f,
                        kuota_mahasiswa: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <div className="mt-3 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 flex items-center justify-between">
                      <span>Estimasi Beban Tugas:</span>
                      <span className="text-sm">
                        ±{" "}
                        {Math.ceil(
                          parseInt(formSesi.kuota_mahasiswa || "120") /
                            parseInt(formSesi.kuota_pewawancara || "20"),
                        )}{" "}
                        Mhs / Orang
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowBuatSesi(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleBuatSesi}
                  disabled={savingSesi}
                  className="flex-1 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {savingSesi && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  Generate Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Konfirmasi Buka WAR */}
      <AnimatePresence>
        {showConfirmWar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-sm w-full text-center"
            >
              <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 relative">
                <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20"></div>
                <Zap size={32} className="fill-amber-500 relative z-10" />
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                Buka Sesi WAR?
              </h3>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Pewawancara akan dapat mulai mengklaim slot wawancara untuk
                hari{" "}
                <span className="font-bold text-slate-700">
                  {new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>{" "}
                sekarang juga.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmWar(false)}
                  disabled={toggling}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => executeToggleWAR(true)}
                  disabled={toggling}
                  className="flex-1 py-3 text-sm font-bold bg-amber-500 text-white rounded-2xl hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center shadow-sm shadow-amber-500/30"
                >
                  {toggling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Ya, Buka WAR"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}