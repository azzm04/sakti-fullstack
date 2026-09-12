"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";
import type { MahasiswaKipk } from "@/types/wawancara";
import MahasiswaTable from "./MahasiswaTable";
import MahasiswaFormModal from "./MahasiswaFormModal";
import JadikanPewawancaraModal from "./JadikanPewawancaraModal";
import ConfirmModal from "../shared/ConfirmModal";

export default function DaftarMahasiswa() {
  const [data, setData] = useState<MahasiswaKipk[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<MahasiswaKipk | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MahasiswaKipk | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: "", nim: "", angkatan: "" });
  const [formError, setFormError] = useState("");

  const [pewawancaraTarget, setPewawancaraTarget] = useState<MahasiswaKipk | null>(null);
  const [pewawancaraNama, setPewawancaraNama] = useState("");
  const [pewawancaraError, setPewawancaraError] = useState("");
  const [assigningPewawancara, setAssigningPewawancara] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(search ? { search } : {});
      const res = await fetch(`/api/admin/mahasiswa-kipk?${params}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Gagal memuat daftar mahasiswa");
      }
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch (err) {
      toast.error("Gagal memuat daftar mahasiswa", {
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

  function openEdit(m: MahasiswaKipk) {
    setEditing(m);
    setForm({
      nama: m.penerima_kipk?.nama ?? "",
      nim: m.penerima_kipk?.nim ?? "",
      angkatan: m.penerima_kipk?.angkatan?.toString() ?? "",
    });
    setFormError("");
  }

  async function handleSave() {
    if (!editing) return;
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/mahasiswa-kipk/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: form.nama || null,
          nim: form.nim || null,
          angkatan: form.angkatan ? parseInt(form.angkatan, 10) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Gagal menyimpan");
        return;
      }
      setEditing(null);
      fetchData();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(m: MahasiswaKipk) {
    try {
      const res = await fetch(`/api/admin/mahasiswa-kipk/${m.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status_akun: m.status_akun === "AKTIF" ? "NONAKTIF" : "AKTIF",
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

  function openJadikanPewawancara(m: MahasiswaKipk) {
    setPewawancaraTarget(m);
    setPewawancaraNama(m.penerima_kipk?.nama ?? "");
    setPewawancaraError("");
  }

  async function handleAssignPewawancara() {
    if (!pewawancaraTarget) return;
    setPewawancaraError("");
    if (!pewawancaraNama.trim()) {
      setPewawancaraError("Nama wajib diisi");
      return;
    }
    setAssigningPewawancara(true);
    try {
      // Endpoint yang sama dengan "+ Tambah" di tab Pewawancara — email
      // sudah dikenal (sudah ada akunnya sebagai Mahasiswa KIP-K), backend
      // akan menambahkan role PEWAWANCARA ke akun ini, bukan membuat baru.
      const res = await fetch("/api/admin/pewawancara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pewawancaraTarget.email_sso, nama: pewawancaraNama.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPewawancaraError(json.error ?? "Gagal menambah role");
        return;
      }
      setPewawancaraTarget(null);
      toast.success("Role Pewawancara ditambahkan", {
        description: `${pewawancaraTarget.email_sso} sekarang juga bisa masuk sebagai pewawancara.`,
      });
      fetchData();
    } finally {
      setAssigningPewawancara(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/mahasiswa-kipk/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Gagal menghapus akun mahasiswa");
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus akun mahasiswa", {
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
            value: data.filter((m) => m.status_akun === "AKTIF").length,
            color: "text-admin-accent",
          },
          {
            label: "Non-aktif",
            value: data.filter((m) => m.status_akun !== "AKTIF").length,
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
            placeholder="Cari nama, email, atau NIM..."
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-admin-border rounded-xl bg-white focus:outline-none focus:border-admin-accent focus:ring-1 focus:ring-admin-accent/20 transition-[border-color,box-shadow] duration-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-admin-border-soft shadow-sm overflow-hidden">
        <MahasiswaTable
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onToggleActive={handleToggleActive}
          onJadikanPewawancara={openJadikanPewawancara}
        />
      </div>

      <MahasiswaFormModal
        open={!!editing}
        email={editing?.email_sso ?? ""}
        form={form}
        formError={formError}
        saving={saving}
        onChange={setForm}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />

      <JadikanPewawancaraModal
        open={!!pewawancaraTarget}
        email={pewawancaraTarget?.email_sso ?? ""}
        nama={pewawancaraNama}
        formError={pewawancaraError}
        saving={assigningPewawancara}
        onChangeNama={setPewawancaraNama}
        onClose={() => setPewawancaraTarget(null)}
        onSave={handleAssignPewawancara}
      />

      <ConfirmModal
        open={!!deleteTarget}
        variant="danger"
        title="Hapus Akun Mahasiswa?"
        description={
          deleteTarget && deleteTarget.roles.length > 1
            ? `Profil KIP-K untuk ${
                deleteTarget?.penerima_kipk?.nama ?? deleteTarget?.email_sso ?? ""
              } akan dihapus. Akun tetap aktif karena masih punya role Pewawancara.`
            : `Profil KIP-K untuk ${
                deleteTarget?.penerima_kipk?.nama ?? deleteTarget?.email_sso ?? ""
              } akan dihapus dan akses loginnya dinonaktifkan.`
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
