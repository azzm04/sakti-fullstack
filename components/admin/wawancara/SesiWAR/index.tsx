"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarDays, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import SesiOverview from "@/components/admin/wawancara/SesiOverview";
import type { Sesi, KuotaItem } from "@/types/wawancara";
import ConfirmModal, { ConfirmVariant } from "../shared/ConfirmModal";
import SesiStatusCard from "./SesiStatusCard";
import KuotaProgress from "./KuotaProgress";
import KuotaTable from "./KuotaTable";
import BuatSesiModal, { FormSesiState } from "./BuatSesiModal";
import EditKuotaModal, { EditKuotaFormState } from "./EditKuotaModal";

export default function SesiWAR() {
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
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
    tahun_seleksi: String(currentYear),
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
  // Dinaikkan setiap ada perubahan sesi supaya "Ringkasan Sesi" ikut dimuat ulang.
  const [overviewKey, setOverviewKey] = useState(0);
  const requestIdRef = useRef(0);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: ConfirmVariant;
    onConfirm: () => void;
  }>({ open: false, title: "", description: "", variant: "warning", onConfirm: () => {} });

  // `silent` = refresh di latar belakang (polling, tombol muat ulang, setelah
  // aksi): data lama tetap tampil, tidak diganti spinner "Memuat...".
  // Spinner penuh hanya untuk muat awal & ganti tanggal.
  const fetchSesi = useCallback(
    async (opts?: { silent?: boolean }) => {
      const requestId = ++requestIdRef.current;
      if (!opts?.silent) setLoading(true);
      try {
        const res = await fetch(`/api/admin/sesi?tanggal=${tanggal}`);
        const json = await res.json();
        // Abaikan respons untuk tanggal lama kalau user sudah pindah tanggal lagi.
        if (requestId !== requestIdRef.current) return;
        setSesi(json.sesi ?? null);
        setKuotaList(json.slots ?? []);
        setOffset(json.offset ?? 0);
      } catch {
        // Gagal saat refresh senyap: biarkan data terakhir, coba lagi di siklus berikutnya.
      } finally {
        if (!opts?.silent && requestId === requestIdRef.current) setLoading(false);
      }
    },
    [tanggal],
  );

  useEffect(() => {
    fetchSesi();
  }, [fetchSesi]);

  // Auto-refresh setiap 5 detik saat WAR aktif
  useEffect(() => {
    if (!sesi?.war_aktif) return;
    const t = setInterval(() => fetchSesi({ silent: true }), 5000);
    return () => clearInterval(t);
  }, [sesi?.war_aktif, fetchSesi]);

  /** Muat ulang sesi aktif (tanpa spinner) + kartu Ringkasan Sesi setelah ada perubahan. */
  function refreshAfterChange() {
    fetchSesi({ silent: true });
    setOverviewKey((k) => k + 1);
  }

  async function fetchKandidatCount(jalur: string, tahunSeleksi: string) {
    setLoadingCount(true);
    try {
      const res = await fetch(
        `/api/admin/sesi/count-kandidat?jalur_masuk=${encodeURIComponent(jalur)}&tahun_seleksi=${encodeURIComponent(tahunSeleksi)}`,
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
    fetchKandidatCount(formSesi.jalur_masuk, formSesi.tahun_seleksi);
    setShowBuatSesi(true);
  }

  async function handleBuatSesi() {
    setSavingSesi(true);
    try {
      const { tanggal_mulai, tanggal_selesai, jalur_masuk, tahun_seleksi, kuota_pewawancara } = formSesi;

      if (tanggal_mulai && tanggal_selesai) {
        // Rentang tanggal diisi → batch create
        const res = await fetch("/api/admin/sesi/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tanggal_mulai,
            tanggal_selesai,
            jalur_masuk,
            tahun_seleksi: parseInt(tahun_seleksi),
            kuota_pewawancara: parseInt(kuota_pewawancara),
            total_mahasiswa: kandidatCount ?? undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error);
          return;
        }
        setShowBuatSesi(false);
        toast.success(`${json.created} sesi berhasil dibuat`, {
          description: `${json.total_mahasiswa} mahasiswa dibagi ke ${json.jumlah_hari} hari.`,
        });
        setTanggal(tanggal_mulai);
        refreshAfterChange();
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
            tahun_seleksi: parseInt(tahun_seleksi),
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error);
          return;
        }
        setShowBuatSesi(false);
        toast.success("Sesi berhasil dibuat");
        refreshAfterChange();
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
        toast.error(json.error);
        return;
      }
      setShowEditKuota(false);
      toast.success("Kuota berhasil diperbarui");
      refreshAfterChange();
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
        toast.error(json.error);
        return;
      }
      setSesi(json.data);
      setOverviewKey((k) => k + 1);
      if (newState) {
        toast.success("Pemilihan urutan dibuka", {
          description: "Pewawancara sekarang bisa mengklaim slot.",
        });
      } else {
        toast.success("Pemilihan urutan ditutup");
      }
    } finally {
      setToggling(false);
    }
  }

  function handleDistribusi() {
    if (!sesi) return;
    if (kuotaList.length === 0) {
      toast.error("Belum ada pewawancara yang mengisi kuota");
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
        toast.error(json.error);
        return;
      }
      toast.success("Distribusi berhasil", {
        description: `${json.total_assigned} mahasiswa didistribusikan ke ${json.pewawancara_count} pewawancara.`,
      });
      refreshAfterChange();
    } finally {
      setDistributing(false);
    }
  }

  function handleDeleteSesi() {
    if (!sesi) return;
    if (sesi.distribusi_done) {
      toast.error("Sesi yang sudah didistribusikan tidak bisa dihapus.");
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
        toast.error(json.error ?? "Gagal menghapus sesi");
        return;
      }
      toast.success("Sesi berhasil dihapus");
      refreshAfterChange();
    } catch {
      toast.error("Gagal menghapus sesi");
    }
  }

  const tanggalLabel = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Saat memuat sesi (awal / ganti tanggal) seluruh area kerja dibuat
          inert + ditutup overlay, supaya admin tidak bisa beraksi di sesi
          tanggal sebelumnya sebelum data tanggal tujuan terbuka. */}
      <div inert={loading} aria-busy={loading}>
      <SesiOverview
        onSelectTanggal={setTanggal}
        activeTanggal={tanggal}
        refreshKey={overviewKey}
      />

      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-admin-border rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-admin-text-5" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-sm font-semibold text-admin-text-2 bg-transparent rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/30"
            title="pilih tanggal"
          />
        </div>
        <button
          onClick={() => fetchSesi({ silent: true })}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-admin-border text-admin-text-5 hover:text-admin-accent hover:border-admin-accent transition-colors shadow-sm"
          title="Muat ulang"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="min-h-60" />
      ) : !sesi ? (
        <div className="bg-white rounded-2xl border border-admin-border-soft shadow-sm p-10 text-center">
          <CalendarDays size={36} className="text-admin-border mx-auto mb-3" />
          <p className="text-sm font-semibold text-admin-text-3 mb-1">
            Belum ada sesi untuk tanggal ini
          </p>
          <p className="text-xs text-admin-text-5 mb-5">
            Buat sesi terlebih dahulu sebelum membuka pemilihan urutan pewawancara
          </p>
          <button
            onClick={openBuatSesi}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 transition-colors"
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
      </div>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[90] flex items-center justify-center bg-admin-bg/60 backdrop-blur-[2px]"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-admin-border bg-white px-5 py-4 shadow-lg">
            <Loader2 size={18} className="animate-spin text-admin-accent" />
            <div>
              <p className="text-sm font-semibold text-admin-text">Memuat sesi…</p>
              <p className="text-xs text-admin-text-4">{tanggalLabel}</p>
            </div>
          </div>
        </div>
      )}

      <BuatSesiModal
        open={showBuatSesi}
        form={formSesi}
        kandidatCount={kandidatCount}
        loadingCount={loadingCount}
        saving={savingSesi}
        onChange={setFormSesi}
        onFilterChange={fetchKandidatCount}
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
