"use client";

import { useState } from "react";
import {
  motion,
  AnimatePresence,
  type Variants,
  type Transition,
} from "framer-motion";
import {
  Calendar,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Settings2,
  Download,
  BarChart3,
} from "lucide-react";
import type { DashboardAnalitikData } from "@/types/analitik";
import { JALUR_OPTIONS } from "@/app/admin/import/page";

import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import AnalisisHeroBanner from "@/components/admin/analitik/AnalisisHeroBanner";
import FeatureImportanceChart from "@/components/admin/analitik/FeatureImportanceChart";
import KonsistensiCard from "@/components/admin/analitik/KonsistensiCard";
import DistribusiChart from "@/components/admin/analitik/DistribusiChart";
import FakultasChart from "./FakultasChart";
import GeografisChart from "@/components/admin/analitik/GeografisChart";
import RuleExtraction from "@/components/admin/analitik/RuleExtraction";
import KasusOverrideAdmin from "@/components/admin/analitik/KasusOverrideAdmin";
import InsightNaratif from "@/components/admin/analitik/InsightNaratif";

type FetchState = "idle" | "loading" | "done" | "error";

interface ApiErrorBody {
  pesan?: string;
  error?: string;
  detail?: string;
}

const spring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

const softSpring: Transition = {
  type: "spring",
  stiffness: 280,
  damping: 26,
};

const collapseVariants: Variants = {
  collapsed: { height: 0, opacity: 0 },
  open: {
    height: "auto",
    opacity: 1,
    transition: {
      height: softSpring,
      opacity: { duration: 0.18, delay: 0.05 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: softSpring, opacity: { duration: 0.12 } },
  },
};

const sectionListVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const sectionItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: spring },
};

/** Bungkus tiap section dashboard supaya muncul bertahap (stagger) tanpa mengulang boilerplate */
function Section({ children }: { children: React.ReactNode }) {
  return <motion.div variants={sectionItemVariants}>{children}</motion.div>;
}

