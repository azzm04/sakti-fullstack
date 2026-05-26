"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import type { MahasiswaEvaluasi } from "@/schemas";
import { getStatusWawancara, getStatusWawancaraColor } from "@/schemas";
import { SaveButton, type SaveStatus } from "./SaveButton";

interface DetailHeaderProps {
  kandidat: MahasiswaEvaluasi;
  saveStatus: SaveStatus;
  onSave: () => void;
}

export function DetailHeader({ kandidat, saveStatus, onSave }: DetailHeaderProps) {
  const statusW = getStatusWawancara(kandidat.is_draft, kandidat.pewawancara_id);
  const colorW = getStatusWawancaraColor(statusW);

  return (
    <div className="mb-8">
      <Link
        href="/pewawancara/mahasiswa"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-tertiary p-6 md:p-8 rounded-3xl border border-border shadow-sm">
        <div>
          <span className="inline-block px-3 py-1 bg-muted text-secondary text-xs font-bold rounded-lg mb-3">
            #{kandidat.no}
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            {kandidat.nama}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm font-medium text-muted-foreground">
            <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md">
              {kandidat.no_pendaftaran_kipk}
            </span>
            <span>•</span>
            <span>{kandidat.prodi}</span>
            <span>•</span>
            <span>{kandidat.jalur_masuk || "—"}</span>
            <span>•</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorW.bg} ${colorW.text} ${colorW.border}`}>
              {statusW === "Sudah Diwawancarai" ? <CheckCircle2 size={11} /> : null}
              {statusW}
            </span>
          </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <SaveButton status={saveStatus} onSave={onSave} className="w-full md:w-auto justify-center" />
        </div>
      </div>
    </div>
  );
}
