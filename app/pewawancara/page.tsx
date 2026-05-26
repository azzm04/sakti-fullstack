"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { WarStatus, SesiListItem } from "@/schemas";
import {
  SesiSelector,
  WarKlaimCard,
  WarWaitingCard,
  WarActiveCard,
  KuotaProgressBar,
} from "@/components/pewawancara/dashboard";

export default function PewawancaraDashboard() {
  const [status, setStatus] = useState<WarStatus | null>(null);
  const [sesiList, setSesiList] = useState<SesiListItem[]>([]);
  const [selectedSesiId, setSelectedSesiId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKuota, setSelectedKuota] = useState<number | null>(null);
  const [claiming, setClaiming] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data Fetching ──
  const fetchStatus = useCallback(async () => {
    try {
      const url = selectedSesiId ? `/api/war?sesi_id=${selectedSesiId}` : "/api/war";
      const res = await fetch(url);
      const json = await res.json();
      setStatus(json);

      if (json.sesi_list && !selectedSesiId) {
        setSesiList(json.sesi_list);
        if (!selectedSesiId) {
          const claimed = json.sesi_list.find((s: SesiListItem) => s.kuota_saya);
          const aktif = json.sesi_list.find((s: SesiListItem) => s.war_aktif);
          const target = claimed || aktif || json.sesi_list[0];
          if (target) setSelectedSesiId(target.id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSesiId]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // Auto-poll saat WAR aktif atau menunggu dibuka
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const shouldPoll =
      (status?.war_aktif && !status.kuota_saya) ||
      (!status?.war_aktif && !!status?.sesi && !status?.sesi?.distribusi_done);

    if (shouldPoll) {
      intervalRef.current = setInterval(fetchStatus, 5000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status?.war_aktif, status?.kuota_saya, status?.sesi, fetchStatus]);

  // ── Actions ──
  async function handleKlaim() {
    if (!selectedKuota) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/war", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kuota_ke: selectedKuota, sesi_id: selectedSesiId }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success("Kuota Berhasil Diklaim!", {
          description: json.message || `Kamu mendapatkan kuota #${selectedKuota}.`,
        });
        setSelectedKuota(null);
        fetchStatus();
      } else {
        toast.error("Klaim Gagal", {
          description: json.error ?? "Gagal klaim kuota, mungkin sudah didului orang lain.",
        });
      }
    } finally {
      setClaiming(false);
    }
  }

  async function handleUnwar() {
    const url = selectedSesiId ? `/api/war?sesi_id=${selectedSesiId}` : "/api/war";
    const res = await fetch(url, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      toast.success("Kuota Dibatalkan", {
        description: json.message || "Kuota kamu telah dikembalikan dan tersedia untuk pewawancara lain.",
      });
      fetchStatus();
    } else {
      toast.error("Gagal Membatalkan", {
        description: json.error ?? "Terjadi kesalahan saat membatalkan kuota.",
      });
    }
  }

  // ── Derived State ──
  const sesi = status?.sesi;
  const kuotaSaya = status?.kuota_saya;
  const warAktif = status?.war_aktif ?? false;
  const kuotaTerisi = status?.kuota_terisi ?? 0;
  const kuota = sesi?.kuota_pewawancara ?? 20;
  const takenKuota = new Set((status?.kuota_list ?? []).map((s) => s.kuota_ke));

  function getMahasiswaForKuota(kuotaKe: number): number[] {
    if (!sesi) return [];
    let offset = 0;
    for (const s of sesiList) {
      if (s.id === sesi.id) break;
      offset += s.kuota_mahasiswa;
    }
    const result: number[] = [];
    for (let n = kuotaKe; n <= sesi.kuota_mahasiswa; n += kuota) {
      result.push(offset + n);
    }
    return result;
  }

  const today = sesi
    ? new Date(sesi.tanggal + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const tanggalHariIni = new Date().toISOString().split("T")[0];
  const isUpcoming = sesi && sesi.tanggal > tanggalHariIni;

  // ── Loading State ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen gap-2 text-muted-foreground">
        <Loader2 size={18} className="animate-spin" /> Memuat...
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Portal Pewawancara
        </p>
        <h1 className="text-2xl font-extrabold text-primary font-headline">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {today}
          {isUpcoming && (
            <span className="ml-2 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Sesi Mendatang
            </span>
          )}
        </p>
      </div>

      {/* Sesi Selector */}
      <SesiSelector
        sesiList={sesiList}
        selectedSesiId={selectedSesiId}
        onSelect={(id) => { setSelectedSesiId(id); setSelectedKuota(null); }}
      />

      {/* Empty State */}
      {!sesi && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-10 text-center">
          <Clock size={36} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">Belum ada sesi wawancara yang tersedia</p>
          <p className="text-sm text-muted-foreground">Admin belum membuat sesi wawancara. Cek kembali nanti.</p>
        </div>
      )}

      {/* Main Content */}
      {sesi && (
        <div className="space-y-4">
          {/* Sudah klaim kuota */}
          {kuotaSaya && (
            <WarKlaimCard
              kuotaKe={kuotaSaya.kuota_ke}
              mahasiswaList={getMahasiswaForKuota(kuotaSaya.kuota_ke)}
              distribusiDone={sesi.distribusi_done}
              onUnwar={handleUnwar}
            />
          )}

          {/* Menunggu WAR dibuka */}
          {!kuotaSaya && !warAktif && !sesi.distribusi_done && (
            <WarWaitingCard
              tanggal={sesi.tanggal}
              kuotaPewawancara={sesi.kuota_pewawancara}
              kuotaMahasiswa={sesi.kuota_mahasiswa}
            />
          )}

          {/* WAR aktif — pilih & klaim kuota */}
          {!kuotaSaya && warAktif && (
            <WarActiveCard
              kuota={kuota}
              kuotaTerisi={kuotaTerisi}
              takenKuota={takenKuota}
              selectedKuota={selectedKuota}
              onSelectKuota={setSelectedKuota}
              onKlaim={handleKlaim}
              claiming={claiming}
              getMahasiswaForKuota={getMahasiswaForKuota}
            />
          )}

          {/* Progress Bar */}
          <KuotaProgressBar
            kuota={kuota}
            kuotaTerisi={kuotaTerisi}
            kuotaList={status?.kuota_list ?? []}
            myKuotaKe={kuotaSaya?.kuota_ke}
          />
        </div>
      )}
    </div>
  );
}
