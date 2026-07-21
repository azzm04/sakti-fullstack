"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Settings2,
  Wrench,
} from "lucide-react";
import type { DashboardAnalitikData } from "@/types/analitik";
import { JALUR_OPTIONS } from "@/app/admin/import/page";

import KartuRingkasan from "@/components/admin/analitik/KartuRingkasan";
import FeatureImportanceChart from "@/components/admin/analitik/FeatureImportanceChart";
import KonsistensiCard from "@/components/admin/analitik/KonsistensiCard";
import DistribusiChart from "@/components/admin/analitik/DistribusiChart";
import FakultasChart from "./FakultasChart";
import GeografisChart from "@/components/admin/analitik/GeografisChart";
import RuleExtraction from "@/components/admin/analitik/RuleExtraction";
import KasusAmbigu from "@/components/admin/analitik/KasusAmbigu";
import ModelInfoCard from "@/components/admin/analitik/ModelInfoCard";
import InsightNaratif from "@/components/admin/analitik/InsightNaratif";

type FetchState = "idle" | "loading" | "done" | "error";

export default function AnalitikSelector() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState<string>(String(currentYear));
  const [jalur, setJalur] = useState<string>("");
  const [state, setState] = useState<FetchState>("idle");
  const [data, setData] = useState<DashboardAnalitikData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  // Detail teknis (feature importance, konsistensi, rule extraction, model info) — collapsed by default
  const [technicalOpen, setTechnicalOpen] = useState(false);

  const tahunValid =
    /^\d{4}$/.test(tahun) && parseInt(tahun) >= 2020 && parseInt(tahun) <= 2099;

  const canRun = tahunValid && !!jalur;

  async function handleAnalisis(forceRefresh = refresh) {
    if (!canRun) return;
    setState("loading");
    setData(null);
    setError(null);

    try {
      const params = new URLSearchParams({
        tahun,
        jalur_masuk: jalur,
        ...(forceRefresh ? { refresh: "true" } : {}),
      });
      const res = await fetch(`/api/admin/analitik?${params}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          pesan?: string;
          error?: string;
          detail?: string;
        };
        setError(
          body.pesan ||
            body.error ||
            body.detail ||
            `Gagal mengambil data (Status: ${res.status})`,
        );
        setState("error");
        return;
      }

      const json = await res.json();
      setData(json);
      setState("done");
      setRefresh(false);
      setFormCollapsed(true);
    } catch {
      setError(
        "Server analitik tidak dapat dijangkau. Pastikan FastAPI berjalan.",
      );
      setState("error");
    }
  }

  return (
    <div className="space-y-8">
      {/* Form Selector — collapsible */}
      <div className="bg-tertiary rounded-3xl border border-border shadow-sm overflow-hidden">
        <button
          onClick={() => setFormCollapsed((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Settings2 size={14} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">
                Pilih Data yang Dianalisis
              </p>
              {formCollapsed && jalur && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {jalur} · Tahun {tahun}
                  {state === "done" && data && (
                    <span className="ml-2 text-primary font-semibold">
                      · {data.ringkasan.total_pendaftar} pendaftar
                    </span>
                  )}
                </p>
              )}
              {formCollapsed && !jalur && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klik untuk mengubah pilihan
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {formCollapsed && state === "done" && (
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Analisis aktif
              </span>
            )}
            {formCollapsed ? (
              <ChevronDown size={16} className="text-muted-foreground" />
            ) : (
              <ChevronUp size={16} className="text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {!formCollapsed && (
            <motion.div
              key="form-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-2 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      Tahun Seleksi
                    </label>
                    <div className="relative">
                      <Calendar
                        size={14}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                      />
                      <input
                        type="number"
                        min={2020}
                        max={2099}
                        value={tahun}
                        title="Masukkan tahun seleksi antara 2020–2099"
                        onChange={(e) => {
                          setTahun(e.target.value);
                          setState("idle");
                        }}
                        className={`w-full pl-9 pr-4 py-2.5 text-sm font-bold rounded-xl border bg-background text-foreground
                          focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all
                          [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                          ${!tahunValid && tahun !== "" ? "border-destructive bg-destructive/5" : "border-border"}`}
                      />
                    </div>
                    {!tahunValid && tahun !== "" && (
                      <p className="mt-1 text-[11px] text-destructive">
                        Masukkan tahun antara 2020–2099
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                      Jalur Masuk
                    </label>
                    <div className="grid grid-cols-1 gap-1.5">
                      {JALUR_OPTIONS.map((opt) => {
                        const selected = jalur === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              setJalur(opt.value);
                              setState("idle");
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left text-sm font-semibold transition-all
                              ${
                                selected
                                  ? "bg-primary border-primary text-primary-foreground"
                                  : "bg-background border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                              }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all
                              ${selected ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground"}`}
                            />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <button
                    onClick={() => handleAnalisis()}
                    disabled={!canRun || state === "loading"}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                      ${
                        canRun && state !== "loading"
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-muted text-muted-foreground cursor-not-allowed"
                      }`}
                  >
                    {state === "loading" ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Menganalisis...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        {state === "done"
                          ? "Analisis Ulang"
                          : "Jalankan Analisis"}
                      </>
                    )}
                  </button>

                  {state === "done" && (
                    <button
                      onClick={() => {
                        setRefresh(true);
                        handleAnalisis(true);
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      <RefreshCw size={13} />
                      Perbarui Cache
                    </button>
                  )}

                  {state === "done" && data && (
                    <span className="text-xs text-muted-foreground">
                      Diproses dalam {(data.waktu_proses_ms / 1000).toFixed(1)}s
                      {data.sumber === "cache" && (
                        <span className="ml-1 text-primary">(dari cache)</span>
                      )}
                    </span>
                  )}
                </div>

                {!canRun && state === "idle" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    {!tahunValid
                      ? "Isi tahun seleksi yang valid"
                      : "Pilih jalur masuk terlebih dahulu"}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {state === "error" && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-tertiary rounded-3xl border border-border">
          <div className="w-12 h-12 bg-destructive/8 rounded-2xl flex items-center justify-center mb-3">
            <AlertCircle size={24} className="text-destructive" />
          </div>
          <h3 className="font-bold text-foreground mb-1">
            Gagal memuat data analitik
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
          <button
            onClick={() => handleAnalisis()}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Dashboard hasil */}
      {state === "done" && data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-2 text-xs text-primary font-semibold">
            <ChevronRight size={14} />
            Menampilkan analitik: <span className="font-bold">
              {jalur}
            </span>{" "}
            tahun <span className="font-bold">{tahun}</span>
          </div>

          {/* 1. Ringkasan angka dasar — konteks fundamental */}
          <KartuRingkasan
            ringkasan={data.ringkasan}
            konsistensi={data.konsistensi}
          />

          {/* 2. Insight naratif — kesimpulan siap baca */}
          <InsightNaratif data={data} />

          {/* 3. Kasus paling actionable — layak ditinjau ulang */}
          <KasusAmbigu data={data.kasus_ambigu} />

          {/* 4. Sebaran geografis — lihat wilayah bermasalah */}
          <GeografisChart data={data.distribusi_geografis} />
          
          {/* 5. Sebaran Fakultas (Chart Jejer 2) */}
          <FakultasChart
            data={data.distribusi_fakultas}
            totalDiusulkan={data.ringkasan.total_diusulkan}
          />

          {/* 6. Distribusi jenis kelamin — konteks demografis */}
          <DistribusiChart
            data={data.distribusi_jenis_kelamin}
            title="Distribusi per Jenis Kelamin"
            subtitle="Diusulkan vs tidak per kategori gender"
          />

          {/* 7. Distribusi sebagai konteks pendukung */}
          <DistribusiChart
            data={data.distribusi_p3ke}
            title="Distribusi per Status P3KE"
            subtitle="Diusulkan vs tidak per kategori P3KE"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DistribusiChart
              data={data.distribusi_kondisi_rumah}
              title="Distribusi per Kondisi Rumah"
              subtitle="Diusulkan vs tidak per kondisi tempat tinggal"
            />
            <DistribusiChart
              data={data.distribusi_dtks}
              title="Distribusi Data DTKS"
              subtitle="Terdaftar vs belum terdata dalam DTKS"
            />
          </div>

          {/* 8. Detail teknis model — collapsible, audiens teknis */}
          <div className="bg-tertiary rounded-3xl border border-border shadow-sm overflow-hidden">
            <button
              onClick={() => setTechnicalOpen((v) => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                  <Wrench size={14} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground">
                    Detail Teknis Model
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Faktor dominan, konsistensi, aturan keputusan, dan info
                    model Decision Tree
                  </p>
                </div>
              </div>
              {technicalOpen ? (
                <ChevronUp
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
              ) : (
                <ChevronDown
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
              )}
            </button>

            <AnimatePresence initial={false}>
              {technicalOpen && (
                <motion.div
                  key="technical-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 pt-2 border-t border-border space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <FeatureImportanceChart data={data.feature_importance} />
                      <KonsistensiCard
                        data={data.konsistensi}
                        modelInfo={data.model_info}
                      />
                    </div>
                    <RuleExtraction rules={data.rule_nodes} />
                    <ModelInfoCard data={data.model_info} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
