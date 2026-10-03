"use client";

import {
  Lock,
  LockOpen,
  CheckCircle2,
  Pencil,
  Trash2,
  Send,
  Loader2,
  Info,
  CalendarDays,
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

function StatusBadge({ sesi }: { sesi: Sesi }) {
  if (sesi.war_aktif) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Pemilihan sedang berlangsung
      </span>
    );
  }

  if (sesi.distribusi_done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-accent/25 bg-admin-accent/10 px-2.5 py-1 text-[11px] font-semibold text-admin-accent-ink">
        <CheckCircle2 size={12} /> Distribusi selesai
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface-soft px-2.5 py-1 text-[11px] font-semibold text-admin-text-3">
      <Lock size={11} /> Pemilihan belum dibuka
    </span>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-admin-border-soft bg-admin-surface-soft px-3.5 py-2.5">
      <p className="truncate text-[11px] font-medium text-admin-text-4">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-6 text-admin-text">
        {value}
      </p>
    </div>
  );
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
  const tanggalLabel = new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-2xl border border-admin-border-soft bg-white shadow-sm">
      {/* HP: aksi turun ke baris sendiri. Tablet ke atas: aksi di kanan. */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-admin-accent/10 text-admin-accent sm:h-11 sm:w-11">
            <CalendarDays size={20} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <StatusBadge sesi={sesi} />
            <p className="mt-1.5 font-admin-heading text-base font-bold text-admin-text sm:text-lg">
              {tanggalLabel}
            </p>
          </div>
        </div>

        {!sesi.distribusi_done && (
          <div className="flex items-center gap-2 sm:shrink-0">
            {/* Edit & Hapus: ikon saja di HP/tablet, dengan label mulai layar lebar */}
            <button
              onClick={onEditKuota}
              title="Edit kuota sesi"
              aria-label="Edit kuota sesi"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-admin-border text-[13px] font-semibold text-admin-text-2 transition-colors hover:bg-admin-surface-soft lg:w-auto lg:px-3"
            >
              <Pencil size={14} />
              <span className="hidden lg:inline">Edit Kuota</span>
            </button>
            <button
              onClick={onDeleteSesi}
              title="Hapus sesi"
              aria-label="Hapus sesi"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-admin-border text-[13px] font-semibold text-admin-text-2 transition-colors hover:border-admin-danger-border hover:bg-admin-danger-bg hover:text-admin-danger-text lg:w-auto lg:px-3"
            >
              <Trash2 size={14} />
              <span className="hidden lg:inline">Hapus Sesi</span>
            </button>

            {kuotaList.length > 0 && (
              <button
                onClick={onDistribusi}
                disabled={distributing || sesi.war_aktif}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-admin-accent px-3 text-[13px] font-semibold text-admin-accent transition-colors hover:bg-admin-accent/5 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                title={
                  sesi.war_aktif
                    ? "Tutup pemilihan dulu sebelum distribusi"
                    : undefined
                }
              >
                {distributing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Distribusi
              </button>
            )}

            <button
              onClick={onToggleWAR}
              disabled={toggling || (!sesi.war_aktif && kuotaPenuh)}
              className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none ${
                sesi.war_aktif
                  ? "border border-admin-danger-border bg-admin-danger-bg text-admin-danger-text hover:bg-admin-danger-border"
                  : "border border-admin-accent bg-admin-accent text-white hover:bg-admin-accent-hover"
              }`}
            >
              {toggling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : sesi.war_aktif ? (
                <Lock size={14} />
              ) : (
                <LockOpen size={14} />
              )}
              {sesi.war_aktif ? "Tutup Pemilihan" : "Buka Pemilihan"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 border-t border-admin-border-soft px-4 py-4 sm:grid-cols-4 sm:gap-3 sm:px-5">
        <Stat label="Kuota pewawancara" value={sesi.kuota_pewawancara} />
        <Stat label="Kuota mahasiswa" value={sesi.kuota_mahasiswa} />
        <Stat
          label="Slot terisi"
          value={
            <>
              {kuotaList.length}
              <span className="text-sm font-medium text-admin-text-5">
                {" "}
                / {sesi.kuota_pewawancara}
              </span>
            </>
          }
        />
        {sesi.war_dibuka_at && (
          <Stat
            label="Dibuka pukul"
            value={new Date(sesi.war_dibuka_at).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          />
        )}
      </div>

      {sesi.war_aktif && (
        <p className="flex items-start gap-2 border-t border-admin-border-soft px-4 py-3 text-xs text-admin-text-3 sm:items-center sm:px-5">
          <Info size={13} className="mt-px shrink-0 text-admin-accent sm:mt-0" />
          Tutup pemilihan terlebih dahulu sebelum mendistribusikan mahasiswa.
        </p>
      )}
    </div>
  );
}
