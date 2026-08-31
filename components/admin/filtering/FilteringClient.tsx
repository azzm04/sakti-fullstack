"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, ListFilter, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { FILTERING_JALUR_KEYS, JALUR_LABELS, type JalurKey } from "@/lib/jalur";
import { RadioRow } from "@/components/admin/ui/RadioRow";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Pill } from "@/components/admin/ui/Pill";

interface RankedRow {
  rank: number;
  statusFinalPreview: "Lolos Kuota" | "Tidak Lolos Kuota";
  id: string;
  nama_pendaftar: string | null;
  no_pendaftaran_kipk: string | null;
  prodi_pendaftar: string | null;
  golongan_ukt: number | null;
  kondisi_orang_tua: string | null;
  pendapatan_per_kapita: number;
  status_final_saat_ini: string | null;
  ranking_kuota_saat_ini: number | null;
}

type FetchState = "idle" | "loading" | "done" | "error";

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function FilteringClient() {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(String(currentYear));
  const [jalur, setJalur] = useState<JalurKey | "">("");
  const [kuota, setKuota] = useState("");
  const [state, setState] = useState<FetchState>("idle");
  const [rows, setRows] = useState<RankedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ totalLolos: number; totalTidakLolos: number } | null>(null);

  const tahunValid = /^\d{4}$/.test(tahun) && parseInt(tahun) >= 2020 && parseInt(tahun) <= 2099;
  const kuotaValid = /^\d+$/.test(kuota) && parseInt(kuota) >= 0;
  const canRun = tahunValid && !!jalur && kuotaValid;

  async function handleTampilkan() {
    if (!tahunValid || !jalur) return;
    setState("loading");
    setError(null);
    setRunResult(null);
    try {
      const params = new URLSearchParams({ tahun, jalur });
      if (kuotaValid) params.set("kuota", kuota);
      const res = await fetch(`/api/admin/filtering?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data");
      setRows(json.data ?? []);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setState("error");
    }
  }

  async function handleJalankan() {
    if (!canRun) return;
    const jalurLabel = JALUR_LABELS[jalur as JalurKey];
    const confirmed = window.confirm(
      `Jalankan Filtering Kuota untuk ${jalurLabel} tahun ${tahun} dengan kuota ${kuota}?\n\n` +
        "Ini akan MENIMPA status kelulusan kuota sebelumnya (jika pernah dijalankan) untuk kombinasi tahun+jalur ini.",
    );
    if (!confirmed) return;

    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/filtering/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tahun: Number(tahun), jalur, kuota: Number(kuota) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menjalankan filtering");
      setRunResult({ totalLolos: json.totalLolos, totalTidakLolos: json.totalTidakLolos });
      await handleTampilkan();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="min-h-screen bg-admin-bg font-admin-body text-admin-text flex flex-col">
      <PageHeader
        breadcrumb="Admin / Seleksi KIP-K / Filtering Kuota"
        title="Filtering Kuota (UM & SBUB)"
      />

      <div className="px-[30px] pt-[22px] pb-[34px] flex flex-col gap-[18px]">
        {/* Pilih Data */}
        <section className="bg-admin-surface rounded-2xl border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ListFilter size={16} className="text-admin-accent" />
            <div>
              <p className="text-[13px] font-bold text-admin-text">Pilih Data & Kuota</p>
              <p className="text-[11.5px] text-admin-text-3">
                Kandidat yang direkomendasikan (&ldquo;Diusulkan&rdquo;) akan diurutkan: Golongan UKT terendah →
                Yatim Piatu → Yatim → Piatu → pendapatan per kapita terendah.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-2">
                Tahun Seleksi
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-admin-surface-soft border border-admin-border rounded-xl text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent"
              />
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-2">
                Jalur Masuk
              </label>
              <div className="grid grid-cols-1 gap-2">
                {FILTERING_JALUR_KEYS.map((key) => (
                  <RadioRow
                    key={key}
                    label={JALUR_LABELS[key]}
                    selected={jalur === key}
                    onSelect={() => setJalur(key)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-admin-text-3 uppercase tracking-wider mb-2">
                Kuota
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Contoh: 10"
                value={kuota}
                onChange={(e) => setKuota(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-admin-surface-soft border border-admin-border rounded-xl text-sm text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-accent/30 focus:border-admin-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleTampilkan}
              disabled={!tahunValid || !jalur || state === "loading"}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-admin-accent hover:bg-admin-accent-hover text-white disabled:bg-admin-border disabled:text-admin-placeholder disabled:cursor-not-allowed transition-colors"
            >
              {state === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Tampilkan Peringkat
            </button>

            <button
              onClick={handleJalankan}
              disabled={!canRun || running}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-admin-danger-bar hover:opacity-90 text-white disabled:bg-admin-border disabled:text-admin-placeholder disabled:cursor-not-allowed transition-colors"
            >
              {running ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
              Jalankan Filtering
            </button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-xs text-admin-danger-text bg-admin-danger-bg border border-admin-danger-border rounded-lg px-3 py-2">
              <AlertTriangle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          {runResult && (
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
              <Pill tone="accent">Lolos Kuota: {runResult.totalLolos}</Pill>
              <Pill tone="danger">Tidak Lolos Kuota: {runResult.totalTidakLolos}</Pill>
            </div>
          )}
        </section>

        {/* Tabel hasil ranking */}
        {state === "done" && rows.length === 0 && (
          <EmptyState
            icon={<ListFilter size={26} />}
            title="Belum ada kandidat"
            description="Tidak ada kandidat berstatus Diusulkan untuk kombinasi tahun dan jalur ini."
          />
        )}

        {rows.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-admin-surface rounded-2xl border border-admin-border shadow-[0_1px_2px_rgba(20,40,70,0.05)] overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-admin-surface-soft border-b border-admin-border-soft text-[10.5px] font-extrabold uppercase tracking-wider text-admin-text-3">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Nama</th>
                    <th className="px-4 py-3 text-left">No. Pendaftaran</th>
                    <th className="px-4 py-3 text-left">Prodi</th>
                    <th className="px-4 py-3 text-left">Golongan UKT</th>
                    <th className="px-4 py-3 text-left">Kondisi Ortu</th>
                    <th className="px-4 py-3 text-left">Pendapatan/Kapita</th>
                    <th className="px-4 py-3 text-left">Status Saat Ini</th>
                    <th className="px-4 py-3 text-left">Proyeksi (Kuota={kuota || "—"})</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-admin-border-soft last:border-0 hover:bg-admin-surface-soft">
                      <td className="px-4 py-3 font-bold text-admin-accent tabular-nums">{r.rank}</td>
                      <td className="px-4 py-3 font-semibold text-admin-text">{r.nama_pendaftar ?? "—"}</td>
                      <td className="px-4 py-3 font-admin-mono text-xs text-admin-text-3">
                        {r.no_pendaftaran_kipk ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-admin-text-2">{r.prodi_pendaftar ?? "—"}</td>
                      <td className="px-4 py-3 text-admin-text-2">
                        {r.golongan_ukt ? `Golongan ${r.golongan_ukt}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-admin-text-2">{r.kondisi_orang_tua ?? "—"}</td>
                      <td className="px-4 py-3 text-admin-text-2 tabular-nums">{fmt.format(r.pendapatan_per_kapita)}</td>
                      <td className="px-4 py-3">
                        {r.status_final_saat_ini ? (
                          <Pill tone={r.status_final_saat_ini === "Lolos Kuota" ? "accent" : "danger"}>
                            {r.status_final_saat_ini}
                            {r.ranking_kuota_saat_ini ? ` #${r.ranking_kuota_saat_ini}` : ""}
                          </Pill>
                        ) : (
                          <span className="text-admin-text-5 text-xs">Belum difilter</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={r.statusFinalPreview === "Lolos Kuota" ? "accent" : "danger"}>
                          {r.statusFinalPreview}
                        </Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
