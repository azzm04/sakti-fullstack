"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function UbahStatus({ id, currentStatus }: { id: string, currentStatus: string }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // State untuk menangani notifikasi inline (toast)
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    // Hilangkan notifikasi secara otomatis setelah 3 detik
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };

  const updateStatus = async (statusBaru: string) => {
    setIsUpdating(true);
    setMessage(null); // Reset pesan sebelumnya
    
    try {
      const res = await fetch(`/api/admin/aduan/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusBaru }),
      });

      if (res.ok) {
        showToast("Status berhasil diperbarui!", "success");
        router.refresh(); 
      } else {
        showToast("Gagal memperbarui status.", "error");
      }
    } catch (error) {
      showToast("Terjadi kesalahan server.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block w-full md:w-auto">
      <select
        disabled={isUpdating}
        value={currentStatus}
        onChange={(e) => updateStatus(e.target.value)}
        className="w-full md:w-auto px-4 py-2.5 rounded-lg border-2 border-slate-300 text-sm font-bold text-slate-700 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer disabled:opacity-50 transition-all"
      >
        <option value="MENUNGGU">Tandai Menunggu</option>
        <option value="DIPROSES">Tandai Diproses</option>
        <option value="SELESAI">Tandai Selesai</option>
        <option value="DITOLAK">Tolak Laporan</option>
      </select>

      {/* Inline Toast Notification yang elegan */}
      {message && (
        <div className={`absolute right-0 top-full mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg border z-50 animate-in fade-in slide-in-from-top-2 whitespace-nowrap text-sm font-bold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}