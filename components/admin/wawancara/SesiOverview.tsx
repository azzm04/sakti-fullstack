'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, ZapOff, CheckCircle2, CalendarDays, Users, ChevronRight, Loader2,
} from 'lucide-react';

interface SesiItem {
  id: number;
  tanggal: string;
  kuota_pewawancara: number;
  kuota_mahasiswa: number;
  war_aktif: boolean;
  distribusi_done: boolean;
  jalur_masuk?: string;
  kuota_terisi?: number;
}

interface Props {
  onSelectTanggal: (tanggal: string) => void;
  activeTanggal: string;
}

export default function SesiOverview({ onSelectTanggal, activeTanggal }: Props) {
  const [sesiList, setSesiList] = useState<SesiItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllSesi();
  }, []);

  async function fetchAllSesi() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sesi/list');
      const json = await res.json();
      if (res.ok) {
        setSesiList(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  // Refresh saat activeTanggal berubah (mungkin ada sesi baru dibuat)
  useEffect(() => {
    fetchAllSesi();
  }, [activeTanggal]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-admin-text-5 py-3">
        <Loader2 size={12} className="animate-spin" /> Memuat sesi...
      </div>
    );
  }

  if (sesiList.length === 0) return null;

  const activeCount = sesiList.filter(s => s.war_aktif).length;
  const doneCount = sesiList.filter(s => s.distribusi_done).length;
  const pendingCount = sesiList.filter(s => !s.war_aktif && !s.distribusi_done).length;

  return (
    <div className="mb-6">
      {/* Summary stats */}
      <div className="flex items-center gap-4 mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-5">
          Ringkasan Sesi
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-admin-warn-text bg-admin-warn-bg-2 px-2 py-0.5 rounded-full border border-admin-warn-border">
              <Zap size={10} /> {activeCount} Aktif
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-admin-text-4 bg-admin-border-soft px-2 py-0.5 rounded-full border border-admin-border">
              <ZapOff size={10} /> {pendingCount} Menunggu
            </span>
          )}
          {doneCount > 0 && (
            <span className="flex items-center gap-1 text-admin-accent bg-admin-accent/10 px-2 py-0.5 rounded-full border border-admin-accent/25">
              <CheckCircle2 size={10} /> {doneCount} Selesai
            </span>
          )}
        </div>
      </div>

      {/* Horizontal scrollable cards */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
        {sesiList.map((sesi) => {
          const isActive = sesi.tanggal === activeTanggal;
          const date = new Date(sesi.tanggal);
          const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
          const dayNum = date.getDate();
          const monthName = date.toLocaleDateString('id-ID', { month: 'short' });

          return (
            <motion.button
              key={sesi.id}
              onClick={() => onSelectTanggal(sesi.tanggal)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex-shrink-0 w-[160px] p-3 rounded-xl border transition-[background-color,border-color,box-shadow] duration-200 text-left ${
                isActive
                  ? 'bg-admin-accent text-white border-admin-accent shadow-lg shadow-primary/20'
                  : sesi.war_aktif
                  ? 'bg-admin-warn-bg-2 border-admin-warn-border hover:border-admin-warn-bar'
                  : sesi.distribusi_done
                  ? 'bg-admin-accent/10 border-admin-accent/25 hover:border-admin-accent/40'
                  : 'bg-white border-admin-border hover:border-admin-text-6 hover:shadow-sm'
              }`}
            >
              {/* Live indicator */}
              {sesi.war_aktif && !isActive && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-admin-warn-bar rounded-full animate-pulse" />
              )}

              {/* Date */}
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={12} className={isActive ? 'text-white/70' : 'text-admin-text-5'} />
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isActive ? 'text-white/70' : 'text-admin-text-5'
                }`}>
                  {dayName}
                </span>
              </div>

              <p className={`text-lg font-extrabold leading-none ${
                isActive ? 'text-white' : 'text-admin-text'
              }`}>
                {dayNum} {monthName}
              </p>

              {/* Status & info */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users size={10} className={isActive ? 'text-white/60' : 'text-admin-text-5'} />
                  <span className={`text-[10px] font-medium ${
                    isActive ? 'text-white/70' : 'text-admin-text-4'
                  }`}>
                    {sesi.kuota_terisi ?? 0}/{sesi.kuota_pewawancara}
                  </span>
                </div>

                {sesi.war_aktif ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-admin-warn-border text-admin-warn-text'
                  }`}>
                    LIVE
                  </span>
                ) : sesi.distribusi_done ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-admin-accent/20 text-admin-accent-ink'
                  }`}>
                    DONE
                  </span>
                ) : (
                  <ChevronRight size={12} className={isActive ? 'text-white/50' : 'text-admin-text-6'} />
                )}
              </div>

              {/* Jalur masuk badge */}
              {sesi.jalur_masuk && (
                <span className={`mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-admin-accent/10 text-admin-accent'
                }`}>
                  {sesi.jalur_masuk}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
