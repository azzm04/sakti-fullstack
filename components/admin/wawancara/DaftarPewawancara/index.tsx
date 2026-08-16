"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";
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
      if (!res.ok) {
        throw new Error(json.error ?? "Gagal memuat daftar pewawancara");
      }
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error("Gagal memuat daftar pewawancara", {
        description:
          err instanceof Error ? err.message : "Periksa koneksi Anda dan coba lagi.",
      });
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
    try {
      const res = await fetch(`/api/admin/pewawancara/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_akun: p.users?.status_akun === "AKTIF" ? "NON_AKTIF" : "AKTIF",
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Gagal mengubah status akun");
      }
    } catch (err) {
      toast.error("Gagal mengubah status akun", {
        description: err instanceof Error ? err.message : "Coba lagi.",
      });
    } finally {
      fetchData();
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/pewawancara/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Gagal menghapus pewawancara");
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus pewawancara", {
        description: err instanceof Error ? err.message : "Coba lagi.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total", value: total, color: "text-admin-accent" },
          {
            label: "Aktif",
            value: data.filter((p) => p.users?.status_akun === "AKTIF").length,
            color: "text-admin-accent",
          },
          {
            label: "Non-aktif",
            value: data.filter((p) => p.users?.status_akun !== "AKTIF").length,
            color: "text-admin-text-5",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-admin-border-soft shadow-sm p-5">
            <p className="text-xs text-admin-text-5 mb-1">{label}</p>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-admin-border rounded-xl bg-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent/20 transition-[border-color,box-shadow] duration-200"
          />
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-admin-accent text-white text-sm font-semibold rounded-xl hover:bg-admin-accent/90 transition-colors shadow-sm"
        >
          <Plus size={15} /> Tambah
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-admin-border-soft shadow-sm overflow-hidden">
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
