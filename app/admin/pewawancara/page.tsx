"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Pencil, Trash2, X, Loader2, CheckCircle2,
  UserCheck, CalendarDays, Users, Zap, ZapOff, Play, RefreshCw,
  AlertTriangle,
} from "lucide-react";

interface Pewawancara {
  id: number;
  email: string;
  nama: string | null;
  sso_id: string | null;
  total_assigned: number;
  total_completed: number;
  is_active: boolean;
  created_at: string;
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

interface Slot {
  id: number;
  slot_ke: number;
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
        <span>Management</span>
        <span>›</span>
        <span className="text-primary">Pewawancara</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 font-headline tracking-tight">Pewawancara</h1>
        <p className="text-slate-500 text-sm mt-1">Kelola pewawancara dan sesi WAR harian</p>
      </div>

      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit mb-6 shadow-sm">
        {([
          { key: "daftar", label: "Daftar Pewawancara", icon: Users },
          { key: "sesi",   label: "Sesi WAR",           icon: Zap  },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"
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
    setForm({ email: p.email, nama: p.nama ?? "" });
    setFormError("");
    setShowModal(true);
  }

  async function handleSave() {
    setFormError("");
    if (!form.email || !form.nama) { setFormError("Email dan nama wajib diisi"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/pewawancara/${editing.id}` : "/api/admin/pewawancara";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, nama: form.nama }),
      });
      const json = await res.json();
      if (!res.ok) { setFormError(json.error ?? "Gagal menyimpan"); return; }
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
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    fetchData();
  }

  async function handleDelete(p: Pewawancara) {
    if (!confirm(`Hapus pewawancara ${p.nama ?? p.email}?\nAkses login mereka juga akan dinonaktifkan.`)) return;
    await fetch(`/api/admin/pewawancara/${p.id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total",     value: total,                                   color: "text-primary"     },
          { label: "Aktif",     value: data.filter((p) => p.is_active).length,  color: "text-emerald-600" },
          { label: "Non-aktif", value: data.filter((p) => !p.is_active).length, color: "text-slate-400"   },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm">
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
                {["Nama / Email", "ID", "Assigned", "Selesai", "Status", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{p.nama ?? "—"}</p>
                    <p className="text-[11px] text-slate-400">{p.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg">
                      {p.sso_id ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">{p.total_assigned}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-600">{p.total_completed}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(p)}
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                        p.is_active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                      }`}>
                      {p.is_active ? <><CheckCircle2 size={10} /> Aktif</> : "Non-aktif"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(p)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
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
            <p className="text-sm text-slate-400">Belum ada pewawancara terdaftar</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-800">{editing ? "Edit Pewawancara" : "Tambah Pewawancara"}</h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="pewawancara@undip.ac.id" disabled={!!editing}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 disabled:opacity-60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama <span className="text-red-500">*</span></label>
                  <input type="text" value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                    placeholder="Dr. Budi Santoso, M.Kom."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50 transition-all"
                  />
                </div>
                {!editing && (
                  <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    Pewawancara otomatis bisa login via OTP. SSO ID di-generate otomatis.
                  </p>
                )}
                {formError && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{formError}</p>}
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Batal</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
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
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<number | null>(null);
  const [showBuatSesi, setShowBuatSesi] = useState(false);
  const [formSesi, setFormSesi] = useState({ kuota_pewawancara: "20", kuota_mahasiswa: "120" });
  const [savingSesi, setSavingSesi] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchSesi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sesi?tanggal=${tanggal}`);
      const json = await res.json();
      setSesi(json.sesi ?? null);
      setSlots(json.slots ?? []);
    } finally {
      setLoading(false);
    }
  }, [tanggal]);

  useEffect(() => { fetchSesi(); }, [fetchSesi]);

  useEffect(() => {
    if (!sesi?.war_aktif) return;
    const t = setInterval(fetchSesi, 5000);
    return () => clearInterval(t);
  }, [sesi?.war_aktif, fetchSesi]);

  async function handleBuatSesi() {
    setSavingSesi(true);
    try {
      const res = await fetch("/api/admin/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tanggal,
          kuota_pewawancara: parseInt(formSesi.kuota_pewawancara),
          kuota_mahasiswa: parseInt(formSesi.kuota_mahasiswa),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: json.error }); return; }
      setShowBuatSesi(false);
      fetchSesi();
    } finally {
      setSavingSesi(false);
    }
  }

  async function handleToggleWAR() {
    if (!sesi) return;
    const newState = !sesi.war_aktif;
    if (newState && !confirm(`Buka WAR untuk ${new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}?\nPewawancara akan bisa klaim slot sekarang.`)) return;
    setToggling(true);
    try {
      const res = await fetch("/api/admin/sesi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sesi.id, war_aktif: newState }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: json.error }); return; }
      setSesi(json.data);
      setMsg({ type: "ok", text: newState ? "WAR dibuka! Pewawancara bisa klaim slot." : "WAR ditutup." });
      setTimeout(() => setMsg(null), 3000);
    } finally {
      setToggling(false);
    }
  }

  async function handleDistribusi() {
    if (!sesi) return;
    if (slots.length === 0) { setMsg({ type: "err", text: "Belum ada pewawancara yang mengisi slot" }); return; }
    if (!confirm(`Distribusikan mahasiswa ke ${slots.length} pewawancara?\nTindakan ini tidak bisa dibatalkan.`)) return;
    setDistributing(true);
    try {
      const res = await fetch("/api/admin/sesi/distribusi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sesi_id: sesi.id }),
      });
      const json = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: json.error }); return; }
      setMsg({ type: "ok", text: `Berhasil! ${json.total_assigned} mahasiswa didistribusikan ke ${json.pewawancara_count} pewawancara.` });
      fetchSesi();
    } finally {
      setDistributing(false);
    }
  }

