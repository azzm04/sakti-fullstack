"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { FileSpreadsheet, FileUp, Mail, ChevronRight } from "lucide-react";
import SectionExportExcel from "./SectionExportExcel";
import SectionImportSK    from "./SectionImportSK";
import SectionKirimEmail  from "./SectionKirimEmail";

const TABS = [
  {
    key: "export",
    label: "Export Excel",
    icon: FileSpreadsheet,
    desc: "Export daftar penerima per jalur masuk",
  },
  {
    key: "import_sk",
    label: "Import SK PDF",
    icon: FileUp,
    desc: "Upload & kelola dokumen SK yang sudah jadi",
  },
  {
    key: "email",
    label: "Kirim Email SK",
    icon: Mail,
    desc: "Kirim SK langsung ke semua email kandidat lolos",
  },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function HasilAkhirClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("export");

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-5 md:p-8 lg:p-10">
      <div className="max-w-screen-xl mx-auto space-y-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease }}
        >
          <nav className="flex items-center gap-1.5 text-[11px] font-semibold text-admin-text-3 uppercase tracking-wider mb-3">
            <span>Dashboard</span>
            <ChevronRight size={12} />
            <span className="text-admin-accent">Hasil Akhir</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold font-admin-heading text-admin-accent leading-tight">
            Hasil Akhir Seleksi
          </h1>
          <p className="text-sm text-admin-text-3 mt-1">
            Export data penerima, import dokumen SK, dan kirim SK langsung ke email kandidat.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.07, ease }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {TABS.map(({ key, label, icon: Icon, desc }) => {
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
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? "bg-admin-accent text-white" : "bg-admin-surface-soft text-admin-text-3"
                }`}>
                  <Icon size={17} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${active ? "text-admin-accent" : "text-admin-text"}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-admin-text-3 mt-0.5 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          {activeTab === "export"    && <SectionExportExcel />}
          {activeTab === "import_sk" && <SectionImportSK    />}
          {activeTab === "email"     && <SectionKirimEmail  />}
        </motion.div>

      </div>
    </div>
  );
}
