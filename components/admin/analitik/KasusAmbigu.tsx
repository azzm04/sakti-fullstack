"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { KasusAmbigu } from "@/types/analitik";

interface Props {
  data: KasusAmbigu[];
}

const PREVIEW_COUNT = 10;

function formatRupiah(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseSkor(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function getSkorKejanggalan(kasus: KasusAmbigu) {
  const skor = parseSkor(kasus.skor_kejanggalan);
  if (skor !== null) return skor;
  return (kasus.probabilitas || 0) * 100;
}

function getP3KEDesil(desil_dtsen?: string | null) {
  if (!desil_dtsen) return "Tidak Terdata";

  const match = desil_dtsen.match(/desil\s*(\d+)/i);
  if (match) return `Desil ${match[1]}`;

  const lowerDesil = desil_dtsen.toLowerCase();
  if (
    lowerDesil.includes("belum terdata") ||
    lowerDesil.includes("tidak terdata")
  ) {
    return "Tidak Terdata";
  }

  return desil_dtsen || "—";
}

function kekuatanInfo(kasus: KasusAmbigu) {
  const skor = getSkorKejanggalan(kasus);
  let label = "Cukup wajar";

  if (kasus.tingkat_kejanggalan) {
    label = kasus.tingkat_kejanggalan.replace(/^\d+%\s*/, "").trim();
  } else {
    label =
      skor >= 90
        ? "Sangat perlu ditinjau"
        : skor >= 70
          ? "Perlu ditinjau"
          : "Cukup wajar";
  }

  const labelLower = label.toLowerCase();

  if (labelLower.includes("sangat perlu ditinjau"))
    return { color: "text-admin-danger-text bg-admin-danger-bg border-admin-danger-border", label, skor };
  if (labelLower.includes("perlu ditinjau"))
    return {
      color: "text-admin-warn-text bg-admin-warn-bg-2 border-admin-warn-border",
      label,
      skor,
    };
  return {
    color: "text-admin-accent-ink bg-admin-accent/10 border-admin-accent/25",
    label,
    skor,
  };
}

export default function KasusAmbigu({ data }: Props) {
  const [showAll, setShowAll] = useState(false);

  const safeData = Array.isArray(data) ? data : [];
  const sortedData = [...safeData].sort(
    (a, b) =>
      getSkorKejanggalan(b as KasusAmbigu) -
      getSkorKejanggalan(a as KasusAmbigu),
  );

  const visibleData = showAll ? sortedData : sortedData.slice(0, PREVIEW_COUNT);
  const hiddenCount = sortedData.length - PREVIEW_COUNT;

  function handleExport() {
    const header = [
      "#",
      "Keputusan Aktual",
      "Pola Umum",
      "Kekuatan Pola",
      "Aktif DTSEN",
      "Desil DTSEN",
      "Per Kapita",
      "Alasan Kejanggalan",
      "Kondisi Rumah",
    ];
    const rows = sortedData.map((item) => {
      const k = item;
      return [
        k.index,
        k.keputusan_aktual,
        k.prediksi_model,
        `${getSkorKejanggalan(k).toFixed(0)}%`,
        k.aktif_dtsen,
        getP3KEDesil(k.desil_dtsen),
        k.nominal_per_kapita ?? "",
        k.alasan_kejanggalan ?? "",
        k.kondisi_rumah,
      ];
    });
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keputusan_perlu_ditinjau.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl border border-admin-border shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="flex items-start sm:items-center justify-between px-6 py-5 border-b border-admin-border-soft gap-4 flex-col sm:flex-row">
        <div>
          <h3 className="font-admin-heading text-sm font-semibold text-admin-text flex items-center gap-2">
            <AlertTriangle size={16} className="text-admin-warn-bar" />
            Kasus yang Layak Ditinjau Ulang
          </h3>
          <p className="text-xs text-admin-text-4 mt-1.5 flex items-start gap-1.5 max-w-2xl leading-relaxed">
            <Info size={14} className="mt-0.5 shrink-0 text-admin-text-5" />
            Pendaftar yang keputusan wawancaranya berbeda dari pola pendaftar
            serupa lainnya. Diurutkan dari yang paling mencurigakan.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 text-xs font-medium text-admin-text-2 bg-white border border-admin-text-6 rounded-lg px-4 py-2 hover:bg-admin-surface-soft hover:text-admin-text transition-all shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-admin-border"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-190">
          <thead>
            <tr className="bg-admin-surface-soft/50 border-b border-admin-border-soft">
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider w-16">
                #
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Tingkat Kejanggalan
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Keputusan Aktual
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Aktif DTSEN
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Desil DTSEN
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Per Kapita
              </th>
              <th className="px-6 py-3.5 text-xs font-medium text-admin-text-4 uppercase tracking-wider">
                Alasan Kejanggalan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border-soft">
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Info size={24} className="text-admin-text-6" />
                    <p className="text-sm text-admin-text-4">
                      Tidak ada kasus yang perlu ditinjau ulang
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleData.map((item) => {
                const k = item as KasusAmbigu;
                const { color, label, skor } = kekuatanInfo(k);
                return (
                  <tr
                    key={k.index}
                    className="hover:bg-admin-surface-soft/80 transition-colors align-middle group"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-admin-text-5 group-hover:text-admin-text-4">
                      {k.index}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${color}`}
                      >
                        {skor.toFixed(0)}% {label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-md ${
                          k.keputusan_aktual === "Diusulkan"
                            ? "bg-admin-accent/10 text-admin-accent-ink border border-admin-accent/20"
                            : "bg-admin-danger-bg text-admin-danger-text border border-admin-danger-border"
                        }`}
                      >
                        {k.keputusan_aktual}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text-2">
                      {k.aktif_dtsen}
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text-2">
                      {getP3KEDesil(k.desil_dtsen)}
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text-2">
                      {formatRupiah(k.nominal_per_kapita ?? null)}
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text-3 max-w-90 whitespace-normal leading-relaxed">
                      {k.alasan_kejanggalan ?? "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Tampilkan tombol hanya jika jumlah data lebih dari batas preview */}
      {sortedData.length > PREVIEW_COUNT && (
        <div className="px-6 py-4 border-t border-admin-border-soft bg-admin-surface-soft/30 flex justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-admin-text-3 bg-white border border-admin-border rounded-lg px-5 py-2.5 hover:bg-admin-surface-soft hover:text-admin-text transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-admin-border"
          >
            {showAll ? (
              <>
                Sembunyikan
                <ChevronUp size={14} className="text-admin-text-5" />
              </>
            ) : (
              <>
                Lihat {hiddenCount} kasus lainnya
                <ChevronDown size={14} className="text-admin-text-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