  async function handleHapusSlot(slotId: number, namaPewawancara: string) {
    if (!confirm(`Hapus ${namaPewawancara} dari slot WAR?\nMereka bisa klaim slot lagi jika WAR masih aktif.`)) return;
    setDeletingSlot(slotId);
    try {
      const res = await fetch(`/api/admin/sesi?slot_id=${slotId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: json.error }); return; }
      setMsg({ type: "ok", text: `${namaPewawancara} berhasil dihapus dari slot` });
      setTimeout(() => setMsg(null), 3000);
      fetchSesi();
    } finally {
      setDeletingSlot(null);
    }
  }

  const slotPenuh = sesi ? slots.length >= sesi.kuota_pewawancara : false;

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          <CalendarDays size={15} className="text-slate-400" />
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="text-sm font-semibold text-slate-700 bg-transparent focus:outline-none"
          />
        </div>
        <button onClick={fetchSesi} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary transition-colors shadow-sm">
          <RefreshCw size={14} />
        </button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${
              msg.type === "ok" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"
            }`}>
            {msg.type === "ok" ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Memuat...
        </div>
      ) : !sesi ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <CalendarDays size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">Belum ada sesi untuk tanggal ini</p>
          <p className="text-xs text-slate-400 mb-5">Buat sesi terlebih dahulu sebelum membuka WAR</p>
          <button onClick={() => setShowBuatSesi(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={15} /> Buat Sesi
          </button>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Status card */}
          <div className={`rounded-2xl border p-5 shadow-sm ${
            sesi.war_aktif ? "bg-amber-50 border-amber-200" :
            sesi.distribusi_done ? "bg-emerald-50 border-emerald-200" : "bg-white border-slate-100"
          }`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {sesi.war_aktif ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full animate-pulse">
                      <Zap size={11} /> WAR SEDANG BERLANGSUNG
                    </span>
                  ) : sesi.distribusi_done ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={11} /> DISTRIBUSI SELESAI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      <ZapOff size={11} /> WAR BELUM DIBUKA
                    </span>
                  )}
                </div>
                <p className="text-lg font-extrabold text-slate-800">
                  {new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                  <span>Kuota pewawancara: <b className="text-slate-700">{sesi.kuota_pewawancara}</b></span>
                  <span>Kuota mahasiswa: <b className="text-slate-700">{sesi.kuota_mahasiswa}</b></span>
                  {sesi.war_dibuka_at && (
                    <span>Dibuka: <b className="text-slate-700">{new Date(sesi.war_dibuka_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</b></span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!sesi.distribusi_done && (
                  <button onClick={handleToggleWAR} disabled={toggling || slotPenuh}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 ${
                      sesi.war_aktif ? "bg-red-500 text-white hover:bg-red-600" : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}>
                    {toggling ? <Loader2 size={14} className="animate-spin" /> : sesi.war_aktif ? <ZapOff size={14} /> : <Zap size={14} />}
                    {sesi.war_aktif ? "Tutup WAR" : "Buka WAR"}
                  </button>
                )}
                {!sesi.distribusi_done && slots.length > 0 && (
                  <button onClick={handleDistribusi} disabled={distributing || sesi.war_aktif}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
                    title={sesi.war_aktif ? "Tutup WAR dulu sebelum distribusi" : ""}>
                    {distributing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    Distribusi Mahasiswa
                  </button>
                )}
              </div>
            </div>
            {sesi.war_aktif && (
              <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Tutup WAR terlebih dahulu sebelum melakukan distribusi mahasiswa
              </p>
            )}
          </div>

          {/* Progress slot */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Slot Pewawancara</h3>
              <span className="text-xs font-bold text-primary">{slots.length} / {sesi.kuota_pewawancara} terisi</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
              <motion.div
                className={`h-full rounded-full ${slotPenuh ? "bg-emerald-500" : "bg-primary"}`}
                initial={{ width: 0 }}
                animate={{ width: `${(slots.length / sesi.kuota_pewawancara) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: sesi.kuota_pewawancara }, (_, i) => {
                const slot = slots.find((s) => s.slot_ke === i + 1);
                return (
                  <div key={i}
                    title={slot ? `${slot.pewawancara?.nama ?? "—"} (${new Date(slot.claimed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})` : `Slot ${i + 1} — kosong`}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-default ${
                      slot ? "bg-primary text-white shadow-sm" : "bg-slate-100 text-slate-300"
                    }`}>
                    <span>{i + 1}</span>
                    {slot && <span className="text-[8px] font-normal opacity-80 truncate w-full text-center px-1">{slot.pewawancara?.nama?.split(" ")[0]}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabel slot terisi */}
          {slots.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Detail Slot Terisi</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {["Slot", "Pewawancara", "Email", "Waktu Klaim", "Mahasiswa (urutan)", "Aksi"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {slots.map((s) => {
                    const step = sesi.kuota_pewawancara;
                    const urutan = Array.from(
                      { length: Math.ceil(sesi.kuota_mahasiswa / step) },
                      (_, i) => s.slot_ke + i * step
                    ).filter((n) => n <= sesi.kuota_mahasiswa);
                    const isDeleting = deletingSlot === s.id;

                    return (
                      <tr key={s.id} className={`transition-colors ${isDeleting ? "opacity-50" : "hover:bg-slate-50/60"}`}>
                        <td className="px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                            {s.slot_ke}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{s.pewawancara?.nama ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{s.pewawancara?.email}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {new Date(s.claimed_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {urutan.slice(0, 6).map((n) => (
                              <span key={n} className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">#{n}</span>
                            ))}
                            {urutan.length > 6 && <span className="text-[10px] text-slate-400">+{urutan.length - 6} lagi</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {!sesi.distribusi_done ? (
                            <button
                              onClick={() => handleHapusSlot(s.id, s.pewawancara?.nama ?? "Pewawancara")}
                              disabled={isDeleting}
                              title="Hapus dari slot WAR"
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40 transition-colors"
                            >
                              {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                            </button>
                          ) : (
                            <span className="text-slate-200 text-xs">—</span>
                          )}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800">Buat Sesi Wawancara</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setShowBuatSesi(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={16} className="text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Kuota Pewawancara / hari</label>
                  <input type="number" min={1} max={50} value={formSesi.kuota_pewawancara}
                    onChange={(e) => setFormSesi((f) => ({ ...f, kuota_pewawancara: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Jumlah slot WAR yang tersedia (default: 20)</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Kuota Mahasiswa / hari</label>
                  <input type="number" min={1} value={formSesi.kuota_mahasiswa}
                    onChange={(e) => setFormSesi((f) => ({ ...f, kuota_mahasiswa: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary bg-slate-50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tiap pewawancara ±{Math.ceil(parseInt(formSesi.kuota_mahasiswa || "120") / parseInt(formSesi.kuota_pewawancara || "20"))} mahasiswa
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={() => setShowBuatSesi(false)} className="flex-1 py-2.5 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Batal</button>
                <button onClick={handleBuatSesi} disabled={savingSesi}
                  className="flex-1 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                  {savingSesi && <Loader2 size={14} className="animate-spin" />}
                  Buat Sesi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