export default function AnalitikSelector() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState<string>(String(currentYear));
  const [jalur, setJalur] = useState<string>("");
  const [state, setState] = useState<FetchState>("idle");
  const [data, setData] = useState<DashboardAnalitikData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);

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
        const body: ApiErrorBody = await res.json().catch(() => ({}));
        setError(
          body.pesan ||
            body.error ||
            body.detail ||
            `Gagal mengambil data (Status: ${res.status})`,
        );
        setState("error");
        return;
      }

      const json: DashboardAnalitikData = await res.json();
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
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        breadcrumb="Dashboard / Analitik Seleksi"
        title="Dashboard Analitik"
        right={
          <>
            {state === "done" && data && (
              <>
                <button
                  type="button"
                  onClick={() => setFormCollapsed(false)}
                  className="hidden sm:flex items-center gap-1.5 border border-admin-border bg-transparent rounded-[11px] px-[13px] h-[38px] text-[13px] font-semibold text-admin-text-2 hover:bg-admin-surface-soft transition-colors"
                >
                  {jalur} · Tahun {tahun}
                  <ChevronDown size={13} className="text-admin-text-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFormCollapsed(false)}
                  className="border border-admin-border bg-transparent rounded-[11px] px-[13px] h-[38px] text-[13px] font-semibold text-admin-text-2 hover:bg-admin-surface-soft transition-colors"
                >
                  Ganti Data
                </button>
              </>
            )}
            <button
              type="button"
              disabled={state !== "done"}
              title={state === "done" ? "Ekspor ringkasan" : "Jalankan analisis untuk mengekspor"}
              className="border border-admin-border bg-transparent rounded-[11px] w-[38px] h-[38px] shrink-0 flex items-center justify-center text-admin-text-2 hover:bg-admin-surface-soft transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download size={16} strokeWidth={1.8} />
            </button>
            <motion.button
              onClick={() => handleAnalisis(true)}
              disabled={!canRun || state === "loading"}
              whileHover={canRun && state !== "loading" ? { scale: 1.02 } : undefined}
              whileTap={canRun && state !== "loading" ? { scale: 0.97 } : undefined}
              transition={spring}
              className={`flex items-center gap-1.5 rounded-[11px] px-[15px] h-[38px] text-[13px] font-bold whitespace-nowrap transition-colors ${
                canRun && state !== "loading"
                  ? "bg-admin-accent text-white hover:bg-admin-accent-hover"
                  : "bg-admin-border text-admin-placeholder cursor-not-allowed"
              }`}
            >
              {state === "loading" ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Latih Ulang
            </motion.button>
          </>
        }
      />

      <div className="px-4 sm:px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
        {/* Form Selector — collapsible */}
        <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden">
          <motion.button
            onClick={() => setFormCollapsed((v) => !v)}
            whileTap={{ scale: 0.995 }}
            transition={spring}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-admin-surface-soft/30 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-admin-accent/8 flex items-center justify-center shrink-0">
                <Settings2 size={14} className="text-admin-accent" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-admin-text">
                  Pilih Data yang Dianalisis
                </p>
                {formCollapsed && jalur && (
                  <p className="text-xs text-admin-text-3 mt-0.5">
                    {jalur} · Tahun {tahun}
                    {state === "done" && data && (
                      <span className="ml-2 text-admin-accent font-semibold">
                        · {data.ringkasan.total_pendaftar} pendaftar
                      </span>
                    )}
                  </p>
                )}
                {formCollapsed && !jalur && (
                  <p className="text-xs text-admin-text-3 mt-0.5">
                    Klik untuk memilih tahun dan jalur masuk
                  </p>
                )}
                {!formCollapsed && (
                  <p className="text-xs text-admin-text-3 mt-0.5">
                    Klik untuk memilih tahun dan jalur masuk
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <AnimatePresence>
                {formCollapsed && state === "done" && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={spring}
                    className="text-[10px] font-semibold text-admin-accent bg-admin-accent/10 border border-admin-accent/25 px-2 py-0.5 rounded-full"
                  >
                    Analisis aktif
                  </motion.span>
                )}
              </AnimatePresence>
              <motion.div
                animate={{ rotate: formCollapsed ? 0 : 180 }}
                transition={spring}
              >
                <ChevronDown size={16} className="text-admin-text-3" />
              </motion.div>
            </div>
          </motion.button>

          <AnimatePresence initial={false}>
            {!formCollapsed && (
              <motion.div
                key="form-body"
                variants={collapseVariants}
                initial="collapsed"
                animate="open"
                exit="exit"
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2 border-t border-admin-border">
                  <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_auto] gap-6 items-start mt-4">
                    <div>
                      <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider mb-2 block">
                        Tahun Seleksi
                      </label>
                      <div className="relative">
                        <Calendar
                          size={14}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-3 pointer-events-none"
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
                          className={`w-full pl-9 pr-4 py-2.5 text-sm font-bold rounded-xl border bg-admin-bg text-admin-text
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all
                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none
                            ${!tahunValid && tahun !== "" ? "border-admin-danger-text bg-admin-danger-text/5" : "border-admin-border"}`}
                        />
                      </div>
                      <AnimatePresence>
                        {!tahunValid && tahun !== "" && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -4 }}
                            transition={softSpring}
                            className="mt-1 text-[11px] text-admin-danger-text overflow-hidden"
                          >
                            Masukkan tahun antara 2020–2099
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider mb-2 block">
                        Jalur Masuk
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {JALUR_OPTIONS.map((opt) => {
                          const selected = jalur === opt.value;
                          return (
                            <motion.button
                              key={opt.value}
                              onClick={() => {
                                setJalur(opt.value);
                                setState("idle");
                              }}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.98 }}
                              transition={spring}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left text-[13px] font-semibold whitespace-nowrap
                                ${
                                  selected
                                    ? "bg-admin-accent border-admin-accent text-white"
                                    : "bg-admin-bg border-admin-border text-admin-text hover:border-admin-accent/40 hover:bg-admin-accent/5"
                                }`}
                            >
                              <span className="relative w-3.5 h-3.5 rounded-full border-2 shrink-0 border-current opacity-80">
                                {selected && (
                                  <motion.span
                                    layoutId="jalur-dot"
                                    transition={spring}
                                    className="absolute inset-[2px] rounded-full bg-white"
                                  />
                                )}
                              </span>
                              {opt.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <motion.button
                      onClick={() => handleAnalisis()}
                      disabled={!canRun || state === "loading"}
                      whileHover={
                        canRun && state !== "loading"
                          ? { scale: 1.02 }
                          : undefined
                      }
                      whileTap={
                        canRun && state !== "loading"
                          ? { scale: 0.97 }
                          : undefined
                      }
                      transition={spring}
                      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap lg:mt-[26px]
                        ${
                          canRun && state !== "loading"
                            ? "bg-admin-accent text-white hover:bg-admin-accent/90"
                            : "bg-admin-surface-soft text-admin-text-3 cursor-not-allowed"
                        }`}
                    >
                      {state === "loading" ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.7,
                              ease: "linear",
                            }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Menganalisis...
                        </>
                      ) : (
                        <>
                          {state === "done"
                            ? "Analisis Ulang"
                            : "Jalankan Analisis"}
                        </>
                      )}
                    </motion.button>
                  </div>

                  {state === "done" && data && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-admin-border-soft pt-4">
                      <motion.button
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        onClick={() => {
                          setRefresh(true);
                          handleAnalisis(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-admin-border text-admin-text-3 hover:text-admin-text hover:border-admin-accent/30"
                      >
                        <RefreshCw size={13} />
                        Perbarui Cache
                      </motion.button>

                      <span className="text-xs text-admin-text-3">
                        Diproses dalam {(data.waktu_proses_ms / 1000).toFixed(1)}s
                        {data.sumber === "cache" && (
                          <span className="ml-1 text-admin-accent">(dari cache)</span>
                        )}
                      </span>
                    </div>
                  )}

                  {!canRun && state === "idle" && (
                    <p className="mt-3 text-xs text-admin-text-3">
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

        {/* Idle State */}
        {state === "idle" && (
          <EmptyState
            icon={<BarChart3 size={26} strokeWidth={1.5} />}
            title="Belum Ada Analisis Dijalankan"
            description="Pilih tahun seleksi dan jalur masuk di panel atas, lalu tekan Jalankan Analisis untuk memuat pola keputusan Decision Tree."
          />
        )}

        {/* Error State */}
        <AnimatePresence>
          {state === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={spring}
              className="flex flex-col items-center justify-center py-16 text-center bg-admin-surface rounded-2xl border border-admin-border"
            >
              <motion.div
                initial={{ scale: 0.6, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={spring}
                className="w-12 h-12 bg-admin-danger-text/8 rounded-2xl flex items-center justify-center mb-3"
              >
                <AlertCircle size={24} className="text-admin-danger-text" />
              </motion.div>
              <h3 className="font-admin-heading font-bold text-admin-text mb-1">
                Gagal memuat data analitik
              </h3>
              <p className="text-admin-text-3 text-sm max-w-sm">{error}</p>
              <motion.button
                onClick={() => handleAnalisis()}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
                className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-admin-accent text-white hover:bg-admin-accent/90"
              >
                Coba Lagi
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard hasil */}
        <AnimatePresence>
          {state === "done" && data && (
            <motion.div
              variants={sectionListVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-[18px]"
            >
              {/* 1. Hero — angka dasar & konsistensi model */}
              <Section>
                <AnalisisHeroBanner
                  ringkasan={data.ringkasan}
                  konsistensi={data.konsistensi}
                  jalur={jalur}
                  tahun={tahun}
                />
              </Section>

              {/* 2. Insight naratif — kesimpulan siap baca */}
              <Section>
                <InsightNaratif data={data} />
              </Section>

              {/* 3. Faktor dominan & konsistensi keputusan berdampingan */}
              <Section>
                <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3.5 items-stretch">
                  <FeatureImportanceChart data={data.feature_importance} />
                  <KonsistensiCard data={data.konsistensi} modelInfo={data.model_info} />
                </div>
              </Section>

              {/* 4. Pola keputusan yang ditemukan */}
              <Section>
                <RuleExtraction rules={data.rule_nodes} />
              </Section>

              {/* 5. Kasus paling actionable — layak ditinjau ulang */}
              <Section>
                <KasusOverrideAdmin data={data.kasus_override ?? []} />
              </Section>

              {/* 6. Sebaran geografis — lihat wilayah bermasalah */}
              <Section>
                <GeografisChart data={data.distribusi_geografis} />
              </Section>

              {/* 7. Sebaran Fakultas */}
              <Section>
                <FakultasChart
                  data={data.distribusi_fakultas}
                  totalDiusulkan={data.ringkasan.total_diusulkan}
                />
              </Section>

              {/* 8. Distribusi demografis & konteks pendukung */}
              <Section>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <DistribusiChart
                    data={data.distribusi_jenis_kelamin}
                    title="Distribusi per Jenis Kelamin"
                    subtitle="Diusulkan vs tidak per kategori gender"
                  />
                  <DistribusiChart
                    data={data.distribusi_desil_dtsen}
                    title="Distribusi DESIL DTSEN"
                    subtitle="Diusulkan vs tidak per kategori desil"
                  />
                  <DistribusiChart
                    data={data.distribusi_kondisi_rumah}
                    title="Distribusi per Kondisi Rumah"
                    subtitle="Diusulkan vs tidak per kondisi tempat tinggal"
                  />
                  <DistribusiChart
                    data={data.distribusi_aktif_dtsen}
                    title="Distribusi Aktif DTSEN"
                    subtitle="Terdaftar vs belum terdata dalam DTSEN"
                  />
                </div>
              </Section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
