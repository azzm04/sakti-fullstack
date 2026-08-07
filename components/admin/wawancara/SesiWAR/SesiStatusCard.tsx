"use client";

import {
  Zap,
  ZapOff,
  CheckCircle2,
  Pencil,
  Trash2,
  Play,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { Sesi, KuotaItem } from "@/types/wawancara";

interface SesiStatusCardProps {
  sesi: Sesi;
  tanggal: string;
  kuotaList: KuotaItem[];
  toggling: boolean;
  distributing: boolean;
  onEditKuota: () => void;
  onDeleteSesi: () => void;
  onToggleWAR: () => void;
  onDistribusi: () => void;
}

export default function SesiStatusCard({
  sesi,
  tanggal,
  kuotaList,
  toggling,
  distributing,
  onEditKuota,
  onDeleteSesi,
  onToggleWAR,
  onDistribusi,
}: SesiStatusCardProps) {
  const kuotaPenuh = kuotaList.length >= sesi.kuota_pewawancara;

  return (
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
              Kuota pewawancara: <b className="text-slate-700">{sesi.kuota_pewawancara}</b>
            </span>
            <span>
              Kuota mahasiswa: <b className="text-slate-700">{sesi.kuota_mahasiswa}</b>
            </span>
            {sesi.war_dibuka_at && (
              <span>
                Dibuka:{" "}
                <b className="text-slate-700">
                  {new Date(sesi.war_dibuka_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </b>
              </span>
            )}
            {!sesi.distribusi_done && (
              <button
                onClick={onEditKuota}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <Pencil size={11} /> Edit Kuota
              </button>
            )}
            {!sesi.distribusi_done && (
              <button
                onClick={onDeleteSesi}
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
              onClick={onToggleWAR}
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
              {sesi.war_aktif
                ? "Tutup Pemilihan Urutan Wawancara"
                : "Buka Pemilihan Urutan Wawancara"}
            </button>
          )}
          {!sesi.distribusi_done && kuotaList.length > 0 && (
            <button
              onClick={onDistribusi}
              disabled={distributing || sesi.war_aktif}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              title={sesi.war_aktif ? "Tutup WAR dulu sebelum distribusi" : ""}
            >
              {distributing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
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
  );
}
