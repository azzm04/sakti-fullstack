"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UbahStatus({ id, currentStatus }: { id: string, currentStatus: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateStatus = async (statusBaru: string) => {
    setIsUpdating(true);
    try {
      // Memanggil API PATCH yang sudah Anda buat sebelumnya
      const res = await fetch(`/api/admin/aduan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru }),
      });

      if (res.ok) {
        alert("Status laporan berhasil diperbarui!");
        router.refresh(); // Me-refresh data halaman secara otomatis
      } else {
        alert("Gagal memperbarui status laporan.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat menghubungi server.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      disabled={isUpdating}
      value={currentStatus}
      onChange={(e) => updateStatus(e.target.value)}
      className="px-4 py-2.5 rounded-lg border-2 border-slate-300 text-sm font-bold text-slate-700 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer disabled:opacity-50"
    >
      <option value="MENUNGGU">Tandai Menunggu</option>
      <option value="DIPROSES">Tandai Diproses</option>
      <option value="SELESAI">Tandai Selesai</option>
      <option value="DITOLAK">Tolak Laporan</option>
    </select>
  );
}