"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Plus, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import SesiOverview from "@/components/admin/wawancara/SesiOverview";
import type { Sesi, KuotaItem } from "@/types/wawancara";
import LoadingState from "../shared/LoadingState";
import ConfirmModal, { ConfirmVariant } from "../shared/ConfirmModal";
import SesiStatusCard from "./SesiStatusCard";
import KuotaProgress from "./KuotaProgress";
import KuotaTable from "./KuotaTable";
import BuatSesiModal, { FormSesiState } from "./BuatSesiModal";
import EditKuotaModal, { EditKuotaFormState } from "./EditKuotaModal";

export default function SesiWAR() {
  const today = new Date().toISOString().split("T")[0];
  const [tanggal, setTanggal] = useState(today);
  const [sesi, setSesi] = useState<Sesi | null>(null);
  const [kuotaList, setKuotaList] = useState<KuotaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [showBuatSesi, setShowBuatSesi] = useState(false);
  const [showEditKuota, setShowEditKuota] = useState(false);
  const [offset, setOffset] = useState(0);
  const [formSesi, setFormSesi] = useState<FormSesiState>({
    kuota_pewawancara: "20",
    kuota_mahasiswa: "120",
    jalur_masuk: "SNBT",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [kandidatCount, setKandidatCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [editForm, setEditForm] = useState<EditKuotaFormState>({
    kuota_pewawancara: "",
    kuota_mahasiswa: "",
  });
  const [savingSesi, setSavingSesi] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: ConfirmVariant;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", variant: "warning", onConfirm: () => {} });

  const fetchSesi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sesi?tanggal=${tanggal}`);
      const json = await res.json();
      setSesi(json.sesi ?? null);
      setKuotaList(json.slots ?? []);
      setOffset(json.offset ?? 0);
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => {
    fetchSesi();
  }, [fetchSesi]);

  // Auto-refresh setiap 5 detik saat WAR aktif
  useEffect(() => {
    if (!sesi?.war_aktif) return;
    const t = setInterval(fetchSesi, 5000);
    return () => clearInterval(t);
  }, [sesi?.war_aktif, fetchSesi]);

  function showMessage(type: "ok" | "err", text: string, timeout = 3000) {
    setMsg({ type, text });
    if (timeout) setTimeout(() => setMsg(null), timeout);
  }

  async function fetchKandidatCount(jalur: string) {
    setLoadingCount(true);
    try {
      const res = await fetch(
        `/api/admin/sesi/count-kandidat?jalur_masuk=${encodeURIComponent(jalur)}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (res.ok) {
        setKandidatCount(json.total_belum_assign ?? json.total ?? 0);
      }
    } finally {
      setLoadingCount(false);
    }
  }

  function openBuatSesi() {
    setFormSesi((f) => ({ ...f, tanggal_mulai: tanggal, tanggal_selesai: tanggal }));
    fetchKandidatCount(formSesi.jalur_masuk);
    setShowBuatSesi(true);
  }

  async function handleBuatSesi() {
    setSavingSesi(true);
    setMsg(null);
    try {
      const { tanggal_mulai, tanggal_selesai, jalur_masuk, kuota_pewawancara } = formSesi;

      if (tanggal_mulai && tanggal_selesai) {
        // Rentang tanggal diisi → batch create
        const res = await fetch("/api/admin/sesi/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tanggal_mulai,
            tanggal_selesai,
            jalur_masuk,
            kuota_pewawancara: parseInt(kuota_pewawancara),
            total_mahasiswa: kandidatCount ?? undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setMsg({ type: "err", text: json.error });
          return;
        }
        setShowBuatSesi(false);
        showMessage(
          "ok",
          `${json.created} sesi berhasil dibuat (${json.total_mahasiswa} mahasiswa / ${json.jumlah_hari} hari).`,
          5000,
        );
        setTanggal(tanggal_mulai);
        fetchSesi();
      } else {
        // Single day (fallback ke tanggal yang dipilih di date picker)
        const res = await fetch("/api/admin/sesi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tanggal,
            kuota_pewawancara: parseInt(kuota_pewawancara),
            kuota_mahasiswa: parseInt(formSesi.kuota_mahasiswa),
            jalur_masuk,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setMsg({ type: "err", text: json.error });
          return;
        }
        setShowBuatSesi(false);
        fetchSesi();
      }
    } finally {
      setSavingSesi(false);
    }
  }

  function openEditKuota() {
    if (!sesi) return;
    setEditForm({
      kuota_pewawancara: String(sesi.kuota_pewawancara),
      kuota_mahasiswa: String(sesi.kuota_mahasiswa),
    });
    setShowEditKuota(true);
  }

  async function handleEditKuota() {
    if (!sesi) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/sesi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sesi.id,
          kuota_pewawancara: parseInt(editForm.kuota_pewawancara),
          kuota_mahasiswa: parseInt(editForm.kuota_mahasiswa),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setShowEditKuota(false);
      showMessage("ok", "Kuota berhasil diperbarui.");
      fetchSesi();
    } finally {
      setSavingEdit(false);
    }
  }

  function handleToggleWAR() {
    if (!sesi) return;
    const newState = !sesi.war_aktif;

    if (newState) {
      setConfirmModal({
        open: true,
        title: "Buka Pemilihan Urutan Wawancara?",
        description: `Sesi ${new Date(tanggal).toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })} akan dibuka. Pewawancara akan bisa klaim kuota sekarang.`,
        variant: "warning",
        onConfirm: () => executeToggleWAR(true),
      });
      return;
    }

    executeToggleWAR(false);
  }

  async function executeToggleWAR(newState: boolean) {
    if (!sesi) return;
    setConfirmModal((c) => ({ ...c, open: false }));
    setToggling(true);
    try {
      const res = await fetch("/api/admin/sesi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sesi.id, war_aktif: newState }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error });
        return;
      }
      setSesi(json.data);
      showMessage(
        "ok",
        newState
          ? "Pemilihan urutan dibuka! Pewawancara bisa klaim kuota."
          : "Pemilihan urutan ditutup.",
      );
    } finally {
      setToggling(false);
    }
  }

  function handleDistribusi() {
    if (!sesi) return;
    if (kuotaList.length === 0) {
      setMsg({ type: "err", text: "Belum ada pewawancara yang mengisi kuota" });
      return;
    }
    setConfirmModal({
      open: true,
      title: "Distribusikan Mahasiswa?",
      description: `${kuotaList.length} pewawancara akan menerima tugas wawancara. Setiap pewawancara mendapat ±${Math.ceil(
        sesi.kuota_mahasiswa / kuotaList.length,
      )} mahasiswa. Tindakan ini tidak bisa dibatalkan.`,
      variant: "info",
      onConfirm: executeDistribusi,
    });
  }

  async function executeDistribusi() {
    if (!sesi) return;
    setConfirmModal((c) => ({ ...c, open: false }));
    setDistributing(true);
    try {
      const res = await fetch("/api/admin/sesi/distribusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesi_id: sesi.id }),
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

  function handleDeleteSesi() {
    if (!sesi) return;
    if (sesi.distribusi_done) {
      setMsg({ type: "err", text: "Sesi yang sudah didistribusikan tidak bisa dihapus." });
      return;
    }
    setConfirmModal({
      open: true,
      title: "Hapus Sesi Wawancara?",
      description: `Sesi ${new Date(tanggal).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })} akan dihapus permanen. Semua kuota pewawancara yang sudah diklaim juga akan dihapus.`,
      variant: "danger",
      onConfirm: executeDeleteSesi,
    });
  }

  async function executeDeleteSesi() {
    if (!sesi) return;
    setConfirmModal((c) => ({ ...c, open: false }));
    try {
      const res = await fetch(`/api/admin/sesi?id=${sesi.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error ?? "Gagal menghapus sesi" });
        return;
      }
      showMessage("ok", "Sesi berhasil dihapus.");
      fetchSesi();
    } catch {
      setMsg({ type: "err", text: "Gagal menghapus sesi" });
    }
  }

  return (
    <>
      <SesiOverview onSelectTanggal={setTanggal} activeTanggal={tanggal} />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none"
            title="pilih tanggal"
          />
        </div>
        <button
          onClick={fetchSesi}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors shadow-sm"
          title="Muat ulang"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              msg.type === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}
          >
            {msg.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <LoadingState />
      ) : !sesi ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <CalendarDays size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">
            Belum ada sesi untuk tanggal ini
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Buat sesi terlebih dahulu sebelum membuka pemilihan urutan pewawancara
          </p>
          <button
            onClick={openBuatSesi}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> Buat Sesi
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <SesiStatusCard
            sesi={sesi}
            tanggal={tanggal}
            kuotaList={kuotaList}
            toggling={toggling}
            distributing={distributing}
            onEditKuota={openEditKuota}
            onDeleteSesi={handleDeleteSesi}
            onToggleWAR={handleToggleWAR}
            onDistribusi={handleDistribusi}
          />
          <KuotaProgress sesi={sesi} kuotaList={kuotaList} />
          <KuotaTable sesi={sesi} kuotaList={kuotaList} offset={offset} />
        </div>
      )}

      <BuatSesiModal
        open={showBuatSesi}
        form={formSesi}
        kandidatCount={kandidatCount}
        loadingCount={loadingCount}
        saving={savingSesi}
        onChange={setFormSesi}
        onJalurChange={fetchKandidatCount}
        onClose={() => setShowBuatSesi(false)}
        onSubmit={handleBuatSesi}
      />

      {sesi && (
        <EditKuotaModal
          open={showEditKuota}
          tanggal={tanggal}
          form={editForm}
          minKuotaPewawancara={kuotaList.length}
          saving={savingEdit}
          onChange={setEditForm}
          onClose={() => setShowEditKuota(false)}
          onSubmit={handleEditKuota}
        />
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        variant={confirmModal.variant}
        confirmLabel={
          confirmModal.variant === "danger"
            ? "Hapus"
            : confirmModal.variant === "warning"
              ? "Ya, Buka"
              : "Lanjutkan"
        }
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((c) => ({ ...c, open: false }))}
      />
    </>
  );
}
