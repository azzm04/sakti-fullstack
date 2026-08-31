"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldCheck,
  CheckSquare,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
} from "lucide-react";
import { JALUR_OPTIONS, type JalurKey } from "@/lib/jalur";

interface PoolRow {
  id: string;
  no_pendaftaran_kipk: string | null;
  nama_pendaftar: string | null;
  prodi_pendaftar: string | null;
  jalur_masuk: string | null;
  nim_resmi: string | null;
  status_sk: string | null;
}

interface EditableRow extends PoolRow {
  nimInput: string;
  statusInput: "Ditetapkan" | "Tidak Ditetapkan" | null;
  touched: boolean;
  dariExcel: boolean;
}

interface MatchedItem {
  kandidat_id: string;
  nim_dari_excel: string;
  skor: number;
}
interface InfoItem {
  kandidat_id?: string;
  nama_pendaftar?: string;
  nama?: string;
  no_pendaftaran_kipk?: string | null;
}

const NIM_REGEX = /^\d{14}$/;

export interface PenetapanSKCounts {
  ditetapkan: number;
  tidakDitetapkan: number;
  belum: number;
  total: number;
}

interface Props {
  onSaved?: () => void;
  onCountsChange?: (counts: PenetapanSKCounts | null) => void;
}

export default function SectionPenetapanSK({ onSaved, onCountsChange }: Props) {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(String(currentYear));
  const [selectedJalur, setSelectedJalur] = useState<Set<JalurKey>>(new Set());
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveResult, setSaveResult] = useState<{ berhasil: number; gagal: number } | null>(null);
  const [tidakDitemukan, setTidakDitemukan] = useState<InfoItem[]>([]);
  const [barisTidakCocok, setBarisTidakCocok] = useState<InfoItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleJalur(key: JalurKey) {
    setSelectedJalur((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleTampilkan() {
    if (selectedJalur.size === 0) {
      setError("Pilih minimal satu jalur masuk.");
      return;
    }
    setLoading(true);
    setError(null);
    setSaveResult(null);
    setTidakDitemukan([]);
    setBarisTidakCocok([]);
    try {
      const jalurParam = Array.from(selectedJalur).join(",");
      const res = await fetch(`/api/admin/hasil-akhir/penetapan-sk?tahun=${tahun}&jalur=${jalurParam}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengambil data");

      const initial: EditableRow[] = (json.data as PoolRow[]).map((r) => ({
        ...r,
        nimInput: r.nim_resmi ?? "",
        statusInput: (r.status_sk as "Ditetapkan" | "Tidak Ditetapkan" | null) ?? null,
        touched: false,
        dariExcel: false,
      }));
      setRows(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  function updateRow(id: string, patch: Partial<EditableRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, touched: true } : r)));
  }

  async function handleUploadExcel(file: File) {
    setMatching(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tahun", tahun);
      formData.append("jalur", Array.from(selectedJalur).join(","));

      const res = await fetch("/api/admin/hasil-akhir/penetapan-sk/cocokkan", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mencocokkan data");

      const matchById = new Map((json.matched as MatchedItem[]).map((m) => [m.kandidat_id, m]));
      setRows((prev) =>
        prev.map((r) => {
          const m = matchById.get(r.id);
          if (!m) return r;
          return { ...r, nimInput: m.nim_dari_excel, statusInput: "Ditetapkan", touched: true, dariExcel: true };
        }),
      );
      setTidakDitemukan(json.tidakDitemukanDiExcel ?? []);
      setBarisTidakCocok(json.barisTidakCocok ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setMatching(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSimpanSemua() {
    const items = rows
      .filter((r) => r.touched && r.statusInput)
      .map((r) => ({ kandidat_id: r.id, nim_resmi: r.nimInput || null, status_sk: r.statusInput as string }));

    if (items.length === 0) {
      setError("Tidak ada baris yang diubah untuk disimpan.");
      return;
    }
    const invalid = items.find((i) => i.status_sk === "Ditetapkan" && !NIM_REGEX.test(i.nim_resmi ?? ""));
    if (invalid) {
      setError("Ada baris berstatus Ditetapkan dengan NIM tidak valid (harus 14 digit angka).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/hasil-akhir/penetapan-sk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan data");
      setSaveResult({ berhasil: json.berhasil, gagal: json.gagal?.length ?? 0 });
      setRows((prev) => prev.map((r) => ({ ...r, touched: false, dariExcel: false })));
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const touchedCount = rows.filter((r) => r.touched).length;

  useEffect(() => {
    if (rows.length === 0) {
      onCountsChange?.(null);
      return;
    }
    const ditetapkan = rows.filter((r) => r.statusInput === "Ditetapkan").length;
    const tidakDitetapkan = rows.filter((r) => r.statusInput === "Tidak Ditetapkan").length;
    onCountsChange?.({
      ditetapkan,
      tidakDitetapkan,
      belum: rows.length - ditetapkan - tidakDitetapkan,
      total: rows.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-admin-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-admin-accent/10 text-admin-accent flex items-center justify-center">
            <ShieldCheck size={17} />
          </div>
          <div>
            <h2 className="font-admin-heading font-bold text-admin-text text-base">Penetapan SK Massal</h2>
            <p className="text-xs text-admin-text-3 mt-0.5">
              Tetapkan status resmi pasca-SK untuk kandidat &quot;Diusulkan&quot; — manual atau dibantu cocokkan Excel.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-full md:w-32">
              <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
                Tahun
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold border border-admin-border rounded-lg bg-white focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
                Jalur Masuk (SK bisa mencakup beberapa jalur sekaligus)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {JALUR_OPTIONS.map(({ key, label }) => {
                  const sel = selectedJalur.has(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleJalur(key)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        sel
                          ? "bg-admin-accent/8 border-admin-accent text-admin-accent"
                          : "bg-admin-surface-soft border-admin-border text-admin-text-3 hover:border-admin-text-6"
                      }`}
                    >
                      {sel ? <CheckSquare size={13} /> : <Square size={13} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTampilkan}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-admin-accent hover:bg-admin-accent/90 text-white disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Tampilkan Data
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadExcel(f);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={matching || rows.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-admin-border text-admin-text-2 hover:border-admin-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {matching ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Upload Excel untuk Auto-isi
            </button>

            {rows.length > 0 && (
              <button
                onClick={handleSimpanSemua}
                disabled={saving || touchedCount === 0}
                className="ml-auto flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-admin-danger-bar text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Simpan Semua ({touchedCount})
              </button>
            )}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-admin-danger-bg border border-admin-danger-border rounded-xl text-sm font-semibold text-admin-danger-text"
              >
                <AlertCircle size={15} /> {error}
              </motion.div>
            )}
            {saveResult && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-admin-accent/10 border border-admin-accent/25 rounded-xl text-sm font-semibold text-admin-accent-ink"
              >
                <CheckCircle2 size={15} /> Berhasil menyimpan {saveResult.berhasil} baris
                {saveResult.gagal > 0 ? `, ${saveResult.gagal} gagal.` : "."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-admin-surface-soft border-b border-admin-border-soft text-[10.5px] font-extrabold uppercase tracking-wider text-admin-text-3">
                  <th className="px-4 py-3 text-left">Nama</th>
                  <th className="px-4 py-3 text-left">No. Pendaftaran</th>
                  <th className="px-4 py-3 text-left">Prodi</th>
                  <th className="px-4 py-3 text-left">Jalur</th>
                  <th className="px-4 py-3 text-left">NIM Resmi</th>
                  <th className="px-4 py-3 text-left">Status SK</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-admin-border-soft last:border-0 hover:bg-admin-surface-soft">
                    <td className="px-4 py-2.5 font-semibold text-admin-text">
                      <div className="flex items-center gap-1.5">
                        {r.nama_pendaftar ?? "—"}
                        {r.dariExcel && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-admin-accent/10 text-admin-accent">
                            <Sparkles size={9} /> Excel
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-admin-mono text-xs text-admin-text-3">
                      {r.no_pendaftaran_kipk ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-admin-text-2">{r.prodi_pendaftar ?? "—"}</td>
                    <td className="px-4 py-2.5 text-admin-text-2">{r.jalur_masuk ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={r.nimInput}
                        onChange={(e) => updateRow(r.id, { nimInput: e.target.value })}
                        placeholder="14 digit"
                        className="w-36 px-2.5 py-1.5 text-xs font-admin-mono border border-admin-border rounded-lg bg-admin-surface-soft focus:outline-none focus:border-admin-accent"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => updateRow(r.id, { statusInput: "Ditetapkan" })}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            r.statusInput === "Ditetapkan"
                              ? "bg-admin-accent text-white border-admin-accent"
                              : "bg-white text-admin-text-3 border-admin-border hover:border-admin-accent"
                          }`}
                        >
                          Ditetapkan
                        </button>
                        <button
                          onClick={() => updateRow(r.id, { statusInput: "Tidak Ditetapkan" })}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                            r.statusInput === "Tidak Ditetapkan"
                              ? "bg-admin-danger-bar text-white border-admin-danger-bar"
                              : "bg-white text-admin-text-3 border-admin-border hover:border-admin-danger-bar"
                          }`}
                        >
                          Tidak
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tidakDitemukan.length > 0 || barisTidakCocok.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tidakDitemukan.length > 0 && (
            <div className="bg-admin-warn-bg-2 border border-admin-warn-border rounded-2xl p-4">
              <p className="text-xs font-bold text-admin-warn-text mb-2">
                Diusulkan tapi tidak ditemukan di Excel ({tidakDitemukan.length})
              </p>
              <ul className="text-xs text-admin-warn-text/90 space-y-1 max-h-48 overflow-y-auto">
                {tidakDitemukan.map((k) => (
                  <li key={k.kandidat_id}>{k.nama_pendaftar} — {k.no_pendaftaran_kipk}</li>
                ))}
              </ul>
            </div>
          )}
          {barisTidakCocok.length > 0 && (
            <div className="bg-admin-danger-bg border border-admin-danger-border rounded-2xl p-4">
              <p className="text-xs font-bold text-admin-danger-text mb-2">
                Baris Excel tidak cocok dengan kandidat manapun ({barisTidakCocok.length})
              </p>
              <ul className="text-xs text-admin-danger-text/90 space-y-1 max-h-48 overflow-y-auto">
                {barisTidakCocok.map((b, i) => (
                  <li key={i}>{b.nama}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
