"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  UserCheck,
  CalendarDays,
  Users,
  Zap,
  ZapOff,
  Play,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import SesiOverview from "@/components/admin/wawancara/SesiOverview";

interface Pewawancara {
   id: number;
  user_id: string;
  admin_id: string;
  nama: string;
  total_assigned: number;
  total_completed: number;
  created_at: string;
  users: {
    id: string;
    email_sso: string;
    status_akun: string;
  };
}

interface Sesi {
  id: number;
  tanggal: string;
  kuota_pewawancara: number;
  kuota_mahasiswa: number;
  war_aktif: boolean;
  war_dibuka_at: string | null;
  war_ditutup_at: string | null;
  distribusi_done: boolean;
}

interface KuotaItem {
  id: number;
  kuota_ke: number;
  claimed_at: string;
  pewawancara_id: number;
  pewawancara: { nama: string; email: string } | null;
}

type Tab = "daftar" | "sesi";

export default function PewawancaraPage() {
  const [tab, setTab] = useState<Tab>("daftar");

  return (
    <div className="p-6 md:p-10 min-h-screen bg-[#f7f9fb]">
      <nav className="flex items-center gap-2 text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-4">
        <span>Dashboard</span>
        <span>›</span>
        <span className="text-primary">Pewawancara</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">
          Pewawancara
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pewawancara dan Pemilihan Urutan Pewawancara harian
        </p>
      </div>

      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit mb-6 shadow-sm">
        {(
          [
            { key: "daftar", label: "Daftar Pengguna", icon: Users },
            { key: "sesi", label: "Pemilihan Urutan Pewawancara", icon: Zap },
          ] as { key: Tab; label: string; icon: React.ElementType }[]
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-primary text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "daftar" ? <DaftarPewawancara /> : <SesiWAR />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1: Daftar Pewawancara
// ─────────────────────────────────────────────────────────────────────────────
function DaftarPewawancara() {
  const [data, setData] = useState<Pewawancara[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pewawancara | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", nama: "" });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(search ? { search } : {});
      const res = await fetch(`/api/admin/pewawancara?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchData, search]);

  function openAdd() {
    setEditing(null);
    setForm({ email: "", nama: "" });
    setFormError("");
    setShowModal(true);
  }

  function openEdit(p: Pewawancara) {
    setEditing(p);
    setForm({ email: p.users?.email_sso ?? "", nama: p.nama ?? "" });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    setFormError("");
    if (!form.email || !form.nama) {
      setFormError("Email dan nama wajib diisi");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/admin/pewawancara/${editing.id}`
        : "/api/admin/pewawancara";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, nama: form.nama }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Gagal menyimpan");
        return;
      }
      setShowModal(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(p: Pewawancara) {
    await fetch(`/api/admin/pewawancara/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status_akun: p.users?.status_akun === "AKTIF" ? "NON_AKTIF" : "AKTIF" }),
    });
    fetchData();
  }

  async function handleDelete(p: Pewawancara) {
    if (
      !confirm(
        `Hapus pewawancara ${p.nama ?? p.users?.email_sso}?\nAkses login mereka juga akan dinonaktifkan.`,
      )
    )
      return;
    await fetch(`/api/admin/pewawancara/${p.id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total", value: total, color: "text-primary" },
          {
            label: "Aktif",
            value: data.filter((p) => p.users?.status_akun === "AKTIF").length,
            color: "text-emerald-600",
          },
          {
            label: "Non-aktif",
            value: data.filter((p) => p.users?.status_akun !== "AKTIF").length,
            color: "text-slate-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
          >
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={15} /> Tambah
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Memuat...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {[
                  "Nama / Email",
                  "ID",
                  "Assigned",
                  "Selesai",
                  "Status",
                  "Aksi",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">
                      {p.nama ?? "—"}
                    </p>
                    <p className="text-[11px] text-slate-400">{p.users?.email_sso ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                      {p.users?.id ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                    {p.total_assigned}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-600">
                    {p.total_completed}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                        p.users?.status_akun === "AKTIF"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {p.users?.status_akun === "AKTIF" ? (
                        <>
                          <CheckCircle2 size={10} /> Aktif
                        </>
                      ) : (
                        "Non-aktif"
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
                        title="button"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && data.length === 0 && (
          <div className="py-16 text-center">
            <UserCheck size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              Belum ada pewawancara terdaftar
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800">
                  {editing ? "Edit Pewawancara" : "Tambah Pewawancara"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                  title="button"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="pewawancara@students.undip.ac.id"
                    disabled={!!editing}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 disabled:opacity-60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Nama <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama: e.target.value }))
                    }
                    placeholder="Nama Pewawancara"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 transition-all"
                  />
                </div>
                {!editing && (
                  <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    Pewawancara otomatis bisa login via OTP menggunakan email
                    ini.
                  </p>
                )}
                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                    {formError}
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 2: Sesi WAR
// ─────────────────────────────────────────────────────────────────────────────
function SesiWAR() {
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
  const [formSesi, setFormSesi] = useState({
    kuota_pewawancara: "20",
    kuota_mahasiswa: "120",
    jalur_masuk: "SNBT",
    tanggal_mulai: "",
    tanggal_selesai: "",
  });
  const [kandidatCount, setKandidatCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [editForm, setEditForm] = useState({
    kuota_pewawancara: "",
    kuota_mahasiswa: "",
  });
  const [savingSesi, setSavingSesi] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "warning" | "danger" | "info";
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

  async function handleBuatSesi() {
    setSavingSesi(true);
    setMsg(null);
    try {
      const { tanggal_mulai, tanggal_selesai, jalur_masuk, kuota_pewawancara } = formSesi;

      // Jika rentang tanggal diisi → batch create
      if (tanggal_mulai && tanggal_selesai) {
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
        setMsg({
          type: "ok",
          text: `${json.created} sesi berhasil dibuat (${json.total_mahasiswa} mahasiswa / ${json.jumlah_hari} hari).`,
        });
        setTimeout(() => setMsg(null), 5000);
        // Set tanggal ke hari pertama sesi yang dibuat
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

  // Fetch kandidat count saat jalur_masuk berubah
  async function fetchKandidatCount(jalur: string) {
    setLoadingCount(true);
    try {
      const res = await fetch(`/api/admin/sesi/count-kandidat?jalur_masuk=${encodeURIComponent(jalur)}`,{
        cache: "no-store"
      });
      const json = await res.json();
      if (res.ok) {
        setKandidatCount(json.total_belum_assign ?? json.total ?? 0);
      }
    } finally {
      setLoadingCount(false);
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
      setMsg({ type: "ok", text: "Kuota berhasil diperbarui." });
      setTimeout(() => setMsg(null), 3000);
      fetchSesi();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleToggleWAR() {
    if (!sesi) return;
    const newState = !sesi.war_aktif;

    if (newState) {
      // Buka WAR → tampilkan modal konfirmasi
      setConfirmModal({
        open: true,
        title: "Buka Pemilihan Urutan Wawancara?",
        description: `Sesi ${new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} akan dibuka. Pewawancara akan bisa klaim kuota sekarang.`,
        variant: "warning",
        onConfirm: () => executeToggleWAR(true),
      });
      return;
    }

    // Tutup WAR → langsung eksekusi
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
      setMsg({
        type: "ok",
        text: newState
          ? "Pemilihan urutan dibuka! Pewawancara bisa klaim kuota."
          : "Pemilihan urutan ditutup.",
      });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setToggling(false);
    }
  }

  async function handleDistribusi() {
    if (!sesi) return;
    if (kuotaList.length === 0) {
      setMsg({ type: "err", text: "Belum ada pewawancara yang mengisi kuota" });
      return;
    }
    setConfirmModal({
      open: true,
      title: "Distribusikan Mahasiswa?",
      description: `${kuotaList.length} pewawancara akan menerima tugas wawancara. Setiap pewawancara mendapat ±${Math.ceil(sesi.kuota_mahasiswa / kuotaList.length)} mahasiswa. Tindakan ini tidak bisa dibatalkan.`,
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

  const kuotaPenuh = sesi ? kuotaList.length >= sesi.kuota_pewawancara : false;

  async function handleDeleteSesi() {
    if (!sesi) return;
    if (sesi.distribusi_done) {
      setMsg({ type: "err", text: "Sesi yang sudah didistribusikan tidak bisa dihapus." });
      return;
    }
    setConfirmModal({
      open: true,
      title: "Hapus Sesi Wawancara?",
      description: `Sesi ${new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })} akan dihapus permanen. Semua kuota pewawancara yang sudah diklaim juga akan dihapus.`,
      variant: "danger",
      onConfirm: executeDeleteSesi,
    });
  }

  async function executeDeleteSesi() {
    if (!sesi) return;
    setConfirmModal((c) => ({ ...c, open: false }));
    try {
      const res = await fetch(`/api/admin/sesi?id=${sesi.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg({ type: "err", text: json.error ?? "Gagal menghapus sesi" });
        return;
      }
      setMsg({ type: "ok", text: "Sesi berhasil dihapus." });
      setTimeout(() => setMsg(null), 3000);
      fetchSesi();
    } catch {
      setMsg({ type: "err", text: "Gagal menghapus sesi" });
    }
  }

  return (
    <>
      {/* Sesi Overview Panel */}
      <SesiOverview onSelectTanggal={setTanggal} activeTanggal={tanggal} />

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none"
            title="pili tanggal"
          />
        </div>
        <button
          onClick={fetchSesi}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors shadow-sm"
          title="button"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Feedback */}
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
            {msg.type === "ok" ? (
              <CheckCircle2 size={15} />
            ) : (
              <AlertTriangle size={15} />
            )}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Memuat...
        </div>
      ) : !sesi ? (
        /* ── Belum ada sesi ── */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <CalendarDays size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">
            Belum ada sesi untuk tanggal ini
          </p>
          <p className="text-xs text-slate-400 mb-5">
            Buat sesi terlebih dahulu sebelum membuka pemilihan urutan pewawancara
          </p>
          <button
            onClick={() => {
              setFormSesi((f) => ({ ...f, tanggal_mulai: tanggal, tanggal_selesai: tanggal }));
              fetchKandidatCount(formSesi.jalur_masuk);
              setShowBuatSesi(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus size={15} /> Buat Sesi
          </button>
        </div>
      ) : (
        /* ── Ada sesi ── */
        <div className="space-y-5">
          {/* Status card */}
          <div
            className={`rounded-2xl border p-5 ${
              sesi.war_aktif
                ? "bg-amber-50 border-amber-200"
                : sesi.distribusi_done
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-slate-100"
            } shadow-sm`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {sesi.war_aktif ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full animate-pulse">
                      <Zap size={11} /> PEMILIHAN URUTAN WAWANCARA SEDANG BERLANGSUNG
                    </span>
                  ) : sesi.distribusi_done ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={11} /> DISTRIBUSI SELESAI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <ZapOff size={11} /> PEMILIHAN URUTAN WAWANCARA BELUM DIBUKA
                    </span>
                  )}
                </div>
                <p className="text-lg font-extrabold text-slate-800">
                  {new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>
                    Kuota pewawancara:{" "}
                    <b className="text-slate-700">{sesi.kuota_pewawancara}</b>
                  </span>
                  <span>
                    Kuota mahasiswa:{" "}
                    <b className="text-slate-700">{sesi.kuota_mahasiswa}</b>
                  </span>
                  {sesi.war_dibuka_at && (
                    <span>
                      Dibuka:{" "}
                      <b className="text-slate-700">
                        {new Date(sesi.war_dibuka_at).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </b>
                    </span>
                  )}
                  {!sesi.distribusi_done && (
                    <button
                      onClick={openEditKuota}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <Pencil size={11} /> Edit Kuota
                    </button>
                  )}
                  {!sesi.distribusi_done && (
                    <button
                      onClick={handleDeleteSesi}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={11} /> Hapus Sesi
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!sesi.distribusi_done && (
                  <button
                    onClick={handleToggleWAR}
                    disabled={toggling || kuotaPenuh}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 ${
                      sesi.war_aktif
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                  >
                    {toggling ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : sesi.war_aktif ? (
                      <ZapOff size={14} />
                    ) : (
                      <Zap size={14} />
                    )}
                    {sesi.war_aktif ? "Tutup Pemilihan Urutan Wawancara" : "Buka Pemilihan Urutan Wawancara"}
                  </button>
                )}
                {!sesi.distribusi_done && kuotaList.length > 0 && (
                  <button
                    onClick={handleDistribusi}
                    disabled={distributing || sesi.war_aktif}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                    title={
                      sesi.war_aktif ? "Tutup WAR dulu sebelum distribusi" : ""
                    }
                  >
                    {distributing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    Distribusi Mahasiswa
                  </button>
                )}
              </div>
            </div>

            {sesi.war_aktif && (
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Tutup WAR terlebih dahulu sebelum melakukan distribusi mahasiswa
              </p>
            )}
          </div>

          {/* Progress kuota */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Kuota Pewawancara
              </h3>
              <span className="text-xs font-bold text-primary">
                {kuotaList.length} / {sesi.kuota_pewawancara} terisi
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <motion.div
                className={`h-full rounded-full ${kuotaPenuh ? "bg-emerald-500" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{
                  width: `${(kuotaList.length / sesi.kuota_pewawancara) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Grid kuota */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: sesi.kuota_pewawancara }, (_, i) => {
                const kuotaItem = kuotaList.find((s) => s.kuota_ke === i + 1);
                return (
                  <div
                    key={i}
                    title={
                      kuotaItem
                        ? `${kuotaItem.pewawancara?.nama ?? "—"} (${new Date(kuotaItem.claimed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`
                        : `Kuota ${i + 1} — kosong`
                    }
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-default ${
                      kuotaItem
                        ? "bg-primary text-white shadow-sm"
                        : "bg-slate-100 text-slate-300"
                    }`}
                  >
                    <span>{i + 1}</span>
                    {kuotaItem && (
                      <span className="text-[8px] font-normal opacity-80 truncate w-full text-center px-1">
                        {kuotaItem.pewawancara?.nama?.split(" ")[0]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabel kuota terisi */}
          {kuotaList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">
                  Detail Kuota Terisi
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {[
                      "No.",
                      "Pewawancara",
                      "Email",
                      "Waktu Klaim",
                      "Mahasiswa (urutan)",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {kuotaList.map((s) => {
                    // Hitung urutan mahasiswa: kuota_ke=N → offset+N, offset+N+step, ...
                    const step = sesi.kuota_pewawancara;
                    const urutan = Array.from(
                      { length: Math.ceil(sesi.kuota_mahasiswa / step) },
                      (_, i) => offset + s.kuota_ke + i * step,
                    ).filter((n) => n <= offset + sesi.kuota_mahasiswa);

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {s.kuota_ke}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {s.pewawancara?.nama ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {s.pewawancara?.email}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(s.claimed_at).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {urutan.slice(0, 6).map((n) => (
                              <span
                                key={n}
                                className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                              >
                                #{n}
                              </span>
                            ))}
                            {urutan.length > 6 && (
                              <span className="text-[10px] text-slate-400">
                                +{urutan.length - 6} lagi
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal buat sesi */}
      <AnimatePresence>
        {showBuatSesi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800">
                    Buat Sesi Wawancara
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Pilih jalur masuk dan rentang tanggal
                  </p>
                </div>
                <button
                  onClick={() => setShowBuatSesi(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                  title="Tutup"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Jalur Masuk */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Jalur Masuk <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSesi.jalur_masuk}
                    title="Jalur masuk"
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormSesi((f) => ({ ...f, jalur_masuk: val }));
                      fetchKandidatCount(val);
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  >
                    <option value="SNBT ELIGIBLE">SNBT (Eligible)</option>
                    <option value="SNBT NON ELIGIBLE">SNBT (Non-Eligible)</option>
                    <option value="SNBP ELIGIBLE">SNBP (Eligible)</option>
                    <option value="SNBP NON ELIGIBLE">SNBP (Non-Eligible)</option>
                    <option value="UM">UM (Ujian Mandiri)</option>
                  </select>
                  {kandidatCount !== null && (
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Users size={11} />
                      {loadingCount ? "Menghitung..." : (
                        <>Total kandidat <b className="text-primary">{formSesi.jalur_masuk}</b>: <b className="text-slate-800">{kandidatCount}</b> mahasiswa</>
                      )}
                    </p>
                  )}
                </div>

                {/* Rentang Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Tanggal Mulai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formSesi.tanggal_mulai}
                      title="Tanggal mulai"
                      onChange={(e) =>
                        setFormSesi((f) => ({ ...f, tanggal_mulai: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      Tanggal Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      title="tanggal"
                      value={formSesi.tanggal_selesai}
                      min={formSesi.tanggal_mulai || undefined}
                      onChange={(e) =>
                        setFormSesi((f) => ({ ...f, tanggal_selesai: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                    />
                  </div>
                </div>

                {/* Preview distribusi */}
                {formSesi.tanggal_mulai && formSesi.tanggal_selesai && kandidatCount !== null && kandidatCount > 0 && (() => {
                  const start = new Date(formSesi.tanggal_mulai);
                  const end = new Date(formSesi.tanggal_selesai);
                  if (end < start) return null;
                  const jumlahHari = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const perHari = Math.floor(kandidatCount / jumlahHari);
                  const sisa = kandidatCount % jumlahHari;

                  return (
                    <div className="px-3 py-2.5 bg-primary/5 border border-primary/10 rounded-xl">
                      <p className="text-[11px] font-semibold text-primary mb-1.5">
                        Distribusi Otomatis ({jumlahHari} hari)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: jumlahHari }, (_, i) => {
                          const kuota = perHari + (i < sisa ? 1 : 0);
                          const d = new Date(start);
                          d.setDate(d.getDate() + i);
                          return (
                            <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white border border-primary/20 rounded-lg text-slate-700">
                              {d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: <span className="text-primary">{kuota}</span>
                            </span>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Total: {kandidatCount} mahasiswa (maks tidak melebihi jumlah kandidat)
                      </p>
                    </div>
                  );
                })()}

                {/* Kuota Pewawancara */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Kuota Pewawancara / hari
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formSesi.kuota_pewawancara}
                    title="Kuota pewawancara"
                    onChange={(e) =>
                      setFormSesi((f) => ({
                        ...f,
                        kuota_pewawancara: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  />
                  {formSesi.tanggal_mulai && formSesi.tanggal_selesai && kandidatCount !== null && kandidatCount > 0 && (() => {
                    const start = new Date(formSesi.tanggal_mulai);
                    const end = new Date(formSesi.tanggal_selesai);
                    if (end < start) return null;
                    const jumlahHari = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const perHari = Math.ceil(kandidatCount / jumlahHari);
                    const perPewawancara = Math.ceil(perHari / parseInt(formSesi.kuota_pewawancara || "1"));
                    return (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tiap pewawancara ≈ <b className="text-slate-700">{perPewawancara}</b> mahasiswa/hari
                      </p>
                    );
                  })()}
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowBuatSesi(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleBuatSesi}
                  disabled={savingSesi || !formSesi.tanggal_mulai || !formSesi.tanggal_selesai || !kandidatCount}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {savingSesi && <Loader2 size={14} className="animate-spin" />}
                  Buat Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal edit kuota */}
      <AnimatePresence>
        {showEditKuota && sesi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800">Edit Kuota Sesi</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setShowEditKuota(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100"
                  title="Tutup"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              {kuotaList.length > 0 && (
                <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {kuotaList.length} pewawancara sudah klaim kuota. Kuota pewawancara tidak boleh kurang dari {kuotaList.length}.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Kuota Pewawancara
                  </label>
                  <input
                    type="number"
                    min={Math.max(1, kuotaList.length)}
                    max={50}
                    value={editForm.kuota_pewawancara}
                    title="kuota pewawancara"
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        kuota_pewawancara: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Kuota Mahasiswa
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.kuota_mahasiswa}
                    title="kuota mahasiswa"
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        kuota_mahasiswa: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tiap pewawancara akan mewawancarai ±
                    {Math.ceil(
                      parseInt(editForm.kuota_mahasiswa || "1") /
                        parseInt(editForm.kuota_pewawancara || "1"),
                    )}{" "}
                    mahasiswa
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowEditKuota(false)}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditKuota}
                  disabled={savingEdit || parseInt(editForm.kuota_pewawancara) < kuotaList.length}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {savingEdit && <Loader2 size={14} className="animate-spin" />}
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.open && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-100"
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  confirmModal.variant === "danger" ? "bg-red-100" :
                  confirmModal.variant === "warning" ? "bg-amber-100" :
                  "bg-blue-100"
                }`}>
                  {confirmModal.variant === "danger" ? (
                    <Trash2 size={24} className="text-red-600" />
                  ) : confirmModal.variant === "warning" ? (
                    <Zap size={24} className="text-amber-600" />
                  ) : (
                    <Play size={24} className="text-blue-600" />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {confirmModal.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {confirmModal.description}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal((c) => ({ ...c, open: false }))}
                  className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 ${
                    confirmModal.variant === "danger"
                      ? "bg-red-500 hover:bg-red-600"
                      : confirmModal.variant === "warning"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {confirmModal.variant === "danger" ? "Hapus" :
                   confirmModal.variant === "warning" ? "Ya, Buka" : "Lanjutkan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
