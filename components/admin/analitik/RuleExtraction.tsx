"use client";

import { CheckCircle2, XCircle, ChevronDown, ChevronUp, GitFork } from "lucide-react";
import type { RuleNode } from "@/types/analitik";
import { useState } from "react";

interface Props {
  rules: RuleNode[];
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

interface Clause {
  raw: string;
  feature: string;
  op: "≤" | ">";
  value: number;
}

// Pecah "Fitur A ≤ 1 & Fitur B > 2" jadi klausa terstruktur, supaya bisa
// dibandingkan antar rule (bukan cuma dijadikan teks manusiawi).
function parseClauses(kondisi: string): Clause[] {
  return kondisi
    .split("&")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((raw) => {
      const m = raw.match(/^(.+?)\s*([≤>])\s*([\d.]+)$/);
      if (!m) return { raw, feature: raw, op: ">" as const, value: NaN };
      return { raw, feature: m[1].trim(), op: m[2] as "≤" | ">", value: parseFloat(m[3]) };
    });
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

interface RenderRule extends RuleNode {
  clauses: Clause[];
}

type RenderItem =
  | { type: "solo"; rule: RenderRule }
  | {
      type: "fork";
      shared: Clause[];
      feature: string;
      a: RenderRule;
      b: RenderRule;
      diffA: Clause;
      diffB: Clause;
    };

// Dua rule dianggap "percabangan" dari titik yang sama kalau kondisinya identik
// kecuali satu klausa, dan klausa itu adalah fitur yang sama dengan arah
// operator berlawanan (persis seperti split biner pada decision tree). Fitur
// yang sama BISA muncul lebih dari sekali dalam satu rule (mis. dites ulang di
// kedalaman pohon yang berbeda), jadi klausa pembeda dikembalikan sebagai
// instance persis — bukan dicari ulang lewat nama fitur, yang akan ambigu.
function findFork(
  a: RenderRule,
  b: RenderRule,
): { shared: Clause[]; diffA: Clause; diffB: Clause } | null {
  if (a.clauses.length !== b.clauses.length) return null;

  const remainingB = [...b.clauses];
  const shared: Clause[] = [];
  let diffA: Clause | null = null;

  for (const ca of a.clauses) {
    const idx = remainingB.findIndex(
      (cb) => cb.feature === ca.feature && cb.op === ca.op && cb.value === ca.value,
    );
    if (idx >= 0) {
      shared.push(ca);
      remainingB.splice(idx, 1);
    } else if (diffA === null) {
      diffA = ca;
    } else {
      return null; // lebih dari satu klausa berbeda
    }
  }

  if (!diffA || remainingB.length !== 1) return null;
  const diffB = remainingB[0];
  if (diffA.feature !== diffB.feature || diffA.op === diffB.op) return null;

  return { shared, diffA, diffB };
}

function buildRenderItems(rules: RenderRule[]): RenderItem[] {
  const used = new Set<number>();
  const items: RenderItem[] = [];

  for (let i = 0; i < rules.length; i++) {
    if (used.has(i)) continue;
    let paired = false;

    for (let j = i + 1; j < rules.length; j++) {
      if (used.has(j)) continue;
      const fork = findFork(rules[i], rules[j]);
      if (fork) {
        used.add(i);
        used.add(j);
        const swapped = rules[i].keputusan !== "Diusulkan";
        const a = swapped ? rules[j] : rules[i];
        const b = swapped ? rules[i] : rules[j];
        const diffA = swapped ? fork.diffB : fork.diffA;
        const diffB = swapped ? fork.diffA : fork.diffB;
        items.push({ type: "fork", shared: fork.shared, feature: diffA.feature, a, b, diffA, diffB });
        paired = true;
        break;
      }
    }

    if (!paired) {
      used.add(i);
      items.push({ type: "solo", rule: rules[i] });
    }
  }

  return items;
}

export default function RuleExtraction({ rules }: Props) {
  const [showAll, setShowAll] = useState(false);

  const safeRules = Array.isArray(rules) ? rules : [];
  const diusulkan = safeRules.filter((r) => r.keputusan === "Diusulkan");
  const tidak = safeRules.filter((r) => r.keputusan !== "Diusulkan");
  const ordered: RenderRule[] = [...diusulkan, ...tidak].map((r) => ({
    ...r,
    clauses: parseClauses(r.kondisi),
  }));

  const items = buildRenderItems(ordered);
  const visible = showAll ? items : items.slice(0, PREVIEW_COUNT);
  const hiddenCount = items.length - PREVIEW_COUNT;

  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="font-admin-heading text-[19px] font-semibold text-admin-text">
        Pola Keputusan yang Ditemukan
      </h3>
      <p className="text-[12.5px] text-admin-text-3 mt-1 mb-4">
        {ordered.length} pola hasil analisis — makin banyak sampel & keyakinan, makin kuat pola ini
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {visible.map((item, i) =>
          item.type === "fork" ? (
            <RuleForkCard
              key={i}
              index={i + 1}
              shared={item.shared}
              feature={item.feature}
              a={item.a}
              b={item.b}
              diffA={item.diffA}
              diffB={item.diffB}
            />
          ) : (
            <RuleCard
              key={i}
              index={i + 1}
              rule={item.rule}
              variant={item.rule.keputusan === "Diusulkan" ? "diusulkan" : "tidak"}
            />
          ),
        )}
      </div>

      {items.length > PREVIEW_COUNT && (
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
  rule: RenderRule;
  variant: "diusulkan" | "tidak";
  index: number;
}) {
  const isDiusulkan = variant === "diusulkan";
  const pct = Math.round(rule.confidence * 100);
  const { label, color, bar } = confidenceLabel(pct);

  const Icon = isDiusulkan ? CheckCircle2 : XCircle;
  const iconColor = isDiusulkan ? "text-admin-accent" : "text-admin-danger-bar";

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
        {rule.clauses.map((c, i) => (
          <li
            key={i}
            className="text-[12.5px] text-admin-text-2 leading-relaxed pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-admin-text-5"
          >
            {parseCondition(c.raw)}
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

// Dua rule yang cuma beda di SATU fitur (arah split yang sama) digabung jadi
// satu kartu "percabangan" — kondisi yang sama ditulis sekali, lalu fitur
// pembedanya ditonjolkan sebagai dua cabang berdampingan. Ini mencegah dua
// kartu nyaris identik yang bedanya cuma satu baris jadi sulit dibandingkan.
function RuleForkCard({
  shared,
  feature,
  a,
  b,
  diffA,
  diffB,
  index,
}: {
  shared: Clause[];
  feature: string;
  a: RenderRule;
  b: RenderRule;
  diffA: Clause;
  diffB: Clause;
  index: number;
}) {
  return (
    <div className="bg-admin-surface border border-admin-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-admin-text-4">
          <GitFork size={14} />
          Titik Percabangan
        </p>
        <span className="text-[11px] font-semibold text-admin-text-5 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </div>

      {shared.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-4 mb-2.5">
            Jika kondisi berikut sama
          </p>
          <ul className="space-y-1.5 mb-4">
            {shared.map((c, i) => (
              <li
                key={i}
                className="text-[12.5px] text-admin-text-2 leading-relaxed pl-3.5 relative before:content-['•'] before:absolute before:left-0 before:text-admin-text-5"
              >
                {parseCondition(c.raw)}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="text-[11px] font-semibold uppercase tracking-wide text-admin-text-4 mb-2.5">
        Yang membedakan: {feature}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <ForkBranch rule={a} diffClause={diffA} isDiusulkan />
        <ForkBranch rule={b} diffClause={diffB} isDiusulkan={false} />
      </div>
    </div>
  );
}

function ForkBranch({
  rule,
  diffClause,
  isDiusulkan,
}: {
  rule: RenderRule;
  diffClause: Clause;
  isDiusulkan: boolean;
}) {
  const pct = Math.round(rule.confidence * 100);
  const { label, color, bar } = confidenceLabel(pct);
  const Icon = isDiusulkan ? CheckCircle2 : XCircle;

  return (
    <div
      className={`rounded-xl border p-3.5 ${
        isDiusulkan
          ? "bg-admin-accent/[0.06] border-admin-accent/20"
          : "bg-admin-danger-bg/40 border-admin-danger-border"
      }`}
    >
      <p
        className={`text-[12.5px] font-bold leading-snug mb-2 ${
          isDiusulkan ? "text-admin-accent-ink" : "text-admin-danger-text"
        }`}
      >
        {parseCondition(diffClause.raw)}
      </p>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide ${
        isDiusulkan ? "text-admin-accent" : "text-admin-danger-bar"
      }`}>
        <Icon size={12} />
        {isDiusulkan ? "Diusulkan" : "Tidak Diusulkan"}
      </div>
      <p className="text-[10.5px] text-admin-text-4 mt-2">{rule.jumlah_sampel} data serupa</p>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div className="w-10 h-1.5 bg-admin-grid rounded-full overflow-hidden shrink-0">
          <div className={`h-full ${bar} rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <span className={`text-[10.5px] font-bold whitespace-nowrap ${color}`}>
          {label} ({pct}%)
        </span>
      </div>
    </div>
  );
}
