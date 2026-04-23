"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Pencil, Trash2, X, Loader2,
  CheckCircle2, UserCheck, Users, ShieldCheck,
  AlertTriangle, Mail
} from "lucide-react";

import type { Pewawancara } from "@/schemas";

export default function DaftarPewawancara() {
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
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    fetchData();
  }

  async function handleDelete(p: Pewawancara) {
    if (
      !confirm(
        `Hapus pewawancara ${p.nama ?? p.email}?\nAkses login mereka juga akan dinonaktifkan.`,
      )
    )
      return;
    await fetch(`/api/admin/pewawancara/${p.id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Pewawancara", value: total, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Akun Aktif", value: data.filter((p) => p.is_active).length, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Akun Non-aktif", value: data.filter((p) => !p.is_active).length, icon: AlertTriangle, color: "text-slate-500", bg: "bg-slate-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex items-center gap-5"
          >
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg} ${color}`}
            >
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className={`text-3xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau email pewawancara..."
              className="w-full pl-12 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-normal"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-2xl hover:bg-indigo-600 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-sm"
          >
            <Plus size={18} /> Tambah Pewawancara
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
            <Loader2 size={24} className="animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Memuat data...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <UserCheck size={32} className="text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Belum ada pewawancara
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Tambahkan akun pewawancara agar mereka bisa login dan mulai
              melakukan evaluasi mahasiswa.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500">
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                    Identitas Pewawancara
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                    SSO ID
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                    Progress Tugas
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">
                    Akses Login
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {p.nama ? (
                            p.nama.charAt(0).toUpperCase()
                          ) : (
                            <UserCheck size={18} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {p.nama ?? "—"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {p.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {p.sso_id ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-500">
                            Selesai:{" "}
                            <span className="text-emerald-600">
                              {p.total_completed}
                            </span>
                          </span>
                          <span className="text-slate-400">
                            Total: {p.total_assigned}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width:
                                p.total_assigned > 0
                                  ? `${(p.total_completed / p.total_assigned) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                          p.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700"
                        }`}
                      >
                        {p.is_active ? (
                          <>
                            <CheckCircle2 size={14} /> Aktif
                          </>
                        ) : (
                          "Non-aktif"
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-xl text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UserCheck size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editing ? "Edit Pewawancara" : "Pewawancara Baru"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  title="Tutup"
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nama: e.target.value }))
                    }
                    placeholder="Contoh: Dr. Budi Santoso, M.Kom."
                    className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:font-normal"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Alamat Email <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="pewawancara@undip.ac.id"
                      disabled={!!editing}
                      className="w-full pl-11 pr-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 disabled:bg-slate-50 transition-all placeholder:font-normal"
                    />
                  </div>
                </div>

                {!editing && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Pewawancara yang ditambahkan otomatis dapat login
                      menggunakan sistem <b>OTP ke Email</b>. SSO ID (untuk
                      login internal) akan dibuatkan oleh sistem secara
                      otomatis.
                    </p>
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-100">
                    <AlertTriangle size={14} /> {formError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 text-sm font-semibold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}