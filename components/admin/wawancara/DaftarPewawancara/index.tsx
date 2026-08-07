"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import type { Pewawancara } from "@/types/wawancara";
import PewawancaraTable from "./PewawancaraTable";
import PewawancaraFormModal from "./PewawancaraFormModal";
import ConfirmModal from "../shared/ConfirmModal";

export default function DaftarPewawancara() {
  const [data, setData] = useState<Pewawancara[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Pewawancara | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pewawancara | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      body: JSON.stringify({
        status_akun: p.users?.status_akun === "AKTIF" ? "NON_AKTIF" : "AKTIF",
      }),
    });
    fetchData();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/pewawancara/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      fetchData();
    } finally {
      setDeleting(false);
    }
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
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs text-slate-400 mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
        <PewawancaraTable
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onToggleActive={handleToggleActive}
        />
      </div>

      <PewawancaraFormModal
        open={showModal}
        editing={!!editing}
        form={form}
        formError={formError}
        saving={saving}
        onChange={setForm}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        open={!!deleteTarget}
        variant="danger"
        title="Hapus Pewawancara?"
        description={`Akun ${
          deleteTarget?.nama ?? deleteTarget?.users?.email_sso ?? ""
        } akan dihapus dan akses loginnya dinonaktifkan.`}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
