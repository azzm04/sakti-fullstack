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
          ? "bg-admin-warn-bg-2 border-admin-warn-border"
          : sesi.distribusi_done
            ? "bg-admin-accent/10 border-admin-accent/25"
            : "bg-white border-admin-border-soft"
      } shadow-sm`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {sesi.war_aktif ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-admin-warn-text bg-admin-warn-border px-2.5 py-1 rounded-full animate-pulse">
                <Zap size={11} /> PEMILIHAN URUTAN WAWANCARA SEDANG BERLANGSUNG
              </span>
            ) : sesi.distribusi_done ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-admin-accent-ink bg-admin-accent/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 size={11} /> DISTRIBUSI SELESAI
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-admin-text-4 bg-admin-border-soft px-2.5 py-1 rounded-full">
                <ZapOff size={11} /> PEMILIHAN URUTAN WAWANCARA BELUM DIBUKA
              </span>
            )}
          </div>
          <p className="text-lg font-extrabold text-admin-text">
            {new Date(tanggal).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-admin-text-4">
            <span>
              Kuota pewawancara: <b className="text-admin-text-2">{sesi.kuota_pewawancara}</b>
            </span>
            <span>
              Kuota mahasiswa: <b className="text-admin-text-2">{sesi.kuota_mahasiswa}</b>
            </span>
            {sesi.war_dibuka_at && (
              <span>
                Dibuka:{" "}
                <b className="text-admin-text-2">
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
                className="inline-flex items-center gap-1 text-xs font-semibold text-admin-accent hover:text-admin-accent/80 transition-colors"
              >
                <Pencil size={11} /> Edit Kuota
              </button>
            )}
            {!sesi.distribusi_done && (
              <button
                onClick={onDeleteSesi}
                className="inline-flex items-center gap-1 text-xs font-semibold text-admin-danger-bar hover:text-admin-danger-text transition-colors"
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
                  ? "bg-admin-amber-danger text-white hover:brightness-110"
                  : "bg-admin-amber text-white hover:brightness-110"
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
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-admin-accent text-white rounded-xl hover:bg-admin-accent/90 disabled:opacity-50 transition-all"
              title={sesi.war_aktif ? "Tutup WAR dulu sebelum distribusi" : ""}
            >
              {distributing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              Distribusi Mahasiswa
            </button>
          )}
        </div>
      </div>

      {sesi.war_aktif && (
        <p className="text-xs text-admin-warn-text mt-3 flex items-center gap-1.5">
          <AlertTriangle size={12} />
          Tutup WAR terlebih dahulu sebelum melakukan distribusi mahasiswa
        </p>
      )}
    </div>
  );
}
