'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, ZapOff, CheckCircle2, CalendarDays, Users, Clock, ChevronRight,
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
      <div className="flex items-center gap-2 text-xs text-slate-400 py-3">
        <Clock size={12} className="animate-spin" /> Memuat sesi...
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
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Ringkasan Sesi
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          {activeCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Zap size={10} /> {activeCount} Aktif
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              <ZapOff size={10} /> {pendingCount} Menunggu
            </span>
          )}
          {doneCount > 0 && (
            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
              className={`relative flex-shrink-0 w-[160px] p-3 rounded-xl border transition-all text-left ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                  : sesi.war_aktif
                  ? 'bg-amber-50 border-amber-200 hover:border-amber-300'
                  : sesi.distribusi_done
                  ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Live indicator */}
              {sesi.war_aktif && !isActive && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              )}

              {/* Date */}
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={12} className={isActive ? 'text-white/70' : 'text-slate-400'} />
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isActive ? 'text-white/70' : 'text-slate-400'
                }`}>
                  {dayName}
                </span>
              </div>

              <p className={`text-lg font-extrabold leading-none ${
                isActive ? 'text-white' : 'text-slate-800'
              }`}>
                {dayNum} {monthName}
              </p>

              {/* Status & info */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users size={10} className={isActive ? 'text-white/60' : 'text-slate-400'} />
                  <span className={`text-[10px] font-medium ${
                    isActive ? 'text-white/70' : 'text-slate-500'
                  }`}>
                    {sesi.kuota_terisi ?? 0}/{sesi.kuota_pewawancara}
                  </span>
                </div>

                {sesi.war_aktif ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                  }`}>
                    LIVE
                  </span>
                ) : sesi.distribusi_done ? (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    DONE
                  </span>
                ) : (
                  <ChevronRight size={12} className={isActive ? 'text-white/50' : 'text-slate-300'} />
                )}
              </div>

              {/* Jalur masuk badge */}
              {sesi.jalur_masuk && (
                <span className={`mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
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
