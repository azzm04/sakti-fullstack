"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  FileText,
  RefreshCw,
  Clock,
  XCircle,
} from "lucide-react";
import type { SKDokumen } from "./SectionImportSK";
import { JALUR_OPTIONS, type JalurKey } from "@/lib/jalur";

type PreviewItem = {
  nama: string;
  email: string;
  prodi: string;
  lolos: boolean;
};

type QueueStats = {
  total: number;
  queued: number;
  sent: number;
  failed: number;
};

const ease = [0.25, 0, 0, 1] as [number, number, number, number];

export default function SectionKirimEmail() {
  // Form state
  const [jalurTerpilih, setJalurTerpilih] = useState<Set<JalurKey>>(new Set());
  const [skList, setSkList] = useState<SKDokumen[]>([]);
  const [skTerpilih, setSkTerpilih] = useState<string>("");
  const [subject, setSubject] = useState(
    "Selamat! Anda Diterima sebagai Penerima KIP-K UNDIP 2025",
  );
  const [confirmed, setConfirmed] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Queue state
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Send state
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Load SK list on mount
  const fetchSK = useCallback(async () => {
    const res = await fetch("/api/admin/hasil-akhir/sk-dokumen");
    const json = await res.json();
    setSkList(json.data ?? []);
  }, []);

  const fetchQueueStats = useCallback(async () => {
    setLoadingQueue(true);
    try {
      const res = await fetch("/api/admin/hasil-akhir/email-queue/stats");
      const json = await res.json();
      if (res.ok) setQueueStats(json);
    } finally {
      setLoadingQueue(false);
    }
  }, []);

  useEffect(() => {
    fetchSK();
    fetchQueueStats();
  }, [fetchSK, fetchQueueStats]);

  function toggleJalur(key: JalurKey) {
    setJalurTerpilih((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setShowPreview(false);
    setPreview([]);
    setStatus("idle");
    setConfirmed(false);
  }

  function toggleAll() {
    if (jalurTerpilih.size === JALUR_OPTIONS.length)
      setJalurTerpilih(new Set());
    else setJalurTerpilih(new Set(JALUR_OPTIONS.map((j) => j.key)));
    setShowPreview(false);
    setConfirmed(false);
  }

  async function handleLoadPreview() {
    if (jalurTerpilih.size === 0) return;
    setLoadingPreview(true);
    setPreview([]);
    try {
      const jalurParam = Array.from(jalurTerpilih).join(",");
      const res = await fetch(
        `/api/admin/hasil-akhir/preview-email?jalur=${encodeURIComponent(jalurParam)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memuat preview");
      setPreview(json.data ?? []);
      setShowPreview(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat preview");
      setStatus("error");
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleEnqueue() {
    if (!confirmed || jalurTerpilih.size === 0 || !skTerpilih) return;

    setSending(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/admin/hasil-akhir/email-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jalur: Array.from(jalurTerpilih),
          sk_dokumen_id: skTerpilih,
          subject,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat antrian");

      setStatus("success");
      setConfirmed(false);
      fetchQueueStats(); // refresh stats
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
      setStatus("error");
    } finally {
      setSending(false);
    }
  }

  async function handleProcessQueue() {
    try {
      await fetch("/api/admin/hasil-akhir/email-queue/process", {
        method: "POST",
      });
      setTimeout(fetchQueueStats, 2000);
    } catch {
      /* silent */
    }
  }

  const selectedSK = skList.find((s) => s.id === skTerpilih);
  const canSend =
    confirmed && jalurTerpilih.size > 0 && !!skTerpilih && !sending;

  return (
    <div className="space-y-5">
      {/* ── Queue Status Card ── */}
      {queueStats && queueStats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ease }}
          className="bg-white rounded-2xl border border-admin-border shadow-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-admin-accent" />
              <h3 className="font-admin-heading text-sm font-bold text-admin-text">
                Status Antrian Email
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={fetchQueueStats}
                className="w-8 h-8 rounded-lg hover:bg-admin-surface-soft flex items-center justify-center text-admin-text-3"
              >
                <RefreshCw
                  size={13}
                  className={loadingQueue ? "animate-spin" : ""}
                />
              </motion.button>
              {queueStats.queued > 0 && (
                <button
                  onClick={handleProcessQueue}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-admin-accent text-white rounded-lg text-xs font-semibold hover:bg-admin-accent/90 transition-colors"
                >
                  <Send size={12} /> Proses Antrian
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                label: "Total",
                value: queueStats.total,
                color: "text-admin-text",
                bg: "bg-admin-surface-soft",
              },
              {
                label: "Antrian",
                value: queueStats.queued,
                color: "text-admin-warn-text",
                bg: "bg-admin-warn-bg-2",
              },
              {
                label: "Terkirim",
                value: queueStats.sent,
                color: "text-admin-accent",
                bg: "bg-admin-accent/10",
              },
              {
                label: "Gagal",
                value: queueStats.failed,
                color: "text-admin-danger-text",
                bg: "bg-admin-danger-bg",
              },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <p className={`text-xl font-extrabold font-admin-heading ${color}`}>
                  {value}
                </p>
                <p className="text-[10px] font-semibold text-admin-text-3 mt-0.5 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {queueStats.failed > 0 && (
            <p className="mt-3 text-xs text-admin-danger-text flex items-center gap-1.5">
              <XCircle size={12} />
              {queueStats.failed} email gagal — cek log server untuk detail,
              lalu proses antrian ulang.
            </p>
          )}
        </motion.div>
      )}

      {/* ── Form Card ── */}
      <div className="bg-white rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-admin-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-admin-danger-bg text-admin-danger-bar flex items-center justify-center">
            <Mail size={17} />
          </div>
          <div>
            <h2 className="font-admin-heading font-bold text-admin-text text-base">
              Kirim Email SK ke Kandidat
            </h2>
            <p className="text-xs text-admin-text-3 mt-0.5">
              Pilih jalur, pilih file SK, lalu masukkan ke antrian pengiriman
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Pilih Jalur — multi select */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider">
                Jalur Masuk
              </label>
              <button
                onClick={toggleAll}
                className="text-xs font-semibold text-admin-accent hover:underline underline-offset-2"
              >
                {jalurTerpilih.size === JALUR_OPTIONS.length
                  ? "Batal Semua"
                  : "Pilih Semua"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {JALUR_OPTIONS.map(({ key, label }) => {
                const sel = jalurTerpilih.has(key);
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleJalur(key)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      sel
                        ? "bg-admin-accent/8 border-admin-accent text-admin-accent"
                        : "bg-admin-surface-soft border-admin-border text-admin-text-3 hover:border-admin-text-6"
                    }`}
                  >
                    {sel ? <CheckSquare size={13} /> : <Square size={13} />}
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Pilih SK Dokumen */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              File SK yang akan dilampirkan
            </label>
            {skList.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-admin-warn-bg-2 border border-admin-warn-border rounded-xl text-sm text-admin-warn-text">
                <AlertCircle size={14} />
                Belum ada SK diupload. Pergi ke tab{" "}
                <strong>Import SK PDF</strong> untuk upload dulu.
              </div>
            ) : (
              <div className="space-y-2">
                {skList.map((sk) => (
                  <motion.button
                    key={sk.id}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSkTerpilih(sk.id);
                      setStatus("idle");
                      setConfirmed(false);
                    }}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      skTerpilih === sk.id
                        ? "bg-admin-accent/8 border-admin-accent"
                        : "bg-admin-surface-soft border-admin-border hover:border-admin-text-6"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        skTerpilih === sk.id
                          ? "bg-admin-accent text-white"
                          : "bg-admin-danger-bg text-admin-danger-bar"
                      }`}
                    >
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-semibold truncate ${skTerpilih === sk.id ? "text-admin-accent" : "text-admin-text"}`}
                      >
                        {sk.nama_file}
                      </p>
                      {sk.catatan && (
                        <p className="text-[11px] text-admin-text-3 truncate">
                          {sk.catatan}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {sk.jalur_masuk.map((j) => (
                          <span
                            key={j}
                            className="text-[10px] font-bold px-1.5 py-0.5 bg-white border border-admin-border rounded-full text-admin-text-3"
                          >
                            {JALUR_OPTIONS.find((o) => o.key === j)?.label ?? j}
                          </span>
                        ))}
                      </div>
                    </div>
                    {skTerpilih === sk.id && (
                      <CheckCircle2
                        size={15}
                        className="text-admin-accent shrink-0 mt-0.5"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Subjek Email */}
          <div>
            <label className="text-xs font-semibold text-admin-text-3 uppercase tracking-wider block mb-2">
              Subjek Email
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 text-sm border border-admin-border rounded-xl bg-admin-surface-soft focus:outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/10 transition-all"
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 px-4 py-3 bg-admin-warn-bg-2 border border-admin-warn-border rounded-xl text-sm text-admin-warn-text">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Sistem akan mengirim <strong>email dinamis</strong> ke{" "}
              <strong>semua kandidat</strong> (Lolos & Belum Lolos) pada jalur
              yang dipilih. Kandidat yang Lolos akan mendapat ucapan selamat
              beserta lampiran PDF SK.
            </span>
          </div>

          {/* Preview penerima */}
          <div>
            <button
              onClick={
                showPreview ? () => setShowPreview(false) : handleLoadPreview
              }
              disabled={loadingPreview || jalurTerpilih.size === 0}
              className="flex items-center gap-2 text-sm font-semibold text-admin-accent hover:underline underline-offset-2 disabled:opacity-40 transition-all"
            >
              {loadingPreview ? (
                <Loader2 size={14} className="animate-spin" />
              ) : showPreview ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
              {loadingPreview
                ? "Memuat..."
                : showPreview
                  ? `Sembunyikan (${preview.length} penerima)`
                  : "Lihat daftar penerima"}
            </button>

            <AnimatePresence>
              {showPreview && preview.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 border border-admin-border rounded-xl overflow-hidden">
                    <div className="px-4 py-2.5 bg-admin-surface-soft flex items-center gap-2 border-b border-admin-border">
                      <Users size={12} className="text-admin-text-3" />
                      <span className="text-xs font-semibold text-admin-text-3">
                        {preview.length} kandidat akan menerima email
                      </span>
                    </div>
                    <div className="max-h-52 overflow-y-auto divide-y divide-admin-border">
                      {preview.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-4 py-2.5"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              p.lolos
                                ? "bg-admin-accent/20 text-admin-accent-ink"
                                : "bg-admin-border-soft text-admin-text-4" // 👈 Beda warna inisial
                            }`}
                          >
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-semibold text-admin-text truncate">
                                {p.nama}
                              </p>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                  p.lolos
                                    ? "bg-admin-accent/10 text-admin-accent border border-admin-accent/25"
                                    : "bg-admin-border-soft text-admin-text-4 border border-admin-border"
                                }`}
                              >
                                {p.lolos ? "Lolos" : "Belum Lolos"}
                              </span>
                            </div>
                            <p className="text-[11px] text-admin-text-3 truncate">
                              {p.email}
                            </p>
                          </div>
                          <span className="text-[10px] text-admin-text-3 hidden md:block shrink-0 max-w-35 truncate text-right">
                            {p.prodi}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Konfirmasi */}
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <div
              onClick={() => setConfirmed((v) => !v)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                confirmed
                  ? "bg-admin-accent border-admin-accent"
                  : "border-admin-border group-hover:border-admin-accent/50"
              }`}
            >
              {confirmed && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className="text-sm text-admin-text leading-relaxed">
              Saya konfirmasi data penerima sudah final. Email + SK PDF akan
              diantrekan untuk dikirim ke{" "}
              <strong>
                {jalurTerpilih.size > 0
                  ? Array.from(jalurTerpilih)
                      .map((k) => JALUR_OPTIONS.find((j) => j.key === k)?.label)
                      .join(", ")
                  : "jalur yang dipilih"}
              </strong>
              {selectedSK && (
                <>
                  , melampirkan <strong>{selectedSK.nama_file}</strong>
                </>
              )}
              .
            </span>
          </label>

          {/* Status feedback */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 px-4 py-3 bg-admin-accent/10 border border-admin-accent/25 rounded-xl"
              >
                <CheckCircle2
                  size={15}
                  className="text-admin-accent shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm font-semibold text-admin-accent-ink">
                    Email berhasil diantrekan!
                  </p>
                  <p className="text-xs text-admin-accent mt-0.5">
                    Klik <strong>Proses Antrian</strong> di atas untuk mulai
                    pengiriman. Progress dapat dipantau di kartu status antrian.
                  </p>
                </div>
              </motion.div>
            )}
            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-admin-danger-bg border border-admin-danger-border rounded-xl text-sm font-semibold text-admin-danger-text"
              >
                <AlertCircle size={15} /> {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: canSend ? 0.98 : 1 }}
            onClick={handleEnqueue}
            disabled={!canSend}
            className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 bg-admin-danger-bar text-white rounded-xl text-sm font-semibold hover:bg-admin-danger-text disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {sending ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Membuat
                antrian...
              </>
            ) : (
              <>
                <Send size={15} /> Antrekan Pengiriman
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
