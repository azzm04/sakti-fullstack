"use client";

import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import type { RuleNode } from "@/types/analitik";
import { useState } from "react";

interface Props {
  rules: RuleNode[];
}

interface ParsedCondition {
  text: string;
}

// Ubah satu kondisi mentah ("Fitur ≤ 123") jadi kalimat manusiawi
function parseCondition(raw: string): string {
  let text = raw.trim();

  // Angka rupiah / numerik
  text = text.replace(
    /(\w[\w\s()]+?)\s*([≤>]+)\s*(\d+(?:\.\d+)?)/g,
    (_, feat, op, val) => {
      const numVal = parseFloat(val);
      const featClean = feat.trim();
      const isRupiah =
        featClean.toLowerCase().includes("penghasilan") ||
        featClean.toLowerCase().includes("kapita");

      const formatted = isRupiah
        ? `Rp ${numVal.toLocaleString("id-ID")}`
        : numVal % 1 === 0
          ? numVal.toLocaleString("id-ID")
          : numVal.toFixed(1);

      const opText = op === "≤" ? "maksimal" : "lebih dari";
      return `${featClean} ${opText} ${formatted}`;
    },
  );

  // Kasus khusus: Desil DTSEN
  text = text.replace(
    /Desil DTSEN\s*(maksimal|lebih dari)\s*([\d.]+)/g,
    (_, opText) => {
      return opText === "maksimal"
        ? `Desil DTSEN = "Belum Terdata"`
        : `Desil DTSEN ≠ "Belum Terdata" (Desil 3+)`;
    },
  );

  // Kasus khusus: Jenis Kelamin
  text = text.replace(
    /Jenis Kelamin\s*(maksimal|lebih dari)\s*[\d.]+/g,
    (_, opText) => {
      return opText === "maksimal"
        ? `Jenis Kelamin = "Perempuan"`
        : `Jenis Kelamin = "Laki-laki"`;
    },
  );

  return text;
}

function parseKondisi(kondisi: string): ParsedCondition[] {
  return kondisi
    .split("&")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ text: parseCondition(c) }));
}

function confidenceLabel(pct: number): {
  label: string;
  color: string;
  bar: string;
} {
  if (pct >= 90)
    return {
      label: "Sangat Yakin",
      color: "text-admin-accent-ink",
      bar: "bg-admin-accent",
    };
  if (pct >= 75)
    return { label: "Yakin", color: "text-admin-warn-text", bar: "bg-admin-warn-bar" };
  return { label: "Kurang Yakin", color: "text-admin-danger-text", bar: "bg-admin-danger-bar" };
}

const PREVIEW_COUNT = 4;

export default function RuleExtraction({ rules }: Props) {
  const [showAll, setShowAll] = useState(false);

  const safeRules = Array.isArray(rules) ? rules : [];
  const diusulkan = safeRules.filter((r) => r.keputusan === "Diusulkan");
  const tidak = safeRules.filter((r) => r.keputusan !== "Diusulkan");
  const ordered = [...diusulkan, ...tidak];

  const visible = showAll ? ordered : ordered.slice(0, PREVIEW_COUNT);
  const hiddenCount = ordered.length - PREVIEW_COUNT;

  if (ordered.length === 0) return null;

  return (
    <div>
      <h3 className="font-admin-heading text-[19px] font-semibold text-admin-text">
        Pola Keputusan yang Ditemukan
      </h3>
      <p className="text-[12.5px] text-admin-text-3 mt-1 mb-4">
        {ordered.length} pola hasil analisis — makin banyak sampel & keyakinan, makin kuat pola ini
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visible.map((rule, i) => (
          <RuleCard
            key={i}
            index={i + 1}
            rule={rule}
            variant={rule.keputusan === "Diusulkan" ? "diusulkan" : "tidak"}
          />
        ))}
      </div>

      {ordered.length > PREVIEW_COUNT && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-3 bg-admin-surface border border-admin-border rounded-xl px-4 py-2.5 hover:bg-admin-surface-soft hover:text-admin-text transition-colors"
          >
            {showAll ? (
              <>Sembunyikan <ChevronUp size={14} /></>
            ) : (
              <>Lihat {hiddenCount} pola lainnya <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  variant,
  index,
}: {
  rule: RuleNode;
  variant: "diusulkan" | "tidak";
  index: number;
}) {
  const isDiusulkan = variant === "diusulkan";
  const pct = Math.round(rule.confidence * 100);
  const { label, color, bar } = confidenceLabel(pct);

  const Icon = isDiusulkan ? CheckCircle2 : XCircle;
  const iconColor = isDiusulkan ? "text-admin-accent" : "text-admin-danger-bar";

  const conditions = parseKondisi(rule.kondisi);

  return (
    <div className="bg-admin-surface border border-admin-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider ${iconColor}`}>
          <Icon size={14} />
          {isDiusulkan ? "Cenderung Diusulkan" : "Cenderung Tidak Diusulkan"}
        </p>
        <span className="text-[11px] font-semibold text-admin-text-5 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-4 mb-2.5">
        Jika semua kondisi terpenuhi
      </p>
      <ul className="space-y-1.5 mb-4">
        {conditions.map((c, i) => (
          <li
            key={i}
            className="text-[12.5px] text-admin-text-2 leading-relaxed pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-admin-text-5"
          >
            {c.text}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pt-3 border-t border-admin-border-soft">
        <span className="text-[11px] text-admin-text-4 font-medium">
          Berdasarkan {rule.jumlah_sampel} data mahasiswa serupa
        </span>
        <div className="flex items-center gap-2">
          <div className="w-14 h-1.5 bg-admin-grid rounded-full overflow-hidden">
            <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
          <span className={`text-[11px] font-bold whitespace-nowrap ${color}`}>
            {label} ({pct}%)
          </span>
        </div>
      </div>
    </div>
  );
}
