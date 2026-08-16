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

const PREVIEW_COUNT = 3;

export default function RuleExtraction({ rules }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showAllDiusulkan, setShowAllDiusulkan] = useState(false);
  const [showAllTidak, setShowAllTidak] = useState(false);

  const safeRules = Array.isArray(rules) ? rules : [];
  const diusulkan = safeRules.filter((r) => r.keputusan === "Diusulkan");
  const tidak = safeRules.filter((r) => r.keputusan !== "Diusulkan");

  const diusulkanVisible = showAllDiusulkan
    ? diusulkan
    : diusulkan.slice(0, PREVIEW_COUNT);
  const tidakVisible = showAllTidak ? tidak : tidak.slice(0, PREVIEW_COUNT);

  return (
    <div className="bg-white rounded-xl border border-admin-border shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 border-b border-admin-border-soft hover:bg-admin-surface-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent/30"
      >
        <div className="text-left">
          <h3 className="font-admin-heading text-sm font-semibold text-admin-text">
            Pola Keputusan yang Ditemukan
          </h3>
          <p className="text-xs text-admin-text-4 mt-1">
            {safeRules.length} pola hasil analisis — makin banyak sampel &
            keyakinan, makin kuat pola ini
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-admin-text-5" />
        ) : (
          <ChevronDown size={16} className="text-admin-text-5" />
        )}
      </button>

      {expanded && (
        <div className="p-6 space-y-8">
          {diusulkan.length > 0 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-admin-accent uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={14} /> Cenderung Diusulkan (
                {diusulkan.length} pola)
              </p>
              <div className="space-y-3">
                {diusulkanVisible.map((rule, i) => (
                  <RuleCard key={i} rule={rule} variant="diusulkan" />
                ))}
              </div>
              {diusulkan.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllDiusulkan((v) => !v)}
                  className="text-xs font-semibold text-admin-text-3 bg-admin-surface-soft border border-admin-border rounded-lg px-4 py-2 hover:bg-admin-border-soft transition-colors"
                >
                  {showAllDiusulkan
                    ? "Sembunyikan"
                    : `Lihat ${diusulkan.length - PREVIEW_COUNT} pola lainnya`}
                </button>
              )}
            </div>
          )}

          {tidak.length > 0 && (
            <div className="space-y-4">
              <p className="text-[11px] font-bold text-admin-danger-text uppercase tracking-wider flex items-center gap-2">
                <XCircle size={14} /> Cenderung Tidak Diusulkan ({tidak.length}{" "}
                pola)
              </p>
              <div className="space-y-3">
                {tidakVisible.map((rule, i) => (
                  <RuleCard key={i} rule={rule} variant="tidak" />
                ))}
              </div>
              {tidak.length > PREVIEW_COUNT && (
                <button
                  onClick={() => setShowAllTidak((v) => !v)}
                  className="text-xs font-semibold text-admin-text-3 bg-admin-surface-soft border border-admin-border rounded-lg px-4 py-2 hover:bg-admin-border-soft transition-colors"
                >
                  {showAllTidak
                    ? "Sembunyikan"
                    : `Lihat ${tidak.length - PREVIEW_COUNT} pola lainnya`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RuleCard({
  rule,
  variant,
}: {
  rule: RuleNode;
  variant: "diusulkan" | "tidak";
}) {
  const isDiusulkan = variant === "diusulkan";
  const pct = Math.round(rule.confidence * 100);
  const { label, color, bar } = confidenceLabel(pct);

  const Icon = isDiusulkan ? CheckCircle2 : XCircle;
  const iconColor = isDiusulkan ? "text-admin-accent" : "text-admin-danger-bar";

  const conditions = parseKondisi(rule.kondisi);

  return (
    <div className="border border-admin-border rounded-xl p-5">
      <div className="flex items-start gap-2.5 mb-3">
        <Icon size={16} className={`${iconColor} mt-0.5 shrink-0`} />
        <p className="text-sm font-semibold text-admin-text">
          Jika semua kondisi berikut terpenuhi:
        </p>
      </div>

      <ul className="space-y-2 pl-7 mb-4">
        {conditions.map((c, i) => (
          <li
            key={i}
            className="text-sm text-admin-text-3 leading-relaxed relative before:content-['•'] before:absolute before:-left-4 before:text-admin-text-5"
          >
            {c.text}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between pl-7">
        <span className="text-[11px] text-admin-text-5 font-medium">
          Berdasarkan {rule.jumlah_sampel} data mahasiswa serupa
        </span>
        <div className="flex items-center gap-2.5">
          <div className="w-16 h-1.5 bg-admin-border-soft rounded-full overflow-hidden">
            <div
              className={`h-full ${bar} rounded-full`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={`text-[11px] font-bold ${color}`}>
            {label} ({pct}%)
          </span>
        </div>
      </div>
    </div>
  );
}
