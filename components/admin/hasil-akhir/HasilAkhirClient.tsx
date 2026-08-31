"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { FileSpreadsheet, FileUp, ShieldCheck, Mail } from "lucide-react";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import SectionExportExcel from "./SectionExportExcel";
import SectionImportSK from "./SectionImportSK";
import SectionPenetapanSK, { type PenetapanSKCounts } from "./SectionPenetapanSK";
import SectionKirimEmail from "./SectionKirimEmail";
import PenerimaPerJalurCard from "./PenerimaPerJalurCard";
import SKTersimpanCard from "./SKTersimpanCard";
import PenetapanSKStatusCard from "./PenetapanSKStatusCard";
import AntrianPengirimanCard from "./AntrianPengirimanCard";
import { SK_ENDPOINT } from "./SKTersimpanCard";
import { SUMMARY_ENDPOINT, summaryFetcher, type HasilAkhirSummary } from "./HasilAkhirSummary";
import { mutate as globalMutate } from "swr";
import type { SKDokumen } from "./SectionImportSK";

const TABS = [
  {
    key: "export",
    label: "Export Excel",
    step: "Langkah 1",
    icon: FileSpreadsheet,
    desc: "Rekap penerima per jalur masuk",
  },
  {
    key: "import_sk",
    label: "Import SK PDF",
    step: "Langkah 2",
    icon: FileUp,
    desc: "Unggah & kelola dokumen SK final",
  },
  {
    key: "penetapan_sk",
    label: "Penetapan SK",
    step: "Langkah 3",
    icon: ShieldCheck,
    desc: "Cocokkan & tetapkan status resmi pasca SK",
  },
  {
    key: "email",
    label: "Kirim Email SK",
    step: "Langkah 4",
    icon: Mail,
    desc: "Kirim pengumuman ke email kandidat",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type QueueStats = { total: number; queued: number; sent: number; failed: number };

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function HasilAkhirClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("export");
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const [summary, setSummary] = useState<HasilAkhirSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [processingQueue, setProcessingQueue] = useState(false);
  const [deletingSkId, setDeletingSkId] = useState<string | null>(null);
  const [skCounts, setSkCounts] = useState<PenetapanSKCounts | null>(null);

  const fetchSummary = useCallback(async (year: number) => {
    setLoadingSummary(true);
    try {
      const data = await summaryFetcher(`${SUMMARY_ENDPOINT}?tahun=${year}`);
      setSummary(data);
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchQueueStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hasil-akhir/email-queue/stats");
      const json = await res.json();
      if (res.ok) setQueueStats(json);
    } catch {
      /* silent — kartu tetap tampil dengan angka terakhir yang diketahui */
    }
  }, []);

  useEffect(() => {
    fetchSummary(tahun);
  }, [tahun, fetchSummary]);

  useEffect(() => {
    fetchQueueStats();
  }, [fetchQueueStats]);

  async function handleProcessQueue() {
    setProcessingQueue(true);
    try {
      await fetch("/api/admin/hasil-akhir/email-queue/process", { method: "POST" });
      setTimeout(fetchQueueStats, 2000);
    } finally {
      setProcessingQueue(false);
    }
  }

  async function handleDeleteSK(sk: SKDokumen) {
    if (!confirm(`Hapus dokumen SK "${sk.nama_file}"? Tindakan tidak bisa dibatalkan.`)) return;
    setDeletingSkId(sk.id);
    try {
      const res = await fetch(`${SK_ENDPOINT}?id=${sk.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal menghapus SK");
    } finally {
      setDeletingSkId(null);
      globalMutate(SK_ENDPOINT);
    }
  }

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader breadcrumb="Admin / Seleksi KIP-K / Hasil Akhir" title="Hasil Akhir Seleksi" />

      <div className="px-4 sm:px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
        {/* Step navigation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
        >
          {TABS.map(({ key, label, step, icon: Icon, desc }) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(key)}
                className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${
                  active
                    ? "bg-white border-admin-accent shadow-sm"
                    : "bg-white border-admin-border hover:border-admin-text-6"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? "bg-admin-accent text-white" : "bg-admin-surface-soft text-admin-text-3"
                  }`}
                >
                  <Icon size={17} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-bold ${active ? "text-admin-accent" : "text-admin-text"}`}>
                      {label}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-admin-surface-soft text-admin-text-4">
                      {step}
                    </span>
                  </div>
                  <p className="text-[11px] text-admin-text-3 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Step content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
          className="grid grid-cols-1 xl:grid-cols-[1.85fr_1fr] gap-[14px] items-start"
        >
          {activeTab === "export" && (
            <>
              <SectionExportExcel tahun={tahun} onTahunChange={setTahun} summary={summary} />
              <PenerimaPerJalurCard summary={summary} loading={loadingSummary} />
            </>
          )}

          {activeTab === "import_sk" && (
            <>
              <SectionImportSK />
              <SKTersimpanCard onDelete={handleDeleteSK} deletingId={deletingSkId} />
            </>
          )}

          {activeTab === "penetapan_sk" && (
            <>
              <SectionPenetapanSK onCountsChange={setSkCounts} />
              <PenetapanSKStatusCard counts={skCounts} />
            </>
          )}

          {activeTab === "email" && (
            <>
              <SectionKirimEmail onEnqueued={fetchQueueStats} />
              <AntrianPengirimanCard
                queueStats={queueStats}
                summary={summary}
                onProcessQueue={handleProcessQueue}
                processing={processingQueue}
              />
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
