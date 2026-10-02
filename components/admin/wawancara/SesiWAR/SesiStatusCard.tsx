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
    <div className="min-w-[120px] rounded-xl border border-admin-border-soft bg-admin-surface-soft px-4 py-3">
      <p className="text-[11px] font-medium text-admin-text-4">{label}</p>
      <p className="mt-0.5 text-lg font-bold leading-6 text-admin-text">{value}</p>
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
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-admin-accent/10 text-admin-accent">
            <CalendarDays size={20} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <StatusBadge sesi={sesi} />
            <p className="mt-1.5 font-admin-heading text-lg font-bold text-admin-text">
              {tanggalLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sesi.distribusi_done && (
            <>
              <button
                onClick={onEditKuota}
                className="inline-flex items-center gap-1.5 rounded-xl border border-admin-border px-3 py-2 text-sm font-semibold text-admin-text-2 transition-colors hover:bg-admin-surface-soft"
              >
                <Pencil size={14} /> Edit Kuota
              </button>
              <button
                onClick={onDeleteSesi}
                title="Hapus sesi"
                aria-label="Hapus sesi"
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-admin-border text-admin-text-4 transition-colors hover:border-admin-danger-border hover:bg-admin-danger-bg hover:text-admin-danger-text"
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          {!sesi.distribusi_done && kuotaList.length > 0 && (
            <button
              onClick={onDistribusi}
              disabled={distributing || sesi.war_aktif}
              className="inline-flex items-center gap-2 rounded-xl border border-admin-accent px-4 py-2 text-sm font-semibold text-admin-accent transition-colors hover:bg-admin-accent/5 disabled:cursor-not-allowed disabled:opacity-50"
              title={sesi.war_aktif ? "Tutup pemilihan dulu sebelum distribusi" : undefined}
            >
              {distributing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Distribusi Mahasiswa
            </button>
          )}

          {!sesi.distribusi_done && (
            <button
              onClick={onToggleWAR}
              disabled={toggling || (!sesi.war_aktif && kuotaPenuh)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
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
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-admin-border-soft px-5 py-4">
        <Stat label="Kuota pewawancara" value={sesi.kuota_pewawancara} />
        <Stat label="Kuota mahasiswa" value={sesi.kuota_mahasiswa} />
        <Stat
          label="Slot terisi"
          value={
            <>
              {kuotaList.length}
              <span className="text-sm font-medium text-admin-text-5">
                {" "}/ {sesi.kuota_pewawancara}
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
        <p className="flex items-center gap-2 border-t border-admin-border-soft px-5 py-3 text-xs text-admin-text-3">
          <Info size={13} className="shrink-0 text-admin-accent" />
          Tutup pemilihan terlebih dahulu sebelum mendistribusikan mahasiswa.
        </p>
      )}
    </div>
  );
}
