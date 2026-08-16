"use client";

import { useState } from "react";
import { Download, ArrowRight, TriangleAlert, ChevronDown, ChevronUp } from "lucide-react";
import type { KasusOverrideItem } from "@/types/analitik";

interface Props {
  data: KasusOverrideItem[];
}

const PREVIEW_COUNT = 15; // Batas jumlah baris awal yang ditampilkan

function formatRupiah(n: number | null) {
  if (n === null) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function isPositif(label: string) {
  return (
    label === "Diusulkan" ||
    label === "Layak" ||
    label === "Layak Dipertimbangkan"
  );
}

// Sub-komponen untuk memotong teks panjang
function ExpandableText({ text, maxLength = 90, className = "" }: { text: string; maxLength?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <span className={`leading-relaxed ${className}`}>{text}</span>;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`leading-relaxed ${className}`}>
        {expanded ? text : `${text.slice(0, maxLength)}...`}
      </span>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] font-semibold text-admin-accent bg-admin-accent/5 hover:bg-admin-accent/10 px-2 py-0.5 rounded transition-colors whitespace-nowrap"
      >
        {expanded ? "Ringkas" : "Selengkapnya"}
      </button>
    </div>
  );
}

export default function KasusOverrideAdmin({ data }: Props) {
  const [showAll, setShowAll] = useState(false);
  const safeData = Array.isArray(data) ? data : [];

  // turun = pewawancara nilai layak, admin lebih ketat (tolak)
  // naik  = pewawancara nilai tidak layak, admin lebih longgar (terima)
  const turun = safeData.filter((d) => d.jenis_override === "turun");
  const naik = safeData.filter((d) => d.jenis_override === "naik");
  const pctTurun = safeData.length ? (turun.length / safeData.length) * 100 : 0;

  // Logika pembatasan baris
  const visibleData = showAll ? safeData : safeData.slice(0, PREVIEW_COUNT);
  const hiddenCount = safeData.length - PREVIEW_COUNT;

  function handleExport() {
    const header = [
      "Nama",
      "No. Pendaftaran",
      "Rekomendasi Pewawancara",
      "Hasil Akhir",
      "Per Kapita",
      "Alasan Pewawancara",
      "Catatan Admin",
    ];
    // Export tetap mengambil dari safeData agar semua baris ikut terekspor
    const rows = safeData.map((k) => [
      k.nama,
      k.no_pendaftaran_kipk,
      k.rekomendasi_pewawancara,
      k.hasil_akhir,
      k.per_kapita ?? "",
      k.alasan_pewawancara ?? "",
      k.catatan_admin ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keputusan_berbeda.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (safeData.length === 0) return null;

  return (
    <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-admin-border">
        <div>
          <h3 className="font-admin-heading text-sm font-bold text-admin-text">
            Keputusan Berbeda antara Pewawancara dan Admin
          </h3>
          <p className="text-xs text-admin-text-3 mt-0.5">
            {safeData.length} kandidat dengan rekomendasi berbeda dari keputusan
            final
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-3 border border-admin-border rounded-lg px-3 py-1.5 hover:text-admin-text hover:border-foreground/20 transition-colors shrink-0"
        >
          <Download size={12} />
          Export CSV
        </button>
      </div>

      {/* Ringkasan sebagai satu bar proporsi */}
      <div className="px-6 py-4 border-b border-admin-border">
        <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-admin-surface-soft">
          <div className="bg-admin-danger-text" style={{ width: `${pctTurun}%` }} />
          <div
            className="bg-admin-warn-bar"
            style={{ width: `${100 - pctTurun}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-admin-danger-text shrink-0" />
            <span className="font-semibold text-admin-text">
              {turun.length}
            </span>
            <span className="text-admin-text-3">
              Layak menurut pewawancara, ditolak admin
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-admin-warn-bar shrink-0" />
            <span className="font-semibold text-admin-text">{naik.length}</span>
            <span className="text-admin-text-3">
              Tidak layak menurut pewawancara, diterima admin
            </span>
          </div>
        </div>
      </div>

      {/* Tabel */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-admin-border">
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3 w-10">
                #
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3">
                Kandidat
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3">
                Perubahan Keputusan
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3 text-right">
                Per Kapita
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3">
                Alasan Pewawancara
              </th>
              <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-admin-text-3">
                Catatan Admin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {visibleData.map((k, i) => {
              const akhirPositif = isPositif(k.hasil_akhir);
              return (
                <tr
                  key={k.kandidat_id}
                  className="hover:bg-admin-surface-soft/30 transition-colors"
                >
                  <td className="px-5 py-3 font-mono text-xs text-admin-text-3 align-top">
                    {i + 1}
                  </td>
                  <td className="px-5 py-3 align-top min-w-[200px]">
                    <p className="font-semibold text-admin-text text-sm leading-tight">
                      {k.nama}
                    </p>
                    <p className="text-[11px] text-admin-text-3 font-mono mt-0.5">
                      {k.no_pendaftaran_kipk}
                    </p>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
                      <span className="text-admin-text-3">
                        {k.rekomendasi_pewawancara}
                      </span>
                      <ArrowRight
                        size={11}
                        className="text-admin-text-3/50 shrink-0"
                      />
                      <span
                        className={`font-semibold ${
                          akhirPositif ? "text-admin-accent-ink" : "text-admin-danger-text"
                        }`}
                      >
                        {k.hasil_akhir}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right align-top whitespace-nowrap">
                    <span className="font-mono text-xs tabular-nums text-admin-text">
                      {formatRupiah(k.per_kapita)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs align-top min-w-[250px] w-[30%]">
                    {k.alasan_pewawancara ? (
                      <ExpandableText text={k.alasan_pewawancara} className="text-admin-text-3" />
                    ) : (
                      <span className="text-admin-text-3/40">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs align-top min-w-[200px] w-[25%]">
                    {k.catatan_admin ? (
                      <ExpandableText text={k.catatan_admin} className="text-admin-text" />
                    ) : (
                      <span className="flex items-center gap-1 text-admin-warn-text whitespace-nowrap">
                        <TriangleAlert size={11} className="shrink-0" />
                        Tanpa catatan
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tombol Tampilkan Lebih Banyak (Hanya muncul jika data melebihi PREVIEW_COUNT) */}
      {safeData.length > PREVIEW_COUNT && (
        <div className="px-6 py-4 border-t border-admin-border flex justify-center">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-admin-text-3 bg-admin-bg border border-admin-border rounded-lg px-5 py-2.5 hover:bg-admin-surface-soft/50 hover:text-admin-text transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-border"
          >
            {showAll ? (
              <>
                Sembunyikan
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                Lihat {hiddenCount} kasus lainnya
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer info */}
      <div className="px-6 py-3 bg-admin-surface-soft/20 border-t border-admin-border">
        <p className="text-xs text-admin-text-3">
          Perbedaan pandangan antara pewawancara lapangan dan admin — bukan
          indikasi kesalahan, admin bisa memiliki informasi tambahan yang tidak
          tercatat di sini.
        </p>
      </div>
    </div>
  );
}